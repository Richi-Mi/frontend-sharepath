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
import { cn } from "@/lib/utils";
import {
  Clock,
  Footprints,
  Layers,
  Map as MapIcon,
  Navigation,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- TIPOS ---
export type ViewMapActivity = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
};

export interface ItineraryViewMapProps {
  activities: ViewMapActivity[];
  className?: string;
  selectedPlaceId?: string | null;
  onSelectPlace?: (id: string | null) => void;
}

// --- ICONOS PERSONALIZADOS ---
const createCustomIcon = (index: number, total: number, isActive: boolean) => {
  if (typeof window === "undefined") return undefined;

  const isStart = index === 0;
  const isEnd = index === total - 1;

  let bgColor = "bg-blue-600";
  let borderColor = "border-white";
  let size = isActive ? 44 : 32;
  let zIndex = isActive ? 1000 : 100;
  
  if (isActive) {
    bgColor = "bg-amber-500";
    borderColor = "border-amber-100";
  } else if (isStart) {
    bgColor = "bg-emerald-600";
  } else if (isEnd) {
    bgColor = "bg-rose-600";
  }

  const html = `
    <div class="relative flex items-center justify-center transition-all duration-300" style="z-index: ${zIndex}">
      ${isActive ? '<div class="absolute -inset-3 bg-amber-400/20 rounded-full animate-pulse"></div>' : ''}
      <div class="relative z-10 flex items-center justify-center rounded-full border-[3px] ${borderColor} shadow-lg ${bgColor} text-white transition-transform duration-300 ${isActive ? 'scale-110' : 'hover:scale-105'}" style="width: ${size}px; height: ${size}px;">
        <span class="font-bold ${isActive ? 'text-lg' : 'text-xs'}">${index + 1}</span>
      </div>
      <div class="absolute -bottom-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] ${isActive ? 'border-t-amber-500' : isStart ? 'border-t-emerald-600' : isEnd ? 'border-t-rose-600' : 'border-t-blue-600'}"></div>
    </div>
  `;

  return L.divIcon({
    className: "custom-view-icon",
    html,
    iconSize: [size, size + 10],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -size],
  });
};

// --- NAVEGADOR DE TOUR ---
function TourNavigator({ 
  currentIndex, 
  total, 
  currentName,
  onNext, 
  onPrev 
}: { 
  currentIndex: number; 
  total: number; 
  currentName: string;
  onNext: () => void; 
  onPrev: () => void; 
}) {
  if (total === 0) return null;

  return (
    <div className={cn(
      "absolute left-1/2 -translate-x-1/2 z-[400] w-[90%] max-w-sm md:w-auto transition-all duration-500",
      "top-24 md:top-auto md:bottom-8"
    )}>
      <div className="flex items-center justify-between bg-background/95 backdrop-blur-xl border border-border/50 rounded-full shadow-2xl p-1.5 ring-1 ring-black/5">
        
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-9 w-9 rounded-full hover:bg-muted shrink-0"
          onClick={onPrev}
          disabled={currentIndex <= -1}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex flex-col items-center px-4 min-w-0 flex-1 text-center cursor-default">
          <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest leading-none mb-0.5 line-clamp-1">
            {currentIndex === -1 ? "Vista General" : `Parada ${currentIndex + 1} de ${total}`}
          </span>
          <span className="text-xs font-bold truncate leading-tight w-full block max-w-[150px]">
            {currentIndex === -1 ? "Explorar Ruta" : currentName}
          </span>
        </div>

        <Button 
          size="icon" 
          variant="ghost" 
          className="h-9 w-9 rounded-full hover:bg-muted shrink-0"
          onClick={onNext}
          disabled={currentIndex >= total - 1}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
        
      </div>
    </div>
  );
}

