// components/viajero/create/DestinationCombobox.tsx
"use client";

import * as React from "react";
import { RegionKey, REGIONS, type RegionValue } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { IconMapPinFilled } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DestinationCombobox({
  value,
  onChange,
}: {
  value?: string;
  onChange: (val: RegionKey) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = REGIONS.find((r) => r.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className={cn(
            "h-12 w-full justify-between text-left rounded-lg",
            !selected && "text-muted-foreground"
          )}
        >
          <span className="inline-flex items-center gap-2">
            <IconMapPinFilled className="size-4 opacity-70" />
            {selected ? selected.label : "p. ej. CDMX, EdoMex..."}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
        <Command>
          <div className="px-2 pt-2 pb-1">
            <CommandInput placeholder="Buscar destino..." />
          </div>
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandEmpty>No hay coincidencias</CommandEmpty>
            <CommandGroup heading="Estados disponibles">
              {REGIONS.map((r) => (
                <CommandItem
                  key={r.value}
                  value={`${r.label} ${r.hint}`}
                  onSelect={() => {
                    onChange(r.value);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span className="inline-flex size-2.5 rounded-full bg-palette-pink/90" />
                    {r.label}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                    {r.hint}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
