"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  MAX_DAYS,
  Place,
  StateKey,
  centerForStates,
  suggestPlacesByRadius,
} from "@/lib/constants/mock-itinerary-data";

export type Day = {
  id: string; // yyyy-mm-dd
  nombre: string; // "Día 1 (12 nov)"
  places: Place[];
  date: Date;
  notes?: string;
};

type Filters = {
  q: string;
  category: string | null;
  radiusKm: number;
};

type Store = {
  states: StateKey[];
  startDate: string;
  days: Day[];
  activeDayId: string;
  selectedPlaceId: string | null;

  // ui/map
  showMapOnMobile: boolean;
  filters: Filters;
  showRoute: boolean;

  // getters
  activeDay(): Day | null;
  center(): { lat: number; lng: number };

  // acciones
  initDraft: (opts?: {
    startDate?: string;
    days?: number;
    states?: StateKey[];
  }) => void;
  setActiveDay: (id: string) => void;
  addDay: () => void;
  removeActiveDay: () => void;

  setSelectedPlace: (id: string | null) => void;
  setFilters: (p: Partial<Filters>) => void;
  clearFilters: () => void;
  toggleMapMobile: (b: boolean) => void;

  addPlaceToActive: (place: Place) => void;
  movePlaceWithinDay: (
    dayId: string,
    oldIndex: number,
    newIndex: number
  ) => void;
  movePlaceToDay: (placeId: string, toDayId: string) => void;
  removePlaceFromDay: (dayId: string, placeId: string) => void;

  setDayNotes: (dayId: string, notes: string) => void;

  optimizeDayOrder: (dayId: string, startIndex?: number) => void; // greedy
  suggestForActive: () => void;

  setShowRoute: (b: boolean) => void;
};