// --- CONTROLADOR DE CÁMARA ---
function MapController({
  activities,
  selectedId,
}: {
  activities: ViewMapActivity[];
  selectedId: string | null;
}) {
  const map = useMap();
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (!map) return;

    // 1. Zoom a lugar específico
    if (selectedId) {
      const target = activities.find(a => a.id === selectedId);
      if (target) {
        map.flyTo([target.lat, target.lng], 16, {
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
    } 
    // 2. Vista General
    else if (activities.length > 0) {
      try {
        const bounds = L.latLngBounds(activities.map((a) => [a.lat, a.lng]));
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { 
            padding: [80, 80], 
            maxZoom: 15,
            duration: isFirstRun.current ? 0.5 : 1.5 
          });
        }
      } catch (e) {
        console.warn("Error bounds:", e);
      }
    }
    isFirstRun.current = false;
  }, [map, activities, selectedId]);

  return null;
}

// --- CAPA DE RUTAS (FIX "removeLayer of null") ---
function RoutingLayer({
  activities,
  onSummaryFound,
}: {
  activities: ViewMapActivity[];
  onSummaryFound: (summary: { totalDistance: number; totalTime: number }) => void;
}) {
  const map = useMap();
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    if (!map || typeof window === "undefined") return;

    // Función async para importar y configurar
    const setupRouting = async () => {
      try {
        // Importación defensiva
        if (!L.Routing) { 
          const routingMachine = await import("leaflet-routing-machine");
          if (!routingMachine) return;
        }
      } catch (e) {
        console.warn("No se pudo cargar leaflet-routing-machine", e);
        return;
      }

      // Limpieza segura del control anterior si existe
      if (routingControlRef.current) {
        try {
          // Verificamos si el mapa sigue teniendo el control antes de remover
          // Esto evita el error "removeLayer of null" si el mapa ya se destruyó
          if (map && !map.listens('unload')) { 
             map.removeControl(routingControlRef.current);
          }
        } catch (e) {
           // Ignoramos error de limpieza, es benigno en desmontaje
        }
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
            styles: [{ color: "#2563eb", opacity: 0.8, weight: 6 }],
            extendToWaypoints: true,
            missingRouteTolerance: 100,
          },
          show: false, 
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: false, 
          createMarker: () => null,
        } as any);

        control.on("routesfound", function (e: any) {
          const routes = e.routes;
          if (routes && routes.length > 0) {
            onSummaryFound(routes[0].summary);
          }
        });

        control.addTo(map);
        routingControlRef.current = control;
      } catch (error) {
        console.error("Error creando ruta:", error);
      }
    };

    setupRouting();

    // Cleanup function
    return () => {
      if (routingControlRef.current && map) {
        try {
           // Doble check de seguridad
           const container = map.getContainer();
           if (container) { 
               map.removeControl(routingControlRef.current); 
           }
        } catch (e) {}
      }
    };
  }, [map, activities, onSummaryFound]);

  return null;
}

