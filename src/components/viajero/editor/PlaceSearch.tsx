"use client";
import * as React from "react";
import {
  IconMapPin,
  IconSearch,
  IconX,
  IconChevronDown,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { SUGGESTIONS } from "@/lib/places-adapter";
import type { Place } from "@/stores/trip-store";

const TABS = ["Lugares", "Actividades"] as const;
const CATEGORIES = [
  "Cultura",
  "Naturaleza",
  "Parque",
  "Historia",
  "Gastronomía",
  "Arqueología",
] as const;

export function PlaceSearch({ onPick }: { onPick: (p: Place) => void }) {
  const [q, setQ] = React.useState("");
  const [tab, setTab] = React.useState<(typeof TABS)[number]>("Lugares");
  const [cat, setCat] = React.useState<string | null>(null);

  const items = React.useMemo(() => {
    let list = SUGGESTIONS;
    if (cat) list = list.filter((i) => i.tag === cat);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(s) || i.city.toLowerCase().includes(s)
      );
    }
    return list.slice(0, 10);
  }, [q, cat]);

  return (
    <div className="rounded-[var(--radius)] border bg-card/80 backdrop-blur p-3 md:p-4 shadow-sm">
      {/* Tabs compactos */}
      <div className="flex gap-2 mb-3">
        {TABS.map((t) => (
          <button
            key={t}
            className={cn(
              "h-8 px-3 rounded-full text-sm border",
              t === tab
                ? "bg-[var(--palette-blue)] text-[var(--primary-foreground)] border-transparent"
                : "hover:bg-accent"
            )}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="relative">
        <IconSearch className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full h-10 pl-9 pr-9 rounded-md border focus-visible:ring-2 outline-none"
          placeholder="Busca lugares (ej. Bellas Artes, Tolantongo...)"
        />
        {q && (
          <button
            className="absolute right-2 top-2.5 p-1 hover:bg-muted rounded"
            onClick={() => setQ("")}
          >
            <IconX className="size-4" />
          </button>
        )}
      </div>

      {/* Chips de categorías (scroll-x, sin traslapar) */}
      <div className="mt-3 mask-fade-x overflow-x-auto">
        <div className="flex gap-2 pr-4">
          {CATEGORIES.map((c) => {
            const active = c === cat;
            return (
              <button
                key={c}
                onClick={() => setCat(active ? null : c)}
                className={cn(
                  "h-7 px-3 rounded-full border text-sm whitespace-nowrap",
                  active
                    ? "bg-[var(--palette-blue)] text-[var(--primary-foreground)] border-transparent"
                    : "bg-secondary hover:bg-secondary/80"
                )}
              >
                {c}
              </button>
            );
          })}
          {cat && (
            <button
              onClick={() => setCat(null)}
              className="h-7 px-3 rounded-full text-sm border hover:bg-muted"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Resultados */}
      <div className="mt-3 rounded-lg border overflow-hidden">
        <ul className="divide-y">
          {items.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 p-2 hover:bg-accent/60"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={p.img}
                  alt={p.name}
                  className="size-11 rounded-md object-cover border"
                />
                <div className="min-w-0">
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.city} • {p.tag}
                  </p>
                </div>
              </div>
              <button
                className="h-8 px-2 rounded-md border hover:bg-muted"
                onClick={() => onPick(p)}
                title="Añadir a tu plan"
              >
                + Añadir
              </button>
            </li>
          ))}
          {!items.length && (
            <li className="p-3 text-sm text-muted-foreground">
              Sin resultados.
            </li>
          )}
        </ul>
      </div>

      {/* Pie compacto (ubicación y más filtros, solo UI) */}
      <div className="mt-3 flex justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <IconMapPin className="size-4" /> Ciudad de México
        </span>
       
      </div>
    </div>
  );
}
