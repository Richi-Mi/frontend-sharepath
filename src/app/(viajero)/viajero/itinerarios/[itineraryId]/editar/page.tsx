"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import dynamic from "next/dynamic";
import { format, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

// Store
import {
  useItineraryBuilderStore,
  buildItineraryPayload,
  BuilderActivity,
  BuilderMeta,
  BuilderPlace,
} from "@/lib/itinerary-builder-store";

// API
import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import type { ItinerarioData } from "@/api/interfaces/ApiRoutes";

// Constantes / Utils
import { REGIONS_DATA, RegionKey } from "@/lib/constants/regions";
import { cn } from "@/lib/utils";

// UI
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Reutiliza componentes de "crear"
import { ItineraryHeader } from "../../crear/components/ItineraryHeader";
import { DaySelector } from "../../crear/components/DaySelector";
import { ActivityListPanel } from "../../crear/components/ActivityListPanel";
import { MobileViewToggle } from "../../crear/components/MobileViewToggle";
import { ItinerarySetupDialog } from "../../crear/components/ItinerarySetupDialog";
import { PlaceSearchDialog } from "../../crear/components/PlacesSearchDialog";
import { PlaceInfoDialog } from "../../crear/components/PlaceInfoDialog";

// Mapa (lazy)
const CinematicMap = dynamic(
  () =>
    import("../../crear/components/CinematicMap").then(
      (mod) => mod.CinematicMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-muted/10 animate-pulse flex flex-col items-center justify-center text-muted-foreground gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
        </div>
        <span className="text-xs font-medium tracking-widest uppercase opacity-70">
          Cargando Mapa...
        </span>
      </div>
    ),
  }
);

// --- UTILIDAD (TSP Greedy) ---
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R;
}