// --- COMPONENTE PRINCIPAL ---
export default function ItineraryViewMap({
  activities,
  className,
  selectedPlaceId,
  onSelectPlace
}: ItineraryViewMapProps) {
  
  const [mapKey] = useState("view-map-static");
  const [mapStyle, setMapStyle] = useState<"streets" | "satellite">("streets");
  const [stats, setStats] = useState({ totalDistance: 0, totalTime: 0 });
  
  // Índice activo
  const activeIndex = useMemo(() => {
      if (!selectedPlaceId) return -1;
      return activities.findIndex(a => a.id === selectedPlaceId);
  }, [selectedPlaceId, activities]);

  // Centro
  const center: LatLngExpression = useMemo(() => {
    if (activities.length > 0) return [activities[0].lat, activities[0].lng];
    return [19.4326, -99.1332];
  }, [activities]);

  // Handlers seguros
  const handleNext = () => { 
      if (activeIndex < activities.length - 1) {
          onSelectPlace?.(activities[activeIndex + 1].id);
      }
  };
  
  const handlePrev = () => {
    if (activeIndex > 0) {
        onSelectPlace?.(activities[activeIndex - 1].id);
    } else {
        onSelectPlace?.(null); // Volver a vista general
    }
  };

  const tiles = {
    streets: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    // satellite: "https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.png",
  };

  const distanceKm = (stats.totalDistance / 1000).toFixed(1);
  const timeHours = Math.floor(stats.totalTime / 3600);
  const timeMinutes = Math.floor((stats.totalTime % 3600) / 60);
  const timeString = timeHours > 0 ? `${timeHours}h ${timeMinutes}m` : `${timeMinutes} min`;

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-muted/20 group rounded-xl border border-border/50 shadow-inner", className)}>
      
      {/* 1. ESTADÍSTICAS */}
      {activities.length > 1 && (
        <div className="absolute top-4 left-4 z-[400] pointer-events-none animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-background/90 px-3 py-2 text-foreground shadow-lg backdrop-blur-md border border-border/50">
            <div className="flex items-center gap-1.5">
              <Footprints className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-bold tabular-nums">{distanceKm} km</span>
            </div>
            <div className="h-4 w-px bg-border"></div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-bold tabular-nums">{timeString}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. NAVEGADOR DE TOUR */}
      {activities.length > 0 && (
        <TourNavigator 
            currentIndex={activeIndex}
            total={activities.length}
            currentName={activeIndex >= 0 ? activities[activeIndex].nombre : ""}
            onNext={handleNext}
            onPrev={handlePrev}
        />
      )}

      {/* 3. CONTROLES */}
      <div className="absolute right-3 top-4 z-[400] flex flex-col gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="secondary" className="h-9 w-9 rounded-xl shadow-md bg-background/90 backdrop-blur-md hover:bg-background border border-border/50">
              <Layers className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => setMapStyle("streets")} className="gap-2 cursor-pointer text-xs">
              <MapIcon className="h-3.5 w-3.5" /> Callejero
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMapStyle("satellite")} className="gap-2 cursor-pointer text-xs">
              <Navigation className="h-3.5 w-3.5" /> Satélite
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="icon"
          variant="secondary"
          className="h-9 w-9 rounded-xl shadow-md bg-background/90 backdrop-blur-md hover:bg-background border border-border/50"
          onClick={() => onSelectPlace?.(null)}
          title="Vista general"
        >
          <Target className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <MapContainer
        key={mapKey}
        center={center}
        zoom={12}
        className="h-full w-full outline-none z-0"
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <ZoomControl position="bottomright" />
        <TileLayer attribution='&copy; CARTO' url={tiles[mapStyle]} />

        {/* Línea Sólida (Backup Visual) */}
        {activities.length > 1 && (
          <Polyline
            positions={activities.map((a) => [a.lat, a.lng])}
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
          activities={activities}
          selectedId={selectedPlaceId || null}
        />

        <RoutingLayer activities={activities} onSummaryFound={setStats} />

        {activities.map((a, index) => {
          const isActive = a.id === selectedPlaceId;
          const icon = createCustomIcon(index, activities.length, isActive);
          if (!icon) return null;

          return (
            <Marker 
                key={a.id} 
                position={[a.lat, a.lng]} 
                icon={icon}
                eventHandlers={{ 
                    click: () => onSelectPlace?.(a.id) 
                }}
            >
              <Tooltip
                direction="top"
                offset={[0, -42]}
                opacity={1}
                permanent={isActive}
                className={cn(
                  "custom-tooltip border-0 shadow-lg rounded-lg overflow-hidden p-0 bg-transparent",
                  isActive ? "z-[1000]" : ""
                )}
              >
                <div
                  className={cn(
                    "px-3 py-1.5 border rounded-lg shadow-sm whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-amber-500 text-white border-amber-600 font-bold"
                      : "bg-background text-foreground border-border/50 font-medium"
                  )}
                >
                  <p className="text-[11px] leading-tight">{a.nombre}</p>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      <style jsx global>{`
        .leaflet-routing-container { display: none !important; }
        .leaflet-tooltip.custom-tooltip { background: transparent; border: none; box-shadow: none; }
        .leaflet-tooltip-left:before, .leaflet-tooltip-right:before, .leaflet-tooltip-bottom:before, .leaflet-tooltip-top:before { display: none; }
        .leaflet-bottom.leaflet-right { margin-bottom: 20px; }
      `}</style>
    </div>
  );
}