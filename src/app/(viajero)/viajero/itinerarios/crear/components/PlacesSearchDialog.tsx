"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Fuse from "fuse.js";

import {
  Loader2,
  MapPin,
  Search,
  Star,
  Navigation,
  Info,
  ArrowLeft,
  Filter,
  CheckCircle2,
  Plus,
  ListTodo,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Map as MapIcon,
  Trash2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

// API & Store
import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import type { LugarData } from "@/api/interfaces/ApiRoutes";
import { useItineraryBuilderStore } from "@/lib/itinerary-builder-store";
import { REGIONS_DATA } from "@/lib/constants/regions";

// UI Imports
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Utilities de Categoría
import {
  getCategoryStyle,
  getDefaultImageForCategory,
  CATEGORY_MAP,
} from "@/lib/category-utils";

import type { DayInfo } from "./CinematicMap";

// --- CONSTANTES ---
const MAX_PLACES_PER_DAY = 5;

const DYNAMIC_CATEGORY_OPTIONS = Object.entries(CATEGORY_MAP)
  .map(([key, val]) => ({
    value: key,
    label: val.name,
    icon: val.icon,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

// --- UTILIDADES ---
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

// Componente de Estrellas
const StarRating = ({
  score,
  size = 3,
  className,
}: {
  score: number;
  size?: number;
  className?: string;
}) => (
  <div className={cn("flex items-center gap-0.5", className)}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={cn(
          `h-${size} w-${size}`,
          star <= Math.round(score)
            ? "fill-amber-400 text-amber-400"
            : "fill-muted text-muted-foreground/20"
        )}
      />
    ))}
  </div>
);

type PlaceSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allDays: DayInfo[];
  onSelectDay: (dayKey: string) => void;
  currentDay: DayInfo | null;
  onAddLugarToDay: (lugar: LugarData) => void;
  defaultState?: string;
};

