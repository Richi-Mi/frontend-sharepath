import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { format } from "date-fns"; // Importante para el payload
import { RegionKey } from "./constants/regions";

// ========== HELPERS ==========

/**
 * Mueve un elemento de la posición `from` a la posición `to`
 * en un nuevo arreglo (no muta el original).
 */
function reinsert<T>(arr: T[], from: number, to: number): T[] {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

// ========== TIPOS ==========

export type BuilderPlace = {
  id_api_place: string;
  nombre: string;
  latitud: number;
  longitud: number;
  foto_url: string | null;
  category?: string;
  descripcion?: string;
  mexican_state?: string;
  google_score?: number;
  total_reviews?: number;
};

export type BuilderActivity = {
  id: string;
  fecha: Date;
  descripcion: string;
  lugar: BuilderPlace;
  start_time: string | null;
  end_time: string | null;
};

export type BuilderMeta = {
  title: string;
  start: Date;
  end: Date;
  regions: RegionKey[];
  // Se eliminó 'visibility' y 'companions' ya no es obligatorio en el setup inicial
  companions: string[];
};

export type RegionValue = "Hidalgo" | "Morelos" | "Querétaro" | "Ciudad de Mexico" | "Estado de Mexico";

type ItineraryBuilderState = {
  meta: BuilderMeta | null;
  actividades: BuilderActivity[];

  // Flag para saber si ya leímos el localStorage (evita errores de hidratación)
  hasHydrated: boolean;

  // Acciones
  setMeta: (meta: BuilderMeta | null) => void;

  setActivities: (
    input: BuilderActivity[] | ((prev: BuilderActivity[]) => BuilderActivity[])
  ) => void;

  // 👇 Nuevo: reemplazar todas las actividades (útil para hidratar al editar)
  setAllActivities: (activities: BuilderActivity[]) => void;

  addActivity: (activity: BuilderActivity) => void;
  updateActivity: (id: string, patch: Partial<BuilderActivity>) => void;
  removeActivity: (id: string) => void;

  // 👇 Nuevo: reordenar actividades dentro de un día específico
  reorderActivities: (
    dayKey: string, // "yyyy-MM-dd"
    activeId: string,
    overId: string
  ) => void;

  // Acción crítica para "Borrar todo"
  reset: () => void;
  // 👇 Alias para flows nuevos (editor) sin romper lo existente
  resetAll: () => void;

  setHasHydrated: (val: boolean) => void;
};

// ========== STORE ==========

export const useItineraryBuilderStore = create<ItineraryBuilderState>()(
  persist(
    (set) => ({
      meta: null,
      actividades: [],
      hasHydrated: false,

      setMeta: (meta) => set({ meta }),

      setActivities: (input) => {
        set((state) => {
          const next =
            typeof input === "function" ? input(state.actividades) : input;
          return { actividades: next };
        });
      },

      // Reemplaza todas las actividades (para hidratar desde la API al editar)
      setAllActivities: (activities) => set({ actividades: activities }),

      addActivity: (activity) => {
        set((state) => ({ actividades: [...state.actividades, activity] }));
      },

      updateActivity: (id, patch) => {
        set((state) => ({
          actividades: state.actividades.map((a) =>
            a.id === id ? { ...a, ...patch } : a
          ),
        }));
      },

      removeActivity: (id) => {
        set((state) => ({
          actividades: state.actividades.filter((a) => a.id !== id),
        }));
      },

      // Reordena actividades SOLO dentro del día indicado
      reorderActivities: (dayKey, activeId, overId) =>
        set((state) => {
          const dayActivities = state.actividades.filter(
            (a) => format(a.fecha, "yyyy-MM-dd") === dayKey
          );
          const others = state.actividades.filter(
            (a) => format(a.fecha, "yyyy-MM-dd") !== dayKey
          );

          const oldIndex = dayActivities.findIndex((a) => a.id === activeId);
          const newIndex = dayActivities.findIndex((a) => a.id === overId);

          if (oldIndex === -1 || newIndex === -1) {
            return {};
          }

          const reordered = reinsert(dayActivities, oldIndex, newIndex);
          return { actividades: [...others, ...reordered] };
        }),

      // Limpia todo el estado y el localStorage (para crear)
      reset: () => set({ meta: null, actividades: [] }),

      // Alias para flows nuevos (editar) sin tocar los usos actuales de reset()
      resetAll: () => set({ meta: null, actividades: [] }),

      setHasHydrated: (val) => set({ hasHydrated: val }),
    }),
    {
      name: "itinerary-storage-v3", // Cambiamos nombre para invalidar versiones viejas rotas
      storage: createJSONStorage(() => localStorage),

      // Convierte strings de ISO date de vuelta a objetos Date reales
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);

        if (state?.meta) {
          state.meta.start = new Date(state.meta.start);
          state.meta.end = new Date(state.meta.end);
        }

        if (state?.actividades) {
          state.actividades = state.actividades.map((a) => ({
            ...a,
            fecha: new Date(a.fecha),
          }));
        }
      },
    }
  )
);

// ========== PAYLOAD HELPER ==========
// Prepara los datos para la API asegurando que las fechas sean correctas
// Lo puedes usar tanto para CREAR como para ACTUALIZAR itinerarios.
export function buildItineraryPayload(
  meta: BuilderMeta,
  actividades: BuilderActivity[]
) {
  return {
    title: meta.title,
    // Visibility eliminado de la UI, lo mandamos hardcodeado o como default
    visibility: "friends",
    regions: meta.regions,
    // Usamos format local para evitar errores de zona horaria (UTC)
    start_date: format(meta.start, "yyyy-MM-dd"),
    end_date: format(meta.end, "yyyy-MM-dd"),

    actividades: actividades.map((a) => ({
      fecha: format(a.fecha, "yyyy-MM-dd"),
      description: a.descripcion || "",
      lugarId: a.lugar.id_api_place,
      start_time: a.start_time || null,
      end_time: a.end_time || null,
    })),
  };
}