function labelFor(date: Date, index: number) {
  const fmt = date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });
  return `Día ${index + 1} (${fmt})`;
}
function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export const useItineraryStore = create<Store>()(
  persist(
    (set, get) => ({
      states: ["cdmx"],
      startDate: new Date().toISOString(),
      days: [],
      activeDayId: "",
      selectedPlaceId: null,

      showMapOnMobile: false,
      filters: { q: "", category: null, radiusKm: 25 },
      showRoute: false,

      activeDay() {
        const { activeDayId, days } = get();
        return days.find((d) => d.id === activeDayId) ?? null;
      },
      center() {
        return centerForStates(get().states);
      },

      initDraft(opts) {
        const start = opts?.startDate ? new Date(opts.startDate) : new Date();
        const n = Math.min(opts?.days ?? 2, MAX_DAYS);
        const states = (
          opts?.states?.length ? opts.states : get().states
        ) as StateKey[];

        const newDays: Day[] = Array.from({ length: n }).map((_, i) => {
          const d = addDays(start, i);
          return {
            id: d.toISOString().slice(0, 10), // único por fecha
            nombre: labelFor(d, i),
            places: [],
            date: d,
            notes: "",
          };
        });

        set({
          states,
          startDate: start.toISOString(),
          days: newDays,
          activeDayId: newDays[0]?.id ?? "",
          selectedPlaceId: null,
          showRoute: false,
        });
      },

      setActiveDay(id) {
        set({ activeDayId: id, showRoute: false });
      },

      addDay() {
        const { days, startDate } = get();
        if (days.length >= MAX_DAYS) return;
        const d = addDays(new Date(startDate), days.length);
        const nuevo: Day = {
          id: d.toISOString().slice(0, 10),
          nombre: labelFor(d, days.length),
          places: [],
          date: d,
          notes: "",
        };
        set({ days: [...days, nuevo], activeDayId: nuevo.id });
      },

      removeActiveDay() {
        const { activeDayId, days } = get();
        if (!activeDayId || days.length <= 1) return;
        const idx = days.findIndex((d) => d.id === activeDayId);
        if (idx < 0) return;
        const nextDays = days.filter((d) => d.id !== activeDayId);
        // Reetiquetar manteniendo IDs (fechas) originales
        nextDays.forEach((d, i) => (d.nombre = labelFor(d.date, i)));
        const newActive =
          nextDays[Math.max(0, idx - 1)]?.id ?? nextDays[0]?.id ?? "";
        set({ days: nextDays, activeDayId: newActive, showRoute: false });
      },

      setSelectedPlace(id) {
        set({ selectedPlaceId: id });
      },
      setFilters(p) {
        set({ filters: { ...get().filters, ...p } });
      },
      clearFilters() {
        set({ filters: { q: "", category: null, radiusKm: 25 } });
      },
      toggleMapMobile(b) {
        set({ showMapOnMobile: b });
      },

      addPlaceToActive(place) {
        const { activeDayId, days } = get();
        const di = days.findIndex((d) => d.id === activeDayId);
        if (di < 0) return;
        if (days[di].places.some((x) => x.id_api_place === place.id_api_place))
          return;
        const copy = [...days];
        copy[di] = { ...copy[di], places: [...copy[di].places, place] };
        set({ days: copy });
      },

      movePlaceWithinDay(dayId, oldIndex, newIndex) {
        const { days } = get();
        const di = days.findIndex((d) => d.id === dayId);
        if (di < 0) return;
        const arr = [...days[di].places];
        const el = arr.splice(oldIndex, 1)[0];
        arr.splice(newIndex, 0, el);
        const copy = [...days];
        copy[di] = { ...copy[di], places: arr };
        set({ days: copy });
      },

      movePlaceToDay(placeId, toDayId) {
        const { days } = get();
        const fromIdx = days.findIndex((d) =>
          d.places.some((p) => p.id_api_place === placeId)
        );
        if (fromIdx < 0) return;
        const pl = days[fromIdx].places.find(
          (p) => p.id_api_place === placeId
        )!;

        const copy = [...days];
        copy[fromIdx] = {
          ...copy[fromIdx],
          places: copy[fromIdx].places.filter(
            (p) => p.id_api_place !== placeId
          ),
        };

        const toIdx = copy.findIndex((d) => d.id === toDayId);
        if (
          toIdx >= 0 &&
          !copy[toIdx].places.some((p) => p.id_api_place === placeId)
        ) {
          copy[toIdx] = { ...copy[toIdx], places: [...copy[toIdx].places, pl] };
        }
        set({ days: copy, activeDayId: toDayId, showRoute: false });
      },

      removePlaceFromDay(dayId, placeId) {
        const { days } = get();
        const di = days.findIndex((d) => d.id === dayId);
        if (di < 0) return;
        const copy = [...days];
        copy[di] = {
          ...copy[di],
          places: copy[di].places.filter((p) => p.id_api_place !== placeId),
        };
        set({ days: copy });
      },

      setDayNotes(dayId, notes) {
        const { days } = get();
        const di = days.findIndex((d) => d.id === dayId);
        if (di < 0) return;
        const copy = [...days];
        copy[di] = { ...copy[di], notes };
        set({ days: copy });
      },

      optimizeDayOrder(dayId, startIndex) {
        // greedy nearest neighbor con haversine approximate (mock usando total_reviews como distancia si no hay coords)
        const { days } = get();
        const di = days.findIndex((d) => d.id === dayId);
        if (di < 0) return;
        const src = [...days[di].places];
        if (src.length < 3) return;
        let idx = Math.max(0, Math.min(startIndex ?? 0, src.length - 1));
        const used = new Set<number>([idx]);
        const route = [src[idx]];
        while (route.length < src.length) {
          let best = -1,
            bestScore = Infinity;
          for (let i = 0; i < src.length; i++) {
            if (used.has(i)) continue;
            const a = route[route.length - 1];
            const b = src[i];
            // distancia simple por diferencia de reviews como placeholder
            const score = Math.abs(
              (a.total_reviews ?? 0) - (b.total_reviews ?? 0)
            );
            if (score < bestScore) {
              bestScore = score;
              best = i;
            }
          }
          used.add(best);
          route.push(src[best]);
        }
        const copy = [...days];
        copy[di] = { ...copy[di], places: route };
        set({ days: copy, showRoute: true });
      },

      suggestForActive() {
        const { states, filters } = get();
        const suggested = suggestPlacesByRadius(
          states,
          filters.radiusKm,
          filters.q,
          filters.category as any
        );
        // const best = suggested.slice(0, 5);
        // best.forEach((p) => get().addPlaceToActive(p));
      },

      setShowRoute(b) {
        set({ showRoute: b });
      },
    }),
    { name: "sharepath-itinerary" }
  )
);