export function PlaceSearchDialog({
  open,
  onOpenChange,
  allDays,
  onSelectDay,
  currentDay,
  onAddLugarToDay,
}: PlaceSearchDialogProps) {
  const { meta, actividades, removeActivity } = useItineraryBuilderStore();

  const currentDayActivities = useMemo(() => {
    if (!currentDay) return [];
    return actividades.filter(
      (a) => format(a.fecha, "yyyy-MM-dd") === currentDay.key
    );
  }, [actividades, currentDay]);

  const placesCount = currentDayActivities.length;
  const isFull = placesCount >= MAX_PLACES_PER_DAY;

  // Estados UI
  const [query, setQuery] = useState("");
  const [activeState, setActiveState] = useState<string>("__all__");
  const [activeCategory, setActiveCategory] = useState<string>("__all__");
  const [minRating, setMinRating] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LugarData[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<LugarData | null>(null);
  const [showDailyPreview, setShowDailyPreview] = useState(true);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Regiones disponibles
  const availableRegions = useMemo(() => {
    if (!meta?.regions) return [];
    return meta.regions.map((r) => ({
      value: r,
      label: REGIONS_DATA[r]?.label || r,
      short: REGIONS_DATA[r]?.short || r,
    }));
  }, [meta]);

  // Efecto: Setear región inicial
  useEffect(() => {
    if (open && meta?.regions.length && activeState === "__all__") {
      setActiveState(meta.regions[0]);
    }
    if (!open) {
      setQuery("");
      setSelectedPlace(null);
    }
  }, [open, meta, activeState]);

  // Efecto: Búsqueda (Debounce)
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      void handleSearch();
    }, 500);
    return () => clearTimeout(timer);
  }, [query, activeState, activeCategory, minRating, open]);

  function formatQueryForDatabase(text: string) {
    if (!text) return undefined;
    // Separa por espacios, pone mayúscula la primera letra de cada palabra
    return text.toLowerCase().replace(/(?:^|\s)\S/g, function (a) {
      return a.toUpperCase();
    });
  }

  async function handleSearch() {
    setLoading(true);

    // UX: Si el usuario escribe algo nuevo (más de 2 letras), limpiamos la vista
    // para que sepa que se está procesando una nueva búsqueda.
    if (query.length > 2) setResults([]);

    try {
      const api = ItinerariosAPI.getInstance();

      const stateFilter = activeState !== "__all__" ? activeState : undefined;
      const categoryFilter =
        activeCategory !== "__all__" ? activeCategory : undefined;

      // ---------------------------------------------------------
      // FASE 1: INTENTO DE BÚSQUEDA DIRECTA (BACKEND)
      // ---------------------------------------------------------

      // Intentamos "adivinar" el formato (Title Case) para la BD
      const nombreParaBuscar = query.trim()
        ? formatQueryForDatabase(query.trim())
        : undefined;

      // Si no hay búsqueda de texto, pedimos orden por 'reviews' (Popularidad).
      // Si hay búsqueda, dejamos que la API decida (generalmente por coincidencia).
      const ordenApi = nombreParaBuscar ? "score" : "reviews";

      const resp = await api.getLugares(
        1,
        100,
        stateFilter,
        categoryFilter,
        nombreParaBuscar,
        // ordenApi // <--- Asegúrate de haber agregado este param en tu clase API
      );

      let rawData = Array.isArray(resp) ? resp : (resp as any).lugares || [];

      // Variable para saber si los datos vienen de Fuse (búsqueda difusa)
      let isFuzzyResult = false;

      // ---------------------------------------------------------
      // FASE 2: EL RESCATE (FUSE.JS / FUZZY SEARCH)
      // ---------------------------------------------------------
      if (query.trim() && rawData.length === 0) {
        
        // Esto crea nuestro "pool" de datos donde buscar coincidencias.
        const respBackup = await api.getLugares(
          1,
          100,
          stateFilter,
          categoryFilter,
          undefined, // Sin nombre
          // "reviews"
        );

        const backupData = Array.isArray(respBackup)
          ? respBackup
          : (respBackup as any).lugares || [];

        // B. Configuración de Fuse.js (El cerebro de la búsqueda)
        const fuseOptions = {
          keys: [
            { name: "nombre", weight: 0.7 }, // Prioridad alta al nombre
            { name: "category", weight: 0.2 }, // Prioridad media a categoría
            { name: "mexican_state", weight: 0.1 }, // Prioridad baja al estado
          ],
          threshold: 0.4, // 0.0=Exacto, 0.4=Tolera typos ("myseo"), 1.0=Coincide todo
          ignoreLocation: true, // Busca en cualquier parte del string
          includeScore: true,
        };

        const fuse = new Fuse(backupData, fuseOptions);
        const fuzzyResults = fuse.search(query);

        // C. Extraemos los items. Fuse ya los devuelve ordenados por "Similitud"
        rawData = fuzzyResults.map((result) => result.item);
        isFuzzyResult = true; // Marcamos que usamos búsqueda difusa
      }

      // ---------------------------------------------------------
      // FASE 3: ORDENAMIENTO FINAL INTELIGENTE
      // ---------------------------------------------------------

      // Lógica:
      // 1. Si NO buscamos texto (Vista inicial) -> Ordenar por POPULARIDAD.
      // 2. Si buscamos texto y fue directo a API -> Ordenar por POPULARIDAD (refinamiento).
      // 3. Si usamos Fuse.js -> NO REORDENAR. Fuse ya ordenó por relevancia.

      if (!isFuzzyResult) {
        rawData.sort((a: LugarData, b: LugarData) => {
          const reviewsA = a.total_reviews || 0;
          const reviewsB = b.total_reviews || 0;

          // Criterio 1: Cantidad de Opiniones (Mayor a menor)
          if (reviewsB !== reviewsA) {
            return reviewsB - reviewsA;
          }
          // Criterio 2: Desempate por Calificación
          return (b.google_score || 0) - (a.google_score || 0);
        });
      }

      setResults(rawData);
    } catch (e) {
      console.error("Search error:", e);
      toast.error("No se pudieron cargar los lugares");
    } finally {
      setLoading(false);
    }
  }
  // Sugerencias Locales
  const nearbySuggestions = useMemo(() => {
    if (!selectedPlace || results.length === 0) return [];

    return results
      .filter((l) => l.id_api_place !== selectedPlace.id_api_place)
      .map((l) => ({
        ...l,
        distance: distanceKm(selectedPlace, l),
      }))
      .filter((l) => l.distance < 10)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [selectedPlace, results]);

  const handleAdd = (lugar: LugarData) => {
    if (isFull) {
      toast.error("Día Completo", {
        description: `Límite de ${MAX_PLACES_PER_DAY} lugares alcanzado.`,
      });
      return;
    }
    onAddLugarToDay(lugar);
    setJustAddedId(lugar.id_api_place);
    setTimeout(() => setJustAddedId(null), 2500);
  };

  const handleRemove = (id: string) => {
    const activityToRemove = currentDayActivities.find(
      (a) => a.lugar.id_api_place === id
    );
    if (activityToRemove) {
      removeActivity(activityToRemove.id);
      toast.success("Lugar eliminado");
    }
  };

  const isAdded = (id_place: string) =>
    currentDayActivities.some((a) => a.lugar.id_api_place === id_place);

  const { dayIndex, canGoNext, canGoPrev } = useMemo(() => {
    if (!currentDay || !allDays || allDays.length === 0) {
      return { dayIndex: -1, canGoNext: false, canGoPrev: false };
    }
    const idx = allDays.findIndex((d) => d.key === currentDay.key);
    return {
      dayIndex: idx,
      canGoNext: idx < allDays.length - 1,
      canGoPrev: idx > 0,
    };
  }, [currentDay, allDays]);

  const handleDayChange = (direction: "next" | "prev") => {
    if (direction === "next" && canGoNext) {
      onSelectDay(allDays[dayIndex + 1].key);
    } else if (direction === "prev" && canGoPrev) {
      onSelectDay(allDays[dayIndex - 1].key);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[95vh] w-[98vw] max-w-[98vw] flex-col gap-0 overflow-hidden rounded-xl border-border/50 p-0 shadow-2xl sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[1300px] bg-background">
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-20 relative">
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-lg font-bold tracking-tight flex items-center gap-2 dark:text-white">
              <Search className="h-5 w-5 text-primary" />
              Explorar Lugares
            </DialogTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{results.length} resultados</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={() => handleDayChange("prev")}
                  disabled={!canGoPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium text-foreground">
                  {currentDay?.label || "Sin día"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={() => handleDayChange("next")}
                  disabled={!canGoNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentDay && (
              <Badge
                variant={isFull ? "destructive" : "default"}
                className="h-8 px-3 gap-2 text-xs font-medium border hidden sm:flex"
              >
                <ListTodo className="h-3.5 w-3.5" />
                {placesCount}/{MAX_PLACES_PER_DAY}
              </Badge>
            )}
            <DialogClose className="rounded-full p-2 hover:bg-muted transition-colors">
              <X className="h-5 w-5 text-muted-foreground" />
            </DialogClose>
          </div>
        </div>

        {/* BODY (FLEX COLUMNAS) */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* COLUMNA IZQUIERDA */}
          <div
            className={cn(
              "flex w-full flex-col border-r bg-muted/10 transition-all duration-300 md:w-[450px] lg:w-[500px]",
              selectedPlace ? "hidden md:flex" : "flex"
            )}
          >
            {/* FILTROS */}
            <div className="p-4 space-y-4 bg-background border-b z-10 shadow-sm shrink-0 dark:text-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  className="pl-9 h-10 bg-muted/30 border-input focus-visible:bg-background transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Select value={activeState} onValueChange={setActiveState}>
                  <SelectTrigger className="h-8 text-xs flex-1 bg-background truncate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Mis Destinos</SelectItem>
                    {availableRegions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.short}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={activeCategory}
                  onValueChange={setActiveCategory}
                >
                  <SelectTrigger className="h-8 text-xs flex-1 bg-background truncate">
                    <div className="flex items-center gap-2 truncate">
                      <Filter className="h-3 w-3 opacity-50 shrink-0" />
                      <SelectValue placeholder="Categoría" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="__all__">Todas</SelectItem>
                    {DYNAMIC_CATEGORY_OPTIONS.map((c) => {
                      const Icon = c.icon;
                      return (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-2">
                            {Icon && (
                              <Icon className="h-3 w-3 text-muted-foreground" />
                            )}
                            {c.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 px-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground w-12 shrink-0">
                  Rating
                </span>
                <div className="flex-1 flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/50 overflow-x-auto no-scrollbar">
                  {[0, 3, 4, 4.5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setMinRating(r)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1 text-[10px] py-1.5 px-2 rounded-md transition-all font-medium whitespace-nowrap",
                        minRating === r
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "hover:bg-background/80 text-muted-foreground"
                      )}
                    >
                      {r === 0 ? (
                        "Todos"
                      ) : (
                        <>
                          <span className="font-bold">{r}</span>
                          <Star className="h-3 w-3 fill-current" />
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* LISTA DE RESULTADOS */}
            <div className="flex-1 overflow-hidden relative bg-muted/5">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-2 pb-32">
                  {loading && (
                    <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3 animate-pulse">
                      <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                      <p className="text-sm">Buscando...</p>
                    </div>
                  )}

                  {!loading && results.length === 0 && (
                    <div className="py-20 text-center text-muted-foreground space-y-3 px-6">
                      <Search className="h-10 w-10 mx-auto opacity-20" />
                      <p className="text-sm font-medium">Sin resultados</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setQuery("");
                          setActiveCategory("__all__");
                          setMinRating(0);
                        }}
                      >
                        Limpiar filtros
                      </Button>
                    </div>
                  )}

                  {results.map((place) => {
                    const style = getCategoryStyle(place.category);
                    const alreadyAdded = isAdded(place.id_api_place);
                    const isSelected =
                      selectedPlace?.id_api_place === place.id_api_place;

                    return (
                      <div
                        key={place.id_api_place}
                        onClick={() => setSelectedPlace(place)}
                        className={cn(
                          "group relative flex gap-2 p-2.5 rounded-xl w-120 border cursor-pointer transition-all duration-200 overflow-hidden",
                          isSelected
                            ? "bg-primary/5 border-primary/40 shadow-[0_0_0_1px_rgba(var(--primary),0.2)]"
                            : "bg-card border-border/60 hover:border-primary/20 hover:shadow-sm"
                        )}
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted border border-border/50">
                          <Image
                            src={
                              place.foto_url ||
                              getDefaultImageForCategory(place.category)
                            }
                            alt={place.nombre}
                            fill
                            className="object-cover transition-transform group-hover:scale-110"
                            sizes="80px"
                          />
                          {alreadyAdded && (
                            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in">
                              <div className="bg-green-500 rounded-full p-1 shadow-sm">
                                <CheckCircle2 className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* FIX: min-w-0 para truncar correctamente en flex */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                          <div className="flex justify-between items-start gap-2">
                            <h4
                              className={cn(
                                "font-semibold text-sm leading-tight truncate pr-1",
                                isSelected ? "text-primary" : "text-foreground"
                              )}
                            >
                              {place.nombre}
                            </h4>
                            {place.google_score &&
                              place.google_score >= 4.6 && (
                                <Badge
                                  variant="secondary"
                                  className="h-4 px-1 text-[9px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800 shrink-0"
                                >
                                  TOP
                                </Badge>
                              )}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span
                              className={cn(
                                "font-medium truncate max-w-[100px]",
                                style.color
                              )}
                            >
                              {style.name}
                            </span>
                            <span className="shrink-0">•</span>
                            <span className="truncate max-w-[80px]">
                              {place.mexican_state}
                            </span>
                          </div>

                          {place.google_score && (
                            <div className="flex items-center gap-1 text-xs mt-0.5">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="font-medium text-foreground">
                                {place.google_score.toFixed(1)}
                              </span>
                              <span className="text-muted-foreground text-[10px]">
                                ({place.total_reviews})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* MINI PREVIEW (Bottom) */}
              <div className="absolute bottom-0 left-0 right-0 z-30 bg-background border-t shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
                <button
                  onClick={() => setShowDailyPreview(!showDailyPreview)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/10 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold border",
                        isFull
                          ? "bg-red-100 text-red-600 border-red-200"
                          : "bg-primary/10 text-primary border-primary/20"
                      )}
                    >
                      {placesCount}
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      Plan: {currentDay?.label}
                    </span>
                  </div>
                  {showDailyPreview ? (
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  ) : (
                    <ChevronUp className="h-4 w-4 opacity-50" />
                  )}
                </button>

                {showDailyPreview && (
                  <div className="px-4 pb-4 pt-1 bg-background animate-in slide-in-from-bottom-5 dark:text-white">
                    <div className="max-h-[140px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-muted">
                      {currentDayActivities.length === 0 ? (
                        <p className="text-[11px] text-center py-4 text-muted-foreground/60 italic">
                          Vacío.
                        </p>
                      ) : (
                        currentDayActivities.map((act, i) => (
                          <div
                            key={act.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-transparent hover:border-border hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="text-[10px] font-mono text-muted-foreground w-3 shrink-0 text-center">
                                {i + 1}
                              </span>
                              <span className="text-xs font-medium truncate">
                                {act.lugar.nombre}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(act.lugar.id_api_place);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded transition-all shrink-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: DETALLES */}
          <div
            className={cn(
              "relative flex-1 flex-col bg-background transition-all duration-300 h-full overflow-hidden border-l",
              selectedPlace
                ? "flex z-40 md:z-auto fixed inset-0 md:static"
                : "hidden md:flex"
            )}
          >
            {selectedPlace ? (
              <div className="flex flex-col h-full bg-background animate-in fade-in zoom-in-95 duration-200">
                {/* Botón Volver (Móvil) */}
                <div className="md:hidden absolute top-4 left-4 z-50">
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full shadow-lg h-10 w-10 bg-background/80 backdrop-blur-md"
                    onClick={() => setSelectedPlace(null)}
                  >
                    <ArrowLeft className="h-5 w-5 " />
                  </Button>
                </div>

                {/* HERO */}
                <div className="relative h-64 md:h-72 w-full bg-muted shrink-0 group">
                  <Image
                    src={
                      selectedPlace.foto_url ||
                      getDefaultImageForCategory(selectedPlace.category)
                    }
                    alt={selectedPlace.nombre}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <Badge
                      className={cn(
                        "mb-3 border-0 backdrop-blur-md px-3 py-1 text-[10px] uppercase tracking-widest shadow-sm",
                        getCategoryStyle(selectedPlace.category).bg,
                        getCategoryStyle(selectedPlace.category).color
                      )}
                    >
                      {getCategoryStyle(selectedPlace.category).name}
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight tracking-tight shadow-sm text-balance">
                      {selectedPlace.nombre}
                    </h2>
                    <div className="flex items-center gap-2 mt-2 text-sm font-medium text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {selectedPlace.mexican_state}, México
                    </div>
                  </div>
                </div>

                {/* DETALLES */}
                <div className="flex-1 overflow-hidden relative">
                  <ScrollArea className="h-full">
                    <div className="p-6 md:p-8 space-y-8 pb-32">
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                            Calificación
                          </p>
                          <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold dark:text-white">
                              {selectedPlace.google_score?.toFixed(1) || "-"}
                            </span>
                            <div className="mb-1.5">
                              <StarRating
                                score={selectedPlace.google_score || 0}
                                size={4}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                            Opiniones
                          </p>
                          <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold dark:text-white">
                              {selectedPlace.total_reviews
                                ? (selectedPlace.total_reviews / 1000).toFixed(
                                    1
                                  ) + "k"
                                : 0}
                            </span>
                            <span className="text-xs text-muted-foreground mb-1.5 font-medium">
                              reseñas
                            </span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Info */}
                      <div className="space-y-3">
                        <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
                          <Info className="h-5 w-5 text-primary " /> Acerca del
                          lugar
                        </h3>
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                          {selectedPlace.descripcion ||
                            `Disfruta de una experiencia única en ${
                              selectedPlace.nombre
                            }. Ideal para quienes buscan ${getCategoryStyle(
                              selectedPlace.category
                            ).name.toLowerCase()} en ${
                              selectedPlace.mexican_state
                            }.`}
                        </p>
                      </div>

                      {/* Sugerencias */}
                      {nearbySuggestions.length > 0 && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 delay-100 pt-4">
                          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-500" />{" "}
                            Joyas cercanas
                          </h3>
                          <div className="grid grid-cols-1 gap-3">
                            {nearbySuggestions.map((s) => (
                              <div
                                key={s.id_api_place}
                                onClick={() => setSelectedPlace(s)}
                                className="flex gap-3 p-2 rounded-xl bg-card border hover:border-primary/40 hover:shadow-md cursor-pointer transition-all dark:text-white"
                              >
                                <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden relative shrink-0 border">
                                  <Image
                                    src={
                                      s.foto_url ||
                                      getDefaultImageForCategory(s.category)
                                    }
                                    alt={s.nombre}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex flex-col justify-center min-w-0">
                                  <p className="text-sm font-bold truncate">
                                    {s.nombre}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {getCategoryStyle(s.category).name}
                                  </p>
                                  <p className="text-[10px] text-green-600 font-medium mt-1">
                                    A {s.distance.toFixed(1)} km
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t bg-background/95 backdrop-blur z-20">
                  <div className="flex items-center justify-between gap-4">
                    <div className="hidden md:block text-xs text-muted-foreground">
                      {isAdded(selectedPlace.id_api_place)
                        ? "Este lugar ya está en tu itinerario."
                        : isFull
                        ? "Día lleno."
                        : "Listo para añadir."}
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedPlace(null)}
                        className="flex-1 md:flex-none dark:text-white"
                      >
                        Cerrar
                      </Button>

                      <Button
                        onClick={() =>
                          selectedPlace && handleAdd(selectedPlace)
                        }
                        disabled={
                          isAdded(selectedPlace.id_api_place) ||
                          (isFull && !isAdded(selectedPlace.id_api_place))
                        }
                        className={cn(
                          "flex-1 md:min-w-[200px] transition-all duration-300 font-semibold shadow-lg",
                          justAddedId === selectedPlace.id_api_place
                            ? "bg-green-600 hover:bg-green-700 text-white shadow-green-200"
                            : isFull && !isAdded(selectedPlace.id_api_place)
                            ? "opacity-50 cursor-not-allowed"
                            : "bg-primary text-primary-foreground shadow-primary/20"
                        )}
                      >
                        {justAddedId === selectedPlace.id_api_place ? (
                          <>
                            {" "}
                            <CheckCircle2 className="mr-2 h-5 w-5" /> ¡Agregado!{" "}
                          </>
                        ) : isAdded(selectedPlace.id_api_place) ? (
                          <>
                            {" "}
                            <CheckCircle2 className="mr-2 h-4 w-4" /> En el plan{" "}
                          </>
                        ) : isFull ? (
                          <>
                            {" "}
                            <AlertCircle className="mr-2 h-4 w-4" /> Día Lleno{" "}
                          </>
                        ) : (
                          <>
                            {" "}
                            <Plus className="mr-2 h-5 w-5" /> Agregar{" "}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // EMPTY STATE
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-muted/5 animate-in fade-in duration-500">
                <div className="w-64 h-64 bg-gradient-to-tr from-primary/10 to-blue-500/10 rounded-full blur-3xl absolute opacity-50" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="h-24 w-24 bg-background rounded-3xl shadow-xl flex items-center justify-center mb-6 rotate-3 border border-border/50">
                    <MapIcon className="h-12 w-12 text-primary/60" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Selecciona un lugar
                  </h3>
                  <p className="text-muted-foreground max-w-xs mt-3 leading-relaxed">
                    Explora la lista y haz clic en un lugar para ver detalles.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
