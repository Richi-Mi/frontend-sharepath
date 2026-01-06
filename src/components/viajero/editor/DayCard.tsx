"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconArrowDown, IconArrowUp, IconPlus, IconTrash } from "@tabler/icons-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Place } from "@/lib/constants/mock";

export function DayCard({
  dayIndex,
  date,
  items,
  quick,
  onSuggest,
  onPickQuick,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  dayIndex: number;
  date?: Date;
  items: Place[];
  quick: Place[];
  onSuggest: () => void;
  onPickQuick: (p: Place) => void;
  onMoveUp: (i: number) => void;
  onMoveDown: (i: number) => void;
  onRemove: (i: number) => void;
}) {
  const [open, setOpen] = React.useState(true);

  return (
    <Card className="p-4">
      <header
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setOpen((s) => !s)}
      >
        <div>
          <p className="text-sm text-muted-foreground">
            Día {dayIndex + 1}
            {date ? ` • ${format(date, "EEEE d 'de' MMM", { locale: es })}` : ""}
          </p>
          <h3 className="text-base font-semibold">Lugares para visitar</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onSuggest();
          }}
        >
          <IconPlus className="size-4 mr-1" />
          Sugerir
        </Button>
      </header>

      {open && (
        <div className="mt-3 space-y-3">
          {/* Quick chips/cards */}
          {quick.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {quick.map((p) => (
                <button
                  key={p.id}
                  className="min-w-[260px] rounded-lg border hover:bg-muted/50 transition"
                  onClick={() => onPickQuick(p)}
                  title={`Añadir ${p.name}`}
                >
                  <img
                    src={p.img}
                    alt={p.name}
                    className="h-28 w-full object-cover rounded-t-lg"
                  />
                  <div className="px-3 py-2 text-left">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.city}</p>
                    <Badge className="mt-1" variant="outline">
                      {p.tag}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Lista actual */}
          <ul className="space-y-2">
            {items.length === 0 && (
              <li className="text-sm text-muted-foreground">
                Aún no hay lugares. Usa el buscador o “Sugerir”.
              </li>
            )}

            {items.map((p, i) => (
              <li key={`${p.id}-${i}`}>
                <div className="group flex items-center justify-between gap-2 rounded-lg border bg-card/40 p-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.img}
                      alt={p.name}
                      className="size-12 rounded-md object-cover border"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.city} • {p.tag}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="size-8" onClick={() => onMoveUp(i)}>
                      <IconArrowUp className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="size-8" onClick={() => onMoveDown(i)}>
                      <IconArrowDown className="size-4" />
                    </Button>
                    <Button variant="destructive" size="icon" className="size-8" onClick={() => onRemove(i)}>
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
