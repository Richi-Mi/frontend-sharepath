"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TripHeader } from "./TripHeader";
import { PlaceSearch } from "./PlaceSearch";
import { CategoryChips } from "./CategoryChips";
import { DayCard } from "./DayCard";

import { DayRail } from "./DayRail";
import {
  CATEGORIES,
  SUGGESTIONS,
  type Place,
} from "@/lib/constants/suggestions";
import MapPanel from "./MapPanel";

export function EditorShell({
  region,
  days,
  start,
  end,
  nights,
}: {
  region?: string;
  days: { key: string; date: Date }[];
  start?: Date;
  end?: Date;
  nights: number;
}) {
  const [byDay, setByDay] = useState<Record<string, Place[]>>({});
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [mapOpenMobile, setMapOpenMobile] = useState(false);


  const headerSubtitle = useMemo(() => {
    const parts: string[] = [];
    if (region) parts.push(region);
    if (start && end) {
      parts.push(
        `${format(start, "d 'de' MMM", { locale: es })} — ${format(
          end,
          "d 'de' MMM",
          { locale: es }
        )} (${nights} ${nights === 1 ? "noche" : "noches"})`
      );
    }
    return parts.join(" • ");
  }, [region, start, end, nights]);

  function addPlace(dayKey: string, p: Place) {
    setByDay((s) => ({ ...s, [dayKey]: [...(s[dayKey] ?? []), p] }));
  }
  function removePlace(dayKey: string, idx: number) {
    setByDay((s) => {
      const cp = [...(s[dayKey] ?? [])];
      cp.splice(idx, 1);
      return { ...s, [dayKey]: cp };
    });
  }
  function move(dayKey: string, from: number, to: number) {
    setByDay((s) => {
      const arr = [...(s[dayKey] ?? [])];
      if (to < 0 || to >= arr.length) return s;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return { ...s, [dayKey]: arr };
    });
  }

  return (
    <div
      className={cn(
        "grid h-[calc(100dvh-64px)]",
        // Sidebar comprimido (72px), editor flexible, mapa 48%
        "grid-cols-[72px_minmax(0,1fr)_minmax(320px,48%)] md:grid-cols-[72px_minmax(0,1fr)_minmax(480px,48%)]"
      )}
    >
      {/* Riel de días comprimido */}
      <DayRail days={days} />

      {/* Editor */}
      <section className="min-w-0 border-r bg-background">
        <TripHeader
          title="Constructor de Itinerario"
          subtitle={headerSubtitle}
        />

        <ScrollArea className="h-[calc(100%-160px)] md:h-[calc(100%-148px)]">
          <div className="px-4 md:px-6 py-4 md:py-6 space-y-6">
            {/* Buscador + Filtros */}
            <Card className="p-4">
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                <div className="w-full md:max-w-[560px]">
                  <PlaceSearch
                    // filterTag={filterTag}
                    onPick={(p) => {
                      const first = days[0]?.key;
                      if (first) addPlace(first, p);
                    }}
                  />
                </div>
                <CategoryChips
                  categories={CATEGORIES}
                  // active={filterTag}
                  onChange={setFilterTag}
                />
              </div>
            </Card>

            {/* Plan por día */}
            <div className="space-y-4">
              {(days.length
                ? days
                : [{ key: "d-0", date: undefined as any }]
              ).map((d, idx) => {
                const items = byDay[d.key] ?? [];
                const quick = (
                  filterTag
                    ? SUGGESTIONS.filter((x) => x.tag === filterTag)
                    : SUGGESTIONS
                ).slice(0, 6);

                return (
                  <DayRail
                    days={[
                      { key: "d1", date: new Date(2025, 10, 1) },
                      { key: "d2", date: new Date(2025, 10, 2) },
                      { key: "d3", date: new Date(2025, 10, 3) },
                      { key: "d4", date: new Date(2025, 10, 4) },
                    ]}
                    // activeKey="d1"
                    // onPick={(idx) => console.log("ir a día", idx)}
                  />
                );
              })}
            </div>
          </div>
        </ScrollArea>

        {/* FAB móvil para abrir mapa */}
        <button
          onClick={() => setMapOpenMobile((v) => !v)}
          className="md:hidden fixed bottom-5 right-5 z-40 rounded-full px-4 py-3 shadow-lg text-primary-foreground bg-palette-blue"
        >
          {mapOpenMobile ? "Cerrar mapa" : "Ver mapa"}
        </button>
      </section>

      {/* Mapa (oculto en móvil salvo FAB) */}
      <aside
        className={cn(
          "bg-muted/20 md:block",
          mapOpenMobile
            ? "block fixed inset-0 z-30 md:static md:z-auto"
            : "hidden md:block"
        )}
      >
        {/* <MapPanel onCloseMobile={() => setMapOpenMobile(false)} /> */}
      </aside>
    </div>
  );
}
