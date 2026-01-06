// components/viajero/CreateItineraryForm.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, differenceInCalendarDays, format, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";

import {
  IconMapPinFilled,
  IconCalendar,
  IconCheck,
  IconX,
  IconInfoCircle,
  IconUsersGroup,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";

import {
  useItineraryBuilderStore,
  type RegionValue,
} from "@/lib/itinerary-builder-store";

/* ----------------------------- Datos y esquema ----------------------------- */

const REGIONS = [
  { value: "Ciudad de Mexico", label: "Ciudad de México", hint: "CDMX" },
  { value: "Estado de Mexico", label: "Estado de México", hint: "Edo. Méx." },
  { value: "Hidalgo", label: "Hidalgo", hint: "HGO" },
  { value: "Morelos", label: "Morelos", hint: "MOR" },
  { value: "Querétaro", label: "Querétaro", hint: "QRO" },
] as const;

const regionValues = REGIONS.map((r) => r.value) as [
  RegionValue,
  ...RegionValue[]
];

const schema = z
  .object({
    nombre: z
      .string()
      .trim() // <--- Agregamos esto para limpiar espacios antes de validar
      .min(3, "El nombre debe tener al menos 3 caracteres válidos")
      .max(50, "El nombre es muy largo"), // Por defecto permite letras, números y símbolos
    regions: z
      .array(z.enum(regionValues))
      .min(1, { message: "Selecciona al menos un destino" }),
    start: z.date().nullable().optional(),
    end: z.date().nullable().optional(),
    companions: z.array(z.string()).default([]),
  })
  .refine(
    (v) => {
      if ((v.start && !v.end) || (!v.start && v.end)) return false;
      if (v.start && v.end) {
        if (isAfter(v.start, v.end)) return false;
        const days = differenceInCalendarDays(v.end, v.start) + 1;
        return days >= 1 && days <= 7;
      }
      return true;
    },
    {
      message:
        "Selecciona un rango válido (1 a 7 días). Si eliges una fecha, elige inicio y fin.",
      path: ["end"],
    }
  );

type FormValues = z.infer<typeof schema>;

/* --------------------------------- Componente -------------------------------- */

export default function CreateItineraryForm() {
  const router = useRouter();

  const setMeta = useItineraryBuilderStore((s) => s.setMeta);

  const [openRegion, setOpenRegion] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // alerta de 3+ estados
  const [showRegionAlert, setShowRegionAlert] = React.useState(false);
  const [pendingRegion, setPendingRegion] = React.useState<RegionValue | null>(
    null
  );
  const [ack3Plus, setAck3Plus] = React.useState(false);

  // date-picker tipo shadcnblocks
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    undefined
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    // resolver: zodResolver(schema),
    defaultValues: {
      nombre: "",
      regions: [],
      start: null,
      end: null,
      // visibility: "friends",
      companions: [],
    },
    mode: "onTouched",
  });

  const regions = watch("regions");
  const start = watch("start");
  const end = watch("end");
  // const visibility = watch("visibility");
  const nombreActual = watch("nombre");
  const companions = watch("companions");

  /* ---------- Restaurar/guardar borrador ---------- */
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("itinerary:create:draft");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.start) parsed.start = new Date(parsed.start);
        if (parsed.end) parsed.end = new Date(parsed.end);
        reset(parsed);
        if (parsed.start || parsed.end) {
          setDateRange({
            from: parsed.start ? new Date(parsed.start) : undefined,
            to: parsed.end ? new Date(parsed.end) : undefined,
          });
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const id = setTimeout(() => {
      try {
        const draft = {
          nombre: nombreActual,
          regions,
          start,
          end,
          // visibility,
          companions,
        };
        localStorage.setItem("itinerary:create:draft", JSON.stringify(draft));
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(id);
  // }, [nombreActual, regions, start, end, visibility, companions]);
  }, [nombreActual, regions, start, end, companions]);

  /* ---------- Sugerir nombre no invasivo ---------- */
  React.useEffect(() => {
    if (nombreActual?.trim().length) return;
    if (!regions.length) return;
    const labels = REGIONS.filter((r) =>
      regions.includes(r.value as RegionValue)
    ).map((r) => r.hint);
    const rango =
      start && end
        ? `${format(start, "d MMM", { locale: es })} – ${format(end, "d MMM", {
            locale: es,
          })}`
        : "";
    const sugerido = `Trip ${labels.join(", ")}${rango ? ` (${rango})` : ""}`;
    setValue("nombre", sugerido);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regions, start, end]);

  /* --------------------------- Helpers: regiones --------------------------- */

  function actuallyToggleRegion(val: RegionValue) {
    const isSelected = regions.includes(val);
    const next = isSelected
      ? regions.filter((v) => v !== val)
      : [...regions, val];

    setValue("regions", next, { shouldValidate: true, shouldDirty: true });
  }

  function toggleRegion(val: RegionValue) {
    const isSelected = regions.includes(val);
    if (isSelected) {
      actuallyToggleRegion(val);
      return;
    }
    // Intento agregar
    if (!ack3Plus && regions.length >= 2) {
      setPendingRegion(val);
      setShowRegionAlert(true);
      return;
    }
    actuallyToggleRegion(val);
  }

  /* ------------------------- Helpers: companions -------------------------- */

  function addCompanionTokenFromText(text: string) {
    const token = text.trim().replace(/,+$/, "");
    if (!token) return;
    if (!companions.includes(token)) {
      setValue("companions", [...companions, token], { shouldDirty: true });
    }
  }

  function removeCompanionToken(token: string) {
    setValue(
      "companions",
      companions.filter((t) => t !== token),
      { shouldDirty: true }
    );
  }

  /* --------------------------- Date-picker logic -------------------------- */

  const duration =
    start && end ? differenceInCalendarDays(end, start) + 1 : undefined;

  function handleDateRangeChange(range: DateRange | undefined) {
    if (!range?.from && !range?.to) {
      setDateRange(undefined);
      setValue("start", null, { shouldValidate: true });
      setValue("end", null, { shouldValidate: true });
      return;
    }

    let from = range.from ?? null;
    let to = range.to ?? null;

    if (from && to) {
      const diff = differenceInCalendarDays(to, from) + 1;
      if (diff > 7) {
        to = addDays(from, 6);
      }
      if (diff < 1) {
        to = from;
      }
    }

    setDateRange({
      from: from ?? undefined,
      to: to ?? undefined,
    });

    setValue("start", from, { shouldValidate: true });
    setValue("end", to, { shouldValidate: true });
  }

  /* -------------------------------- Submit -------------------------------- */

  function onSubmit(values: FormValues) {
    setSubmitting(true);

    // 1) Guardamos meta global para el builder
    setMeta({
      title: values.nombre,
      regions: values.regions as RegionValue[],
      start: values.start ?? new Date(),
      end: values.end ?? new Date(),
      // visibility: values.visibility,
      companions: values.companions,
    });

    // 2) Limpiamos borrador
    try {
      localStorage.removeItem("itinerary:create:draft");
    } catch {
      // ignore
    }

    // 3) Vamos al editor donde se construirán las actividades
    router.push("/viajero/itinerarios/crear");
  }

  /* -------------------------------- Render -------------------------------- */

  return (
    <>
      {/* Alert de 3+ estados */}
      <AlertDialog open={showRegionAlert} onOpenChange={setShowRegionAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Has elegido varios destinos</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Con <b>3 o más estados</b> habrá que considerar <b>traslados</b>
                , tráfico y tiempos de llegada.
              </span>
              <span className="block">
                ¿Prefieres mantenerte en 1–2 o continuar igualmente?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingRegion(null)}>
              Elegir menos destinos
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-primary-foreground hover:opacity-90"
              onClick={() => {
                setAck3Plus(true);
                setShowRegionAlert(false);
                if (pendingRegion) {
                  actuallyToggleRegion(pendingRegion);
                  setPendingRegion(null);
                }
              }}
            >
              Continuar igualmente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="mx-auto border-border/60 bg-card/70 backdrop-blur-sm shadow-sm p-5 md:p-6">
        {/* Encabezado */}
        <div className="mb-4 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Crea un nuevo itinerario
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Elige destino y fechas. Luego ajustamos el itinerario.
          </p>
          <div className="mt-3 h-1 w-24 mx-auto rounded-full bg-primary/90" />
        </div>

        {/* Layout responsive */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-6"
          aria-label="Formulario de nuevo itinerario"
        >
          {/* Columna izquierda */}
          <div className="space-y-6">
            {/* Nombre */}
            <section className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="nombre">
                ¿Cómo se llamará tu itinerario?
              </label>
              <Input
                id="nombre"
                type="text"
                placeholder="p. ej. Mi primera visita en CDMX"
                maxLength={50}
                className="h-12 rounded-lg"
                aria-invalid={!!errors.nombre}
                {...register("nombre")}
              />
              {errors.nombre && (
                <p className="text-xs text-red-600">{errors.nombre.message}</p>
              )}
            </section>

            {/* ¿A dónde? */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium" htmlFor="lugar">
                  ¿A dónde?
                </label>
                <span className="text-xs text-muted-foreground">
                  Selecciona 1–3 estados
                </span>
              </div>

              <Popover open={openRegion} onOpenChange={setOpenRegion}>
                <PopoverTrigger asChild>
                  <Button
                    id="lugar"
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={openRegion}
                    className={cn(
                      "h-12 w-full justify-between text-left rounded-lg",
                      !regions.length && "text-muted-foreground"
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      <IconMapPinFilled className="size-4 opacity-70" />
                      {regions.length === 0
                        ? "p. ej. CDMX, EdoMéx..."
                        : regions.length === 1
                        ? REGIONS.find((r) => r.value === regions[0])?.label
                        : `${regions.length} estados seleccionados`}
                    </span>
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                  <Command>
                    <CommandInput placeholder="Buscar estado..." />
                    <CommandList className="max-h-60 overflow-y-auto">
                      <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                      <CommandGroup heading="Estados disponibles">
                        {REGIONS.map((r) => {
                          const isSelected = regions.includes(r.value);
                          return (
                            <CommandItem
                              key={r.value}
                              value={`${r.label} ${r.hint}`}
                              onSelect={() =>
                                toggleRegion(r.value as RegionValue)
                              }
                              className="flex items-center justify-between"
                            >
                              <span className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "opacity-50 [&_svg]:invisible"
                                  )}
                                  aria-hidden
                                >
                                  <IconCheck className="h-3 w-3" />
                                </div>
                                {r.label}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                                {r.hint}
                              </span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {!!regions.length && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {regions.map((val) => {
                    const info = REGIONS.find((r) => r.value === val)!;
                    return (
                      <span
                        key={val}
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-xs"
                      >
                        {info.label}
                        <button
                          type="button"
                          className="opacity-70 hover:opacity-100"
                          aria-label={`Quitar ${info.label}`}
                          onClick={() => toggleRegion(val as RegionValue)}
                        >
                          <IconX className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {errors.regions && (
                <p className="text-sm text-red-600">{errors.regions.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Actualmente soportamos itinerarios en CDMX, Estado de México,
                Hidalgo, Morelos y Querétaro.
              </p>
            </section>

            {/* Fechas: date-picker tipo shadcnblocks */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">Fechas</label>
                <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <IconCalendar className="size-3.5 opacity-70" />
                  {start && end ? (
                    <>
                      {format(start, "d MMM", { locale: es })} —{" "}
                      {format(end, "d MMM", { locale: es })} •{" "}
                      <b>
                        {duration} día{duration! > 1 ? "s" : ""}
                      </b>
                    </>
                  ) : (
                    "Selecciona un rango (máx. 7 días)"
                  )}
                </div>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 rounded-lg",
                      !start && !end && "text-muted-foreground"
                    )}
                  >
                    <IconCalendar className="mr-2 h-4 w-4 opacity-70" />
                    {start ? (
                      end ? (
                        <>
                          {format(start, "d MMM yyyy", { locale: es })} -{" "}
                          {format(end, "d MMM yyyy", { locale: es })}
                        </>
                      ) : (
                        format(start, "d MMM yyyy", { locale: es })
                      )
                    ) : (
                      <span>Selecciona un rango de fechas</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={handleDateRangeChange}
                    numberOfMonths={2}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {errors.end && (
                <p className="text-xs text-red-600">{errors.end.message}</p>
              )}
            </section>

            {/* Visibilidad */}
            {/* <section className="space-y-2">
              <label className="block text-sm font-medium">
                ¿Quién puede ver este itinerario?
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "private", label: "Solo yo" },
                  { value: "friends", label: "Amigos" },
                  { value: "public", label: "Público" },
                ].map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    size="sm"
                    variant={visibility === opt.value ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() =>
                      setValue("visibility", opt.value as any, {
                        shouldDirty: true,
                      })
                    }
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </section> */}
          </div>

          {/* Columna derecha (sticky): resumen  + CTA */}
          <aside className="space-y-6 lg:sticky lg:top-6 self-start">
            {/* Resumen compacto */}
            <Card className="border bg-background/80">
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <IconInfoCircle className="h-4 w-4 text-primary" />
                  Resumen
                </div>

                <div className="text-sm">
                  <div className="text-muted-foreground">Destinos</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {regions.length ? (
                      regions.map((val) => {
                        const info = REGIONS.find((r) => r.value === val)!;
                        return (
                          <span
                            key={val}
                            className="rounded-full border px-2 py-[1px] text-xs bg-primary/5"
                          >
                            {info.hint}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Sin seleccionar
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-sm">
                  <div className="text-muted-foreground">Fechas</div>
                  <div className="mt-1">
                    {start && end ? (
                      <>
                        {format(start, "d MMM", { locale: es })} —{" "}
                        {format(end, "d MMM", { locale: es })} ·{" "}
                        <b>
                          {duration} día{duration! > 1 ? "s" : ""}
                        </b>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Sin definir
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            <Separator />

            {/* CTA */}
            <div className="flex flex-col items-center gap-3">
              <Button
                type="submit"
                className="h-12 w-full px-8 text-base rounded-full bg-primary hover:opacity-90 text-primary-foreground"
                disabled={submitting}
              >
                {submitting ? "Preparando..." : "Comienza a planificar"}
              </Button>
              {isDirty && (
                <p className="text-xs text-muted-foreground text-center">
                  Se guarda un borrador local automáticamente mientras editas.
                </p>
              )}
            </div>
          </aside>
        </form>
      </Card>
    </>
  );
}
