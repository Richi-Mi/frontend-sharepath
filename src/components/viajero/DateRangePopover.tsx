// components/viajero/create/DateRangePopover.tsx
"use client";

import * as React from "react";
import { addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { DayPickerLocale } from "react-day-picker";

export function DateRangePopover({
  value,
  onChange,
  trigger,
}: {
  value: { start?: Date; end?: Date };
  onChange: (v: { start?: Date; end?: Date }) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="p-3">
        <Calendar
          mode="range"
          numberOfMonths={2}
          locale={es as unknown as Partial<DayPickerLocale>}
          selected={
            value.start && value.end
              ? { from: value.start, to: value.end }
              : value.start
              ? { from: value.start, to: value.start }
              : undefined
          }
          onSelect={(range) => {
            const from = range?.from;
            const to = range?.to ?? (from ? addDays(from, 1) : undefined);
            onChange({ start: from, end: to });
          }}
          initialFocus
          className="rounded-lg border bg-card"
          classNames={{
            months: "flex gap-3",
            month: "space-y-3",
            caption_label: "text-sm font-medium",
            nav_button: "size-8 hover:bg-muted rounded-md",
            table: "w-full border-collapse space-y-1",
            head_row: "grid grid-cols-7 text-muted-foreground text-[11px]",
            row: "grid grid-cols-7",
            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md data-[outside=true]:text-muted-foreground",
            day_selected:
              "bg-palette-blue text-primary-foreground hover:bg-palette-blue hover:text-primary-foreground",
            day_today:
              "relative after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-palette-pink",
            day_range_middle:
              "bg-palette-blue/15 text-foreground hover:bg-palette-blue/25",
            day_range_end:
              "bg-palette-blue text-primary-foreground hover:bg-palette-blue",
            day_range_start:
              "bg-palette-blue text-primary-foreground hover:bg-palette-blue",
          }}
        />

        <div className="flex items-center justify-between pt-3">
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => {
              onChange({ start: undefined, end: undefined });
            }}
          >
            Limpiar
          </Button>
          <Button type="button" onClick={() => setOpen(false)}>
            Hecho
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
