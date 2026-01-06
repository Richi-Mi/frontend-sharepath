// src/components/viajero/editor/PlanDeViaje.tsx
"use client";
import * as React from "react";
import { DaySection } from "./DaySection";
import { useTrip, type Place } from "@/stores/trip-store";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function PlanDeViaje({
  days,
  dataset,
}: {
  days: { key: string; date: Date }[];
  dataset: Place[];
}) {
  const { activeDayKey } = useTrip();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Plan de viaje
        </h2>
        {days.length > 0 && (
          <Card className="px-3 py-1.5 text-sm">
            {format(days[0].date, "MM/dd", { locale: es })} –{" "}
            {format(days.at(-1)!.date, "MM/dd", { locale: es })}
          </Card>
        )}
      </header>

      {days.map((d) => {
        const rec = dataset.slice(0, 8); // mock: podrías filtrar por proximidad/tag
        return (
          <section key={d.key} id={`day-${d.key}`} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">
                {format(d.date, "EEEE, d 'de' MMMM", { locale: es })}
              </h3>
              <div className="text-sm text-[var(--palette-blue)] font-semibold">
                {activeDayKey === d.key ? "Día activo" : ""}
              </div>
            </div>

            <DaySection
              dayKey={d.key}
              date={d.date}
              title="Lugares para visitar"
              recommended={rec}
            />

            {/* Ejemplo de otra lista temática del mismo día: */}
            <DaySection
              dayKey={d.key}
              date={d.date}
              title="Restaurantes"
              recommended={dataset
                .filter((p) => p.tag.toLowerCase() === "gastronomía")
                .slice(0, 8)}
            />
          </section>
        );
      })}
    </div>
  );
}