function safeDate(input: any): Date {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

export default function EditarItinerarioPage() {
  const router = useRouter();
  const params = useParams<{ itineraryId: string }>();

  //tu folder se llama [itineraryId], así que el param es itineraryId
  const itineraryId = params?.itineraryId ? String(params.itineraryId) : "";

  // --- STORE ---
  const {
    meta,
    actividades,
    hasHydrated,
    setMeta,
    setActivities,
    addActivity,
    removeActivity,
    updateActivity,
  } = useItineraryBuilderStore(useShallow((s) => s));

  // --- UI LOCAL ---
  const [setupOpen, setSetupOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [saveAlertOpen, setSaveAlertOpen] = useState(false);

  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null
  );
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  const [saving, setSaving] = useState(false);
  const [loadingItinerary, setLoadingItinerary] = useState(true);

  const [deleting, setDeleting] = useState(false);

  const handleDeleteItinerary = useCallback(async () => {
    if (!itineraryId) return;

    setDeleting(true);
    try {
      const api = ItinerariosAPI.getInstance();

      //ajusta el nombre del método si en tu API se llama distinto
      await api.deleteItinerario(itineraryId);

      toast.success("Itinerario eliminado");
      router.push("/viajero/itinerarios");
    } catch (e: any) {
      toast.error("No se pudo eliminar", {
        description: e?.message || "Error de conexión con el servidor.",
      });
    } finally {
      setDeleting(false);
    }
  }, [itineraryId, router]);

  // Snapshot para "Descartar cambios"
  const originalSnapshotRef = useRef<{
    meta: BuilderMeta | null;
    actividades: BuilderActivity[];
  }>({ meta: null, actividades: [] });

  // Evitar re-fetch duplicado
  const loadedIdRef = useRef<string | null>(null);

  // --- 1) Cargar itinerario por ID ---
  useEffect(() => {
    if (!hasHydrated) return;
    if (!itineraryId) {
      setLoadingItinerary(false);
      return;
    }
    if (loadedIdRef.current === itineraryId) return;
    loadedIdRef.current = itineraryId;

    (async () => {
      setLoadingItinerary(true);
      try {
        const api = ItinerariosAPI.getInstance();
        const data: ItinerarioData = await api.getItinerarioById(itineraryId);

        // ====== MAPEO DEL JSON REAL ======
        // data: { id, title, actividades: [{ id, fecha, description, lugar{...} }] }
        const mappedActivities: BuilderActivity[] =
          (data as any).actividades
            ?.map((a: any) => {
              const lugar: BuilderPlace = {
                id_api_place: a?.lugar?.id_api_place,
                nombre: a?.lugar?.nombre,
                latitud: Number(a?.lugar?.latitud),
                longitud: Number(a?.lugar?.longitud),
                foto_url: a?.lugar?.foto_url ?? null,
                category: a?.lugar?.category,
                descripcion: a?.lugar?.descripcion,
                mexican_state: a?.lugar?.mexican_state,
                google_score: a?.lugar?.google_score,
                total_reviews: a?.lugar?.total_reviews,
              };

              return {
                id: String(a.id), // importante: store usa string
                fecha: safeDate(a.fecha),
                // en tu JSON viene "description"
                descripcion: a.description ?? a.descripcion ?? "",
                lugar,
                start_time: a.start_time ?? null,
                end_time: a.end_time ?? null,
              } as BuilderActivity;
            })
            .filter(Boolean) ?? [];

        // Derivar rango de fechas si el backend no trae start/end
        const allDates = mappedActivities.map((x) => x.fecha.getTime()).sort();
        const start = allDates.length ? new Date(allDates[0]) : new Date();
        const end = allDates.length
          ? new Date(allDates[allDates.length - 1])
          : new Date();

        // Derivar regiones desde los lugares (mexican_state)
        const regions = uniq(
          mappedActivities.map((x) => x?.lugar?.mexican_state).filter(Boolean)
        ) as string[];

        const mappedMeta: BuilderMeta = {
          title: (data as any).title || "Itinerario",
          // si no hay regiones derivadas, dejamos vacío (el setup dialog te dejará corregirlo)
          regions: (regions.length ? regions : []) as any,
          start,
          end,
          companions: [],
        };

        // Set store
        setMeta(mappedMeta);
        setActivities(mappedActivities);

        // Guardar snapshot original (para descartar cambios)
        originalSnapshotRef.current = {
          meta: mappedMeta,
          actividades: mappedActivities,
        };

        // Si por alguna razón quedó sin meta válido, abre setup
        if (!mappedMeta?.start || !mappedMeta?.end) setSetupOpen(true);
      } catch (e: any) {
        toast.error("No se pudo cargar el itinerario", {
          description: e?.message || "Error de conexión con el servidor.",
        });
      } finally {
        setLoadingItinerary(false);
      }
    })();
  }, [hasHydrated, itineraryId, setMeta, setActivities]);

  // --- 2) Generación de días ---
  const days = useMemo(() => {
    if (!meta?.start || !meta?.end) return [];
    try {
      return eachDayOfInterval({ start: meta.start, end: meta.end }).map(
        (date, idx) => ({
          key: format(date, "yyyy-MM-dd"),
          date,
          label: `Día ${idx + 1}`,
          subtitle: format(date, "d MMM", { locale: es }),
        })
      );
    } catch {
      return [];
    }
  }, [meta?.start, meta?.end]);

  // Autoselección de día
  useEffect(() => {
    if (
      days.length > 0 &&
      (!selectedDayKey || !days.find((d) => d.key === selectedDayKey))
    ) {
      setSelectedDayKey(days[0].key);
    }
  }, [days, selectedDayKey]);

  const currentDay = useMemo(
    () => days.find((d) => d.key === selectedDayKey) || null,
    [days, selectedDayKey]
  );

  const currentDayActivities = useMemo(() => {
    if (!selectedDayKey) return [];
    return actividades.filter(
      (a) => format(a.fecha, "yyyy-MM-dd") === selectedDayKey
    );
  }, [actividades, selectedDayKey]);

  // Centro mapa por región seleccionada (si existe en REGIONS_DATA)
  const initialMapCenter = useMemo(() => {
    if (!meta?.regions || meta.regions.length === 0) return undefined;
    const regionKey = meta.regions[0] as any;
    const regionData = (REGIONS_DATA as any)[regionKey as RegionKey];
    return regionData
      ? { lat: regionData.lat, lng: regionData.lng }
      : undefined;
  }, [meta?.regions]);

  // Progreso (días con al menos 1 actividad)
  const tripProgress = useMemo(() => {
    if (days.length === 0) return 0;
    const filledDays = new Set(
      actividades.map((a) => format(a.fecha, "yyyy-MM-dd"))
    ).size;
    return (filledDays / days.length) * 100;
  }, [days, actividades]);

  // --- 3) Acciones ---
  const handleDiscardChanges = useCallback(() => {
    const snap = originalSnapshotRef.current;
    if (!snap.meta) return;

    if (
      window.confirm(
        "¿Descartar cambios? Se restaurará la última versión cargada/guardada."
      )
    ) {
      setMeta(snap.meta);
      setActivities(snap.actividades);
      toast.info("Cambios descartados.");
    }
  }, [setMeta, setActivities]);

  const handleOptimize = useCallback(async () => {
    if (!currentDay || currentDayActivities.length < 3) {
      toast.warning("Optimización no disponible", {
        description:
          "Necesitas al menos 3 lugares en este día para calcular una ruta.",
      });
      return;
    }

    const toastId = toast.loading("Calculando mejor ruta...");

    await new Promise((r) => setTimeout(r, 600));

    try {
      const items = [...currentDayActivities];
      const startNode = items.shift()!;
      const optimizedPath: BuilderActivity[] = [startNode];

      while (items.length > 0) {
        const current = optimizedPath[optimizedPath.length - 1];
        let bestIdx = -1;
        let minDist = Infinity;

        items.forEach((cand, i) => {
          const d = distanceKm(
            current.lugar.latitud,
            current.lugar.longitud,
            cand.lugar.latitud,
            cand.lugar.longitud
          );
          if (d < minDist) {
            minDist = d;
            bestIdx = i;
          }
        });

        if (bestIdx !== -1) optimizedPath.push(items.splice(bestIdx, 1)[0]);
      }

      const others = actividades.filter(
        (a) => format(a.fecha, "yyyy-MM-dd") !== selectedDayKey
      );
      setActivities([...others, ...optimizedPath]);

      toast.success("Ruta Optimizada", {
        id: toastId,
        description: "Ordenamos los lugares por cercanía.",
      });
    } catch {
      toast.error("Error al optimizar", { id: toastId });
    }
  }, [
    currentDay,
    currentDayActivities,
    actividades,
    selectedDayKey,
    setActivities,
  ]);

  // Pre-validación guardado
  const handlePreSave = () => {
    if (!meta) return;

    if (actividades.length === 0) {
      toast.error("Tu itinerario está vacío", {
        description: "Agrega al menos un lugar para poder guardar.",
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
      return;
    }

    const filledDaysCount = new Set(
      actividades.map((a) => format(a.fecha, "yyyy-MM-dd"))
    ).size;

    if (days.length > 0 && filledDaysCount < days.length) {
      setSaveAlertOpen(true);
    } else {
      void executeSave();
    }
  };

  const handleRuta = useCallback(async () => {
    console.log("Generando ruta automática...");
    const toastId = toast.loading("Buscando recomendaciones...");

    try {
      // 1. Calcular cuántos lugares faltan para tener 5 por día
      const dailyCounts: Record<string, number> = {};
      for (const day of days) {
        dailyCounts[day.key] = 0;
      }
      for (const activity of actividades) {
        const dayKey = format(activity.fecha, "yyyy-MM-dd");
        if (dayKey in dailyCounts) {
          dailyCounts[dayKey]++;
        }
      }

      let neededPlaces = 0;
      const slotsToFill: Date[] = [];
      for (const day of days) {
        const count = dailyCounts[day.key] || 0;
        if (count < 5) {
          const diff = 5 - count;
          neededPlaces += diff;
          for (let i = 0; i < diff; i++) {
            slotsToFill.push(day.date);
          }
        }
      }

      if (neededPlaces === 0) {
        toast.info("¡Itinerario completo!", {
          id: toastId,
          description: "Todos los días tienen 5 o más lugares.",
        });
        return;
      }

      // 2. Pedir recomendaciones
      const api = ItinerariosAPI.getInstance();
      const existingLugarIds = actividades.map((a) => a.lugar.id_api_place);

      const recommendations = await api.getRecommendations({
        lugarIds: existingLugarIds,
        limit: neededPlaces,
      });

      if (!recommendations || recommendations.length === 0) {
        toast.warning("No se encontraron recomendaciones", {
          id: toastId,
          description:
            "Intenta agregar más lugares para mejorar las sugerencias.",
        });
        return;
      }

      // 3. Asignar las recomendaciones a los días que faltan
      const newActivities: BuilderActivity[] = recommendations
        .slice(0, neededPlaces) // Asegurarse de no agregar más de lo necesario
        .map((lugar, index) => {
          const dateForActivity = slotsToFill[index];
          const newActivity: BuilderActivity = {
            id: crypto.randomUUID(),
            fecha: dateForActivity,
            descripcion: "Lugar recomendado automáticamente.",
            lugar: lugar as any, // RecommendedLugar es compatible con BuilderPlace
            start_time: null,
            end_time: null,
          };
          return newActivity;
        });

      // 4. Actualizar el store
      setActivities([...actividades, ...newActivities]);

      toast.success("Itinerario completado", {
        id: toastId,
        description: `Se agregaron ${newActivities.length} nuevos lugares.`,
      });
    } catch (error: any) {
      toast.error("Error al buscar recomendaciones", {
        id: toastId,
        description: error?.message || "No se pudo conectar con el servidor.",
      });
    }
  }, [days, actividades, setActivities]);

  const executeSave = async () => {
  if (!meta || !itineraryId) return;
  setSaveAlertOpen(false);
  setSaving(true);

  try {
    const payload = buildItineraryPayload(meta, actividades);
    await ItinerariosAPI.getInstance().updateItinerario(itineraryId, payload);

    toast.success("¡Itinerario actualizado!", {
      description: "Tus cambios se guardaron correctamente.",
      duration: 2500,
    });

    // Actualiza snapshot
    originalSnapshotRef.current = {
      meta,
      actividades,
    };

    //  REDIRECCIÓN A "MIS ITINERARIOS"
    router.push("/viajero/itinerarios");

  } catch (error: any) {
    toast.error("No se pudo guardar", {
      description: error?.message || "Error de conexión con el servidor.",
    });
  } finally {
    setSaving(false);
  }
};


  // Drag & Drop
  const handleDragEnd = (event: any) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id || !currentDay) return;

    const oldIndex = currentDayActivities.findIndex((a) => a.id === active.id);
    const newIndex = currentDayActivities.findIndex((a) => a.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(currentDayActivities, oldIndex, newIndex);
      const others = actividades.filter(
        (a) => format(a.fecha, "yyyy-MM-dd") !== selectedDayKey
      );
      setActivities([...others, ...reordered]);
    }
  };

  // --- RENDER LOADING ---
  if (!hasHydrated || loadingItinerary) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Cargando itinerario...
          </p>
        </div>
      </div>
    );
  }

  if (!itineraryId) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        No hay <strong>itineraryId</strong> en la URL. Asegúrate de estar en
        <code className="mx-2 rounded bg-muted px-2 py-1">
          /itinerarios/&lt;id&gt;/editar
        </code>
      </div>
    );
  }

  return (
    <>
      {/* MODALS */}
      <ItinerarySetupDialog open={setupOpen} onOpenChange={setSetupOpen} />

      <PlaceSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        currentDay={currentDay}
        allDays={days}
        onSelectDay={setSelectedDayKey}
        // @ts-ignore
        defaultState={meta?.regions?.[0]}
        onAddLugarToDay={(lugar) => {
          if (!currentDay) return;
          addActivity({
            id: crypto.randomUUID(),
            fecha: currentDay.date,
            descripcion: "",
            lugar: lugar as any,
            start_time: null,
            end_time: null,
          });
          toast.success("Agregado al plan", { icon: "📍" });
        }}
      />

      <PlaceInfoDialog
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
        activityId={selectedActivityId}
        allActivities={actividades}
        onUpdate={updateActivity}
      />

      {/* Alerta días vacíos */}
      <AlertDialog open={saveAlertOpen} onOpenChange={setSaveAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" /> Tienes días libres
            </AlertDialogTitle>
            <AlertDialogDescription>
              Algunos días no tienen actividades. ¿Deseas guardar así o seguir
              editando?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>
              Seguir editando
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeSave}
              disabled={saving}
              className="bg-primary"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Guardar de todos modos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* LAYOUT */}
      <div className="flex h-[calc(100vh-4rem)] flex-col bg-background text-foreground overflow-hidden animate-in fade-in duration-500">
        {/* Barra progreso */}
        <div className="w-full bg-muted h-1">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-out"
            style={{ width: `${tripProgress}%` }}
          />
        </div>

        {/* Header */}
        {meta && (
          <ItineraryHeader
            meta={meta}
            mode="edit"
            onEditSetup={() => setSetupOpen(true)}
            onDiscardChanges={handleDiscardChanges}
            onDeleteItinerary={handleDeleteItinerary}
            isDeleting={deleting}
            onOptimize={handleOptimize}
            onSave={handlePreSave}
            onRuta={handleRuta}
            isSaving={saving}
            canOptimize={currentDayActivities.length >= 3}
          />
        )}

        {/* Workspace */}
        <div className="flex flex-1 overflow-hidden relative group/canvas">
          {/* IZQ */}
          <aside
            className={cn(
              "flex flex-col w-full md:w-[440px] lg:w-[500px] bg-background border-r transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] absolute md:relative h-full z-20 shadow-2xl md:shadow-none",
              mobileView === "list"
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            )}
          >
            <DaySelector
              days={days}
              selectedDayKey={selectedDayKey}
              onSelect={setSelectedDayKey}
            />

            <ActivityListPanel
              activities={currentDayActivities}
              currentDayLabel={currentDay?.label || null}
              onAddPlace={() => setSearchOpen(true)}
              onRemoveActivity={removeActivity}
              onViewDetails={(id) => {
                setSelectedActivityId(id);
                setInfoOpen(true);
              }}
              onDragStart={(e) => setActiveDragId(e.active.id as string)}
              onDragEnd={handleDragEnd}
              activeDragId={activeDragId}
            />
          </aside>

          {/* DER */}
          <main
            className={cn(
              "flex-1 relative transition-all duration-500 ease-in-out absolute md:relative inset-0 bg-muted/10 z-10",
              mobileView === "map"
                ? "translate-x-0 opacity-100"
                : "translate-x-full opacity-0 md:translate-x-0 md:opacity-100"
            )}
          >
            <CinematicMap
              activities={actividades.map((a) => ({
                id: a.id,
                nombre: a.lugar.nombre,
                lat: a.lugar.latitud,
                lng: a.lugar.longitud,
                fecha: a.fecha,
                start_time: a.start_time ?? null,
              }))}
              days={days}
              selectedDayKey={selectedDayKey}
              onSelectDay={setSelectedDayKey}
              // @ts-ignore
              initialCenter={initialMapCenter}
            />
          </main>

          <MobileViewToggle view={mobileView} onChange={setMobileView} />
        </div>
      </div>
    </>
  );
}
