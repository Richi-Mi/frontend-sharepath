"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, CalendarDays, Map } from "lucide-react";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DayPickerLocale } from "react-day-picker";

interface CalendarWidgetProps {
  selected: Date;
  onSelect: (date: Date) => void;
  daysWithItineraries: Date[];
  totalItineraries: number;
  monthsVisible: number;
}

export function CalendarWidget({
  selected,
  onSelect,
  daysWithItineraries,
  totalItineraries,
  monthsVisible,
}: CalendarWidgetProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden border-0 shadow-2xl shadow-slate-200/60 ring-1 ring-slate-100">
        
        {/* Cabecera simplificada (El Mes/Año ahora lo maneja el Calendario para que se actualice al cambiar) */}
        <CardHeader className="bg-white px-4 pb-2 pt-6 sm:px-8 sm:pt-8">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-600">
              Agenda de Viajes
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => d && onSelect(d)}
            locale={es as unknown as Partial<DayPickerLocale>}
            numberOfMonths={monthsVisible}
            showOutsideDays={false}
            className="w-full p-3 sm:p-6" // Padding responsivo
            modifiers={{ hasItinerary: daysWithItineraries }}
            modifiersClassNames={{
              hasItinerary: 
                "font-bold text-indigo-600 relative z-10 " +
                "after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 sm:after:h-1.5 sm:after:w-1.5 " +
                "after:-translate-x-1/2 after:rounded-full after:bg-indigo-600 after:content-[''] " +
                "hover:bg-indigo-50 transition-all",
            }}
            components={{
              // Iconos de navegación responsivos
              // IconLeft: () => <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 hover:text-indigo-600 transition-colors" />,
              // IconRight: () => <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 hover:text-indigo-600 transition-colors" />,
            }}
            classNames={{
              months: "flex flex-col gap-4 sm:gap-8",
              month: "w-full space-y-4 sm:space-y-6",
              
              // RESTAURADO: El caption es vital para la navegación
              caption: "flex justify-between pt-1 relative items-center px-2 mb-2 sm:mb-4",
              caption_label: "text-xl sm:text-3xl font-extrabold capitalize text-slate-900 tracking-tight", // Título Grande aquí
              
              // NAVEGACIÓN
              nav: "flex items-center gap-1",
              nav_button: "h-8 w-8 sm:h-10 sm:w-10 bg-transparent p-0 hover:bg-slate-50 rounded-full border border-slate-100 shadow-sm flex items-center justify-center transition-all",
              
              // GRID
              table: "w-full border-collapse",
              head_row: "flex mb-2 sm:mb-4 justify-between",
              head_cell: "text-slate-400 w-10 sm:w-14 font-semibold text-[0.65rem] sm:text-xs uppercase tracking-wider text-center",
              row: "flex w-full mt-1 sm:mt-2 justify-between",
              
              // CELDAS RESPONSIVAS
              // Móvil: h-10 w-10 (40px)
              // Escritorio: h-14 w-14 (56px)
              cell: "h-10 w-10 sm:h-14 sm:w-14 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
              
              day: cn(
                "h-10 w-10 sm:h-14 sm:w-14 p-0 font-medium text-sm sm:text-lg rounded-full transition-all duration-300",
                "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
              ),
              
              // SELECCIÓN
              day_selected:
                "bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 hover:bg-indigo-700 hover:text-white focus:bg-indigo-700 focus:text-white font-bold scale-105",
              
              day_today: "bg-slate-50 text-slate-900 font-bold ring-1 ring-slate-200",
              day_outside: "text-slate-300 opacity-30",
              day_disabled: "text-slate-300 opacity-30",
              day_hidden: "invisible",
            }}
          />
        </CardContent>

        <Separator className="bg-slate-50" />

        {/* Footer Informativo */}
        <div className="bg-white p-4 sm:p-6">
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-indigo-600" />
              <span className="font-medium text-slate-600">Día con Viaje</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-slate-200" />
              <span className="font-medium text-slate-600">Hoy</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tarjetas de Resumen Responsivas */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        
        {/* Tarjeta 1 */}
        <div className="group rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md">
          <div className="mb-2 sm:mb-3 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
            <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{daysWithItineraries.length}</p>
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
            Días Ocupados
          </p>
        </div>

        {/* Tarjeta 2 */}
        <div className="group rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md">
          <div className="mb-2 sm:mb-3 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-slate-50 text-slate-600 transition-colors group-hover:bg-slate-800 group-hover:text-white">
            <Map className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{totalItineraries}</p>
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Viajes
          </p>
        </div>
      </div>
    </div>
  );
}