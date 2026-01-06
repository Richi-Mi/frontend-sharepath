"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
  ZoomControl,
  Polyline,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";

// --- ESTILOS ---
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// --- UTILIDADES ---
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Clock,
  Footprints,
  Layers,
  LocateFixed,
  Map as MapIcon,
  Navigation,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- TIPOS ---
export type MapActivity = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  fecha: Date;
  start_time?: string | null;
};

export type DayInfo = {
  key: string;
  date: Date;
  label: string;
  subtitle: string;
};

export type CinematicMapProps = {
  activities: MapActivity[];
  days: DayInfo[];
  selectedDayKey: string | null;
  onSelectDay: (key: string) => void;
  initialCenter?: { lat: number; lng: number };
};

// --- ICONOS PERSONALIZADOS ---
const createCustomIcon = (
  index: number,
  type: "start" | "end" | "mid",
  isActive: boolean
) => {
  if (typeof window === "undefined") return undefined;

  let colorClass = "bg-blue-600 border-white";
  let sizeClass = "h-8 w-8";
  let zIndex = 100;

  if (isActive) {
    colorClass = "bg-amber-500 border-amber-200 shadow-amber-500/50";
    sizeClass = "h-10 w-10 text-lg";
    zIndex = 1000;
  } else if (type === "start") {
    colorClass = "bg-emerald-600 border-white";
  } else if (type === "end") {
    colorClass = "bg-rose-600 border-white";
  }

  return L.divIcon({
    className: "custom-pin-icon",
    html: `
      <div class="relative flex items-center justify-center group cursor-pointer" style="z-index: ${zIndex}">
        ${
          isActive
            ? `<div class="absolute -inset-2 bg-amber-400/30 rounded-full animate-ping"></div>`
            : ""
        }
        <div class="absolute -bottom-1 h-3 w-3 rotate-45 bg-current ${
          isActive
            ? "text-amber-500"
            : colorClass.split(" ")[0].replace("bg-", "text-")
        } transition-transform"></div>
        <div class="relative z-10 flex ${sizeClass} items-center justify-center rounded-full border-2 text-white shadow-lg ${colorClass} transition-all duration-300 transform ${
      isActive ? "scale-110 -translate-y-2" : "group-hover:-translate-y-1"
    }">
          <span class="font-bold ${isActive ? "text-sm" : "text-xs"}">${
      index + 1
    }</span>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// --- NAVEGADOR DE TOUR ---
function TourNavigator({
  currentIndex,
  total,
  currentName,
  onNext,
  onPrev,
}: {
  currentIndex: number;
  total: number;
  currentName: string;
  onNext: () => void;
  onPrev: () => void;
}) {
  if (total === 0) return null;

  return (
    <div
      className={cn(
        "absolute left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2 animate-in fade-in duration-500",
        // MÓVIL: Parte superior (debajo de días) | DESKTOP: Parte inferior
        "top-24 md:top-auto md:bottom-8"
      )}
    >
      <div className="flex items-center bg-background/95 backdrop-blur-md border border-border/50 rounded-full shadow-2xl p-1 pr-4 ring-1 ring-black/5">
        <div className="flex gap-1 mr-3">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full hover:bg-muted"
            onClick={onPrev}
            disabled={currentIndex === -1 || currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full hover:bg-muted"
            onClick={onNext}
            disabled={currentIndex === total - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col min-w-[100px] max-w-[160px] text-left">
          <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider leading-none mb-0.5">
            {currentIndex === -1
              ? "General"
              : `Lugar ${currentIndex + 1}/${total}`}
          </span>
          <span className="text-xs font-semibold truncate leading-tight">
            {currentIndex === -1 ? "Mapa de Ruta" : currentName}
          </span>
        </div>

        <div className="ml-2 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <MapPin className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}

// --- CONTROLADOR DE CÁMARA ---
function MapController({
  activities,
  center,
  activeIndex,
  shouldFly,
  setShouldFly,
}: {
  activities: MapActivity[];
  center: LatLngExpression;
  activeIndex: number;
  shouldFly: boolean;
  setShouldFly: (v: boolean) => void;
}) {
  const map = useMap();

  useEffect(() => {
    // 1. Zoom al lugar activo
    if (activeIndex !== -1 && activities[activeIndex]) {
      const target = activities[activeIndex];
      map.flyTo([target.lat, target.lng], 16, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
      return;
    }

    // 2. Vista general
    if (shouldFly) {
      if (activities.length > 0) {
        try {
          const bounds = L.latLngBounds(activities.map((a) => [a.lat, a.lng]));
          if (bounds.isValid()) {
            map.flyToBounds(bounds, { padding: [80, 80], duration: 1.2 });
          }
        } catch (e) {}
      } else {
        map.flyTo(center, 12, { duration: 1.5 });
      }
      setShouldFly(false);
    }
  }, [map, activities, center, activeIndex, shouldFly, setShouldFly]);

  return null;
}

// --- CAPA DE RUTAS (SÓLIDA) ---
function RoutingLayer({
  activities,
  onSummaryFound,
}: {
  activities: MapActivity[];
  onSummaryFound: (summary: {
    totalDistance: number;
    totalTime: number;
  }) => void;
}) {
  const map = useMap();
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    if (!map || typeof window === "undefined") return;

    const init = async () => {
      if (!L.Routing) {
        try {
          await import("leaflet-routing-machine");
        } catch (e) {
          return;
        }
      }

      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {}
        routingControlRef.current = null;
      }

      if (activities.length < 2) {
        onSummaryFound({ totalDistance: 0, totalTime: 0 });
        return;
      }

      const waypoints = activities.map((a) => L.latLng(a.lat, a.lng));

      try {
        const control = L.Routing.control({
          waypoints,
          router: L.Routing.osrmv1({
            serviceUrl: "https://router.project-osrm.org/route/v1",
            profile: "car",
          }),
          lineOptions: {
            // RUTA SÓLIDA AZUL
            styles: [{ color: "#2563eb", opacity: 0.9, weight: 4 }],
            extendToWaypoints: true,
            missingRouteTolerance: 100,
          },
          show: false,
          addWaypoints: false,
          // draggableWaypoints: false,
          fitSelectedRoutes: false,
          // createMarker: () => null,
        });

        control.on("routesfound", function (e: any) {
          const routes = e.routes;
          if (routes && routes.length > 0) {
            onSummaryFound(routes[0].summary);
          }
        });

        control.addTo(map);
        routingControlRef.current = control;
      } catch (error) {}
    };

    init();

    return () => {
      if (routingControlRef.current && map) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {}
      }
    };
  }, [map, activities, onSummaryFound]);

  return null;
}

// --- COMPONENTE PRINCIPAL ---
export function CinematicMap({
  activities,
  days,
  selectedDayKey,
  onSelectDay,
  initialCenter,
}: CinematicMapProps) {
  const [mapKey] = useState(() => `map-${Math.random().toString(36).slice(2)}`);
  const [mapStyle, setMapStyle] = useState<"streets" | "satellite">("streets");
  const [stats, setStats] = useState({ totalDistance: 0, totalTime: 0 });
  const [shouldFly, setShouldFly] = useState(true);
  const [activeActivityIndex, setActiveActivityIndex] = useState<number>(-1);

  const effectiveDayKey = selectedDayKey ?? (days.length ? days[0].key : null);

  const visibleActivities = useMemo(() => {
    if (!effectiveDayKey) return [] as MapActivity[];
    return activities
      .filter((a) => format(a.fecha, "yyyy-MM-dd") === effectiveDayKey)
      .sort((a, b) =>
        (a.start_time || "00:00").localeCompare(b.start_time || "00:00")
      );
  }, [activities, effectiveDayKey]);

  useEffect(() => {
    setShouldFly(true);
    setActiveActivityIndex(-1);
  }, [effectiveDayKey]);

  const center: LatLngExpression = useMemo(() => {
    if (initialCenter) return [initialCenter.lat, initialCenter.lng];
    if (visibleActivities.length > 0)
      return [visibleActivities[0].lat, visibleActivities[0].lng];
    return [19.4326, -99.1332];
  }, [visibleActivities, initialCenter]);

  const handleNext = () => {
    if (activeActivityIndex < visibleActivities.length - 1)
      setActiveActivityIndex((prev) => prev + 1);
  };
  const handlePrev = () => {
    if (activeActivityIndex > 0) setActiveActivityIndex((prev) => prev - 1);
    else {
      setActiveActivityIndex(-1);
      setShouldFly(true);
    }
  };

  const tiles = {
    streets:
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    satellite:
      // "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      "https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.jpg",
  };

  // Formato stats
  const distanceKm = (stats.totalDistance / 1000).toFixed(1);
  const timeHours = Math.floor(stats.totalTime / 3600);
  const timeMinutes = Math.floor((stats.totalTime % 3600) / 60);
  const timeString =
    timeHours > 0 ? `${timeHours}h ${timeMinutes}m` : `${timeMinutes} min`;

  return (
    <div className="relative h-full w-full overflow-hidden bg-muted/20 group">
      {/* 1. BARRA DE DÍAS (Top Center) */}
      <div className="absolute left-0 right-0 top-4 z-[400] flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto flex max-w-full overflow-x-auto rounded-full bg-background/90 p-1 shadow-lg backdrop-blur-md border border-border/50 scrollbar-hide">
          {days.length > 0 &&
            days.map((d) => {
              const active = d.key === effectiveDayKey;
              return (
                <button
                  key={d.key}
                  onClick={() => onSelectDay(d.key)}
                  className={cn(
                    "flex shrink-0 flex-col items-center justify-center min-w-[60px] py-1 px-3 rounded-full transition-all duration-200",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                    {d.label.replace("Día ", "D")}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] font-medium leading-none mt-0.5",
                      active ? "opacity-90" : "opacity-60"
                    )}
                  >
                    {d.subtitle.split(" ")[0]} {d.subtitle.split(" ")[1]}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {/* 2. ESTADÍSTICAS (Móvil: Arriba Izq / Desktop: Abajo Izq) */}
      {visibleActivities.length > 1 && (
        <div
          className={cn(
            "absolute z-[400] pointer-events-none animate-in fade-in zoom-in-95 duration-500",
            "top-20 left-4 md:top-auto md:bottom-8 md:left-4" // POSICIONAMIENTO RESPONSIVO
          )}
        >
          <div className="pointer-events-auto flex flex-col md:flex-row md:items-center gap-1 md:gap-3 rounded-xl bg-background/90 px-3 py-2 text-foreground shadow-xl backdrop-blur-md border border-border/50">
            <div className="flex items-center gap-2">
              <Footprints className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-bold">{distanceKm} km</span>
            </div>
            <div className="hidden md:block h-4 w-px bg-border"></div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-bold">{timeString}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. NAVEGADOR DEL TOUR (Móvil: Arriba Centro / Desktop: Abajo Centro) */}
      {visibleActivities.length > 0 && (
        <TourNavigator
          currentIndex={activeActivityIndex}
          total={visibleActivities.length}
          currentName={
            activeActivityIndex >= 0
              ? visibleActivities[activeActivityIndex].nombre
              : ""
          }
          onNext={handleNext}
          onPrev={handlePrev}
        />
      )}

      {/* 4. CONTROLES (Derecha Superior) */}
      <div className="absolute right-3 top-20 z-[400] flex flex-col gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 rounded-xl shadow-md bg-background/90 backdrop-blur-md hover:bg-background border border-border/50"
            >
              <Layers className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setMapStyle("streets")}
              className="gap-2 cursor-pointer text-xs"
            >
              <MapIcon className="h-3.5 w-3.5" /> Callejero
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setMapStyle("satellite")}
              className="gap-2 cursor-pointer text-xs"
            >
              <Navigation className="h-3.5 w-3.5" /> Satélite
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="icon"
          variant="secondary"
          className="h-9 w-9 rounded-xl shadow-md bg-background/90 backdrop-blur-md hover:bg-background border border-border/50"
          onClick={() => {
            setActiveActivityIndex(-1);
            setShouldFly(true);
          }}
          title="Vista general"
        >
          <Target className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* --- MAPA --- */}
      <MapContainer
        key={mapKey}
        center={center}
        zoom={12}
        className="h-full w-full outline-none z-0"
        zoomControl={false} // Control custom abajo
      >
        {/* ZOOM: ESQUINA INFERIOR DERECHA */}
        <ZoomControl position="bottomright" />

        <TileLayer attribution="&copy; CARTO" url={tiles[mapStyle]} />

        {/* Línea Sólida Azul */}
        {visibleActivities.length > 1 && (
          <Polyline
            positions={visibleActivities.map((a) => [a.lat, a.lng])}
            pathOptions={{
              color: "#94a3b8",
              weight: 4,
              opacity: 0.8,
              dashArray: "5, 10",
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

        <MapController
          activities={visibleActivities}
          center={center}
          activeIndex={activeActivityIndex}
          shouldFly={shouldFly}
          setShouldFly={setShouldFly}
        />

        <RoutingLayer
          activities={visibleActivities}
          onSummaryFound={setStats}
        />

        {/* Marcadores */}
        {visibleActivities.map((a, index) => {
          const isStart = index === 0;
          const isEnd = index === visibleActivities.length - 1;
          const type = isStart ? "start" : isEnd ? "end" : "mid";
          const isActive = index === activeActivityIndex;

          const icon = createCustomIcon(index, type, isActive);
          if (!icon) return null;

          return (
            <Marker
              key={a.id}
              position={[a.lat, a.lng]}
              icon={icon}
              eventHandlers={{ click: () => setActiveActivityIndex(index) }}
            >
              <Tooltip
                direction="top"
                offset={[0, -40]}
                opacity={1}
                permanent={isActive}
                className={cn(
                  "custom-tooltip border-0 shadow-xl rounded-lg overflow-hidden p-0 bg-transparent",
                  isActive ? "z-[1000]" : ""
                )}
              >
                <div
                  className={cn(
                    "px-3 py-1.5 border rounded-lg shadow-sm whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border/50"
                  )}
                >
                  <p className="font-bold text-[11px] leading-tight">
                    {a.nombre}
                  </p>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      <style jsx global>{`
        .leaflet-routing-container {
          display: none !important;
        }
        .leaflet-tooltip.custom-tooltip {
          background: transparent;
          border: none;
          box-shadow: none;
        }
        .leaflet-tooltip-left:before,
        .leaflet-tooltip-right:before,
        .leaflet-tooltip-bottom:before,
        .leaflet-tooltip-top:before {
          display: none;
        }
        /* Ajuste fino para evitar que el zoom tape el control de copyright en pantallas pequeñas */
        .leaflet-bottom.leaflet-right {
          margin-bottom: 20px;
        }
      `}</style>
    </div>
  );
}
