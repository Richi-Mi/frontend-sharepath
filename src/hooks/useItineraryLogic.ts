"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";

// Store y API
import {
  useItineraryBuilderStore,
  buildItineraryPayload,
  type BuilderActivity,
} from "@/lib/itinerary-builder-store";
import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import { CreateLugarRequest } from "@/api/interfaces/ApiRoutes";

// Utils
function distanceKm(
  a: { latitud: number; longitud: number },
  b: { latitud: number; longitud: number }
) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitud - a.latitud);
  const dLon = toRad(b.longitud - a.longitud);
  const lat1 = toRad(a.latitud);
  const lat2 = toRad(b.latitud);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function useItineraryLogic() {
  const router = useRouter();

  // Estado local para UI de carga
  const [isSaving, setIsSaving] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Acceso al Store
  const { meta, actividades, setActivities } =
    useItineraryBuilderStore();

  // ========================================================================
  // 1. LÓGICA DE OPTIMIZACIÓN (Algoritmo Vecino Más Cercano)
  // ========================================================================
  const optimizeRoute = (dayDate: Date) => {
    const dayKey = format(dayDate, "yyyy-MM-dd");

    // Filtramos actividades de ESE día
    const currentItems = actividades.filter(
      (a) => format(a.fecha, "yyyy-MM-dd") === dayKey
    );

    const otherItems = actividades.filter(
      (a) => format(a.fecha, "yyyy-MM-dd") !== dayKey
    );

    if (currentItems.length <= 2) {
      toast.info("Agrega al menos 3 lugares para optimizar la ruta.");
      return;
    }

    setIsOptimizing(true);

    // Simulación de proceso pesado (para UX)
    setTimeout(() => {
      try {
        // Algoritmo Greedy: Nearest Neighbor
        // Asumimos que el PRIMER elemento es el punto de partida fijo (ej. Hotel o Desayuno)
        const remaining = [...currentItems];
        const ordered: BuilderActivity[] = [remaining.shift()!];

        while (remaining.length > 0) {
          const current = ordered[ordered.length - 1];
          let bestIdx = -1;
          let minDst = Infinity;

          // Buscar el más cercano al actual
          remaining.forEach((candidate, i) => {
            const dst = distanceKm(current.lugar, candidate.lugar);
            if (dst < minDst) {
              minDst = dst;
              bestIdx = i;
            }
          });

          // Mover el mejor candidato a la lista ordenada
          if (bestIdx !== -1) {
            ordered.push(remaining.splice(bestIdx, 1)[0]);
          } else {
            // Fallback por si acaso (no debería pasar)
            ordered.push(remaining.shift()!);
          }
        }

        // Actualizar Store
        setActivities([...otherItems, ...ordered]);
        toast.success("Ruta optimizada por cercanía 🚀");
      } catch (error) {
        console.error(error);
        toast.error("Error al optimizar la ruta.");
      } finally {
        setIsOptimizing(false);
      }
    }, 600);
  };

  // ========================================================================
  // 2. LÓGICA DE GUARDADO ORQUESTADO (Places -> Itinerary)
  // ========================================================================
  const saveItinerary = async () => {
    // A. Validaciones Previas
    if (!meta) {
      toast.error("Falta la configuración del viaje.");
      return;
    }
    if (actividades.length === 0) {
      toast.error("Tu itinerario está vacío.", {
        description: "Agrega al menos un lugar antes de guardar.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const api = ItinerariosAPI.getInstance();

      // B. Extracción de Lugares Únicos
      // Necesitamos asegurarnos que cada lugar exista en la BD antes de crear el itinerario
      // para evitar errores de Foreign Key.
      const uniquePlacesMap = new Map();
      actividades.forEach((act) => {
        uniquePlacesMap.set(act.lugar.id_api_place, act.lugar);
      });
      const uniquePlaces = Array.from(uniquePlacesMap.values());

      // C. Sincronización de Lugares (Paralelo)
      // Intentamos crear TODOS. Si uno ya existe, el backend debe devolver 200 o 409.
      // Aquí capturamos errores individuales para no detener el flujo si un lugar ya existe.
      await Promise.all(
        uniquePlaces.map(async (place: any) => {
          try {
            const placePayload: CreateLugarRequest = {
              id_api_place: place.id_api_place,
              nombre: place.nombre,
              latitud: place.latitud,
              longitud: place.longitud,
              foto_url: place.foto_url || "",
              category: place.category || "tourist_attraction",
              mexican_state: place.mexican_state || "Desconocido", // Fallback seguro
              google_score: place.google_score || 0,
              total_reviews: place.total_reviews || 0,
              descripcion: place.descripcion || "",
            };
            await api.createLugar(placePayload);
          } catch (e) {
            // Ignoramos errores de "Lugar ya existe".
            // Si es otro error crítico, el itinerario fallará después, lo cual es aceptable.
            // console.log(`Lugar ${place.nombre} posiblemente ya existe o error menor.`);
          }
        })
      );

      // D. Creación del Itinerario
      const payload = buildItineraryPayload(meta, actividades);
      const response = await api.createItinerario(payload);

      // E. Éxito
      toast.success("¡Itinerario guardado!", {
        description: `"${response.title}" se ha creado correctamente.`,
      });

      // Limpiar y Redirigir
      // clear();
      router.push("/viajero/itinerarios");
      // O redirigir al detalle: router.push(`/viajero/itinerarios/${response.id}`);
    } catch (error: any) {
      console.error("Error saving itinerary:", error);
      toast.error("No pudimos guardar tu viaje", {
        description:
          error.message || "Ocurrió un error de conexión. Intenta de nuevo.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    isOptimizing,
    optimizeRoute,
    saveItinerary,
  };
}
