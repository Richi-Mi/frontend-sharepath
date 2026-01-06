"use client";
import * as React from "react";
import { IconArrowDown, IconArrowUp, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTrip, type Place } from "@/stores/trip-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  MapPin,
  Footprints,
  CornerDownRight,
  Plus,
  Settings2,
  CalendarDays,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator"; // Para el divisor en el header
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export function DaySection({
  dayKey,
  date,
  recommended,
  title
}: {
  dayKey: string;
  date: Date;
  recommended: Place[];
  title?: string;
}) {
  const { byDay, addPlace, removePlace, movePlace, selectPlace } = useTrip();
  const items = byDay[dayKey] ?? [];

  return (
    <section aria-labelledby={`h-${dayKey}`} className="space-y-4">
      {/* HEADER: Fecha, subtítulo y acciones del día */}
      <header className="flex items-start justify-between">
        <div className="flex flex-col">
          {/* Aquí puedes añadir el icono de colapsar/expandir si lo necesitas */}
          <h2 id={`h-${dayKey}`} className="text-xl md:text-2xl font-bold">
            {format(date, "EEEE, MMMM dº", {})}
          </h2>
          <p className="text-sm text-muted-foreground -mt-1 hover:underline cursor-pointer">
            Añadir subtítulo
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {/* Botones de acción del día */}
          <Button
            variant="ghost"
            className="h-auto p-2 text-primary hover:text-primary/80 transition-colors hidden sm:inline-flex"
          >
            <CalendarDays className="size-4 mr-1" />
            Rellenar día
          </Button>
          <Separator orientation="vertical" className="h-4 hidden sm:block" />
          <Button
            variant="ghost"
            className="h-auto p-2 text-primary hover:text-primary/80 transition-colors hidden sm:inline-flex"
          >
            <Settings2 className="size-4 mr-1" />
            Optimizar ruta{" "}
            
          </Button>
          {/* Este texto puede cambiar dinámicamente según el contenido */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-foreground ml-1"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="sm:hidden">
                <CalendarDays className="size-4 mr-2" />
                Rellenar día
              </DropdownMenuItem>
              <DropdownMenuItem className="sm:hidden">
                <Settings2 className="size-4 mr-2" />
                Optimizar ruta
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Trash2 className="size-4 mr-2" />
                Eliminar día
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* LISTA DE LUGARES DEL DÍA (El corazón del componente) */}
      <div className="relative pl-6 sm:pl-8">
        {" "}
        {/* Añadimos padding izquierdo para la línea vertical */}
        {/* Línea vertical que conecta los lugares */}
        {items.length > 0 && (
          <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-[2px] bg-border z-0" />
        )}
        <ul className="space-y-4">
          {items.length === 0 && (
            <li className="relative">
              <div className="absolute left-[-22px] top-1/2 -translate-y-1/2 size-4 rounded-full border-2 border-primary bg-background z-10" />
              <Card className="p-4 text-sm text-muted-foreground ml-0.5">
                No hay lugares aún. Usa el buscador o las recomendaciones de
                abajo.
              </Card>
            </li>
          )}

          {items.map((p, i) => (
            <li key={`${p.id}-${i}`} className="relative">
              {/* Círculo numerado */}
              <div className="absolute left-[-24px] sm:left-[-26px] top-0 size-6 sm:size-7 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-xs z-10">
                {i + 1}
              </div>

              {/* CARD DE LUGAR INDIVIDUAL */}
              {/* Usamos ContextMenu para las acciones de mover/eliminar */}
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <Card className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 ml-0.5 cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="grow">
                      <h3 className="font-semibold leading-tight text-base mb-1">
                        {p.name}
                      </h3>
                      {p.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {p.description}
                        </p>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="inline-flex items-center gap-1">
                          <Footprints className="size-3.5 text-muted-foreground/80" />{" "}
                          5 mins, 3 km
                        </span>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-xs text-primary hover:text-secondary hover:underline"
                        >
                          <CornerDownRight className="size-3.5 mr-1 text-primary" />{" "}
                          Direcciones
                        </Button>
                      </div>
                    </div>
                    {/* Imagen a la derecha */}
                    <div className="shrink-0 rounded-md overflow-hidden sm:size-28 md:size-32 border bg-muted">
                      {p.img && (
                        <img
                          src={p.img}
                          alt={p.name}
                          className="size-full object-cover"
                        />
                      )}
                    </div>
                  </Card>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={() => movePlace(dayKey, i, i - 1)}
                    disabled={i === 0}
                  >
                    <ChevronUp className="size-4 mr-2" />
                    Mover Arriba
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => movePlace(dayKey, i, i + 1)}
                    disabled={i === items.length - 1}
                  >
                    <ChevronDown className="size-4 mr-2" />
                    Mover Abajo
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => selectPlace(p)}>
                    <MapPin className="size-4 mr-2" />
                    Ver en mapa
                  </ContextMenuItem>
                  <ContextMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => removePlace(dayKey, i)}
                  >
                    <Trash2 className="size-4 mr-2" />
                    Eliminar
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </li>
          ))}
        </ul>
      </div>

      {/* BARRA "Añadir un lugar" (inspirada en las capturas) */}
      <div className="pl-6 sm:pl-8 mt-4">
        {" "}
        {/* Alineado con el contenido de la lista */}
        <Button
          variant="outline"
          className="w-full justify-start h-12 rounded-xl text-muted-foreground text-base hover:text-foreground hover:bg-accent/40 transition-colors"
          onClick={() => console.log("Abrir buscador para añadir un lugar")} // Tu lógica aquí
        >
          <MapPin className="size-5 mr-3" />
          Añadir un lugar
        </Button>
      </div>

      {/* SECCIÓN DE LUGARES RECOMENDADOS */}
      <div className="mt-6">
        <h3 className="text-base font-medium mb-3 pl-2">
          Lugares recomendados
        </h3>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-3 px-2">
            {" "}
            {/* Agregamos px para que se vea el inicio/fin del scroll */}
            {recommended.map((p) => (
              <button
                key={p.id}
                onClick={() => addPlace(dayKey, p)}
                className="w-[280px] h-32 shrink-0 rounded-lg border overflow-hidden bg-card text-left relative group hover:shadow-md transition-all duration-200"
                title={`Añadir ${p.name}`}
              >
                {/* Imagen ocupa la mayor parte de la tarjeta */}
                <img
                  src={p.img}
                  alt={p.name}
                  className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-300"
                />
                {/* Overlay de texto */}
                <div className="relative z-10 p-3 bg-gradient-to-t from-black/70 to-transparent h-full flex flex-col justify-end text-white">
                  <p className="truncate font-semibold text-base">{p.name}</p>
                  <p className="text-xs opacity-80">
                    {p.city} • {p.tag}
                  </p>
                  {/* Botón flotante de añadir */}
                  <div className="absolute right-2 top-2 p-1.5 rounded-full bg-white text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Plus className="size-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-2" />
        </ScrollArea>
      </div>
    </section>
  );
}
