// src/app/(viajero)/viajero/itinerarios/crear/components/ActivityListPanel.tsx
"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { List, Plus, AlertTriangle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SortableActivityCard } from "./SortableActivityCard";
import { BuilderActivity } from "@/lib/itinerary-builder-store";
import { cn } from "@/lib/utils";

interface ActivityListPanelProps {
  activities: BuilderActivity[];
  currentDayLabel: string | null;
  onAddPlace: () => void;
  onRemoveActivity: (id: string) => void;
  onViewDetails: (id: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragStart: (event: DragStartEvent) => void;
  activeDragId: string | null;
}

export function ActivityListPanel({
  activities,
  currentDayLabel,
  onAddPlace,
  onRemoveActivity,
  onViewDetails,
  onDragEnd,
  onDragStart,
  activeDragId,
}: ActivityListPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <div className="flex flex-col h-full bg-muted/5 dark:bg-background">
      {/* HEADER DE LA LISTA */}
      <div className="flex items-center justify-between px-4 py-3 border-b  sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <List className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {activities.length} {activities.length === 1 ? "Lugar" : "Lugares"}
          </span>
        </div>
        <Button
          size="sm"
          onClick={onAddPlace}
          disabled={activities.length === 5}
          className={cn(
            "h-8 text-xs font-semibold px-3 shadow-sm",
            activities.length === 5 && "opacity-50 cursor-not-allowed"
          )}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {activities.length === 5 ? "Límite alcanzado" : "Agregar"}
        </Button>
      </div>

      {/* CONTENIDO SCROLLABLE */}
      <ScrollArea className="flex-1">
        <div className="p-4 pb-24 min-h-[400px]">
          {currentDayLabel ? (
            activities.length === 0 ? (
              // EMPTY STATE
              <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  Día sin planes
                </h3>
                <p className="text-xs text-muted-foreground max-w-[220px] mb-6 leading-relaxed">
                  Aún no has agregado lugares para el{" "}
                  <strong>{currentDayLabel}</strong>.
                </p>
                <Button
                  variant="outline"
                  onClick={onAddPlace}
                  className="gap-2"
                >
                  <MapPin className="h-4 w-4" /> Explorar Destinos
                </Button>
              </div>
            ) : (
              // LISTA DND
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={activities.map((a) => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {activities.map((act, idx) => (
                      <SortableActivityCard
                        key={act.id}
                        activity={act}
                        index={idx}
                        onDelete={onRemoveActivity}
                        onViewDetails={onViewDetails}
                      />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeDragId ? (
                    <div className="opacity-90 scale-105 rotate-1 cursor-grabbing">
                      {/* Clone visual simple para performance */}
                      <div className="bg-background border border-primary/50 p-4 rounded-xl shadow-2xl flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded-md animate-pulse" />
                        <span className="font-medium text-sm">
                          Moviendo lugar...
                        </span>
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              Selecciona un día
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
