// src/app/viajero/itinerarios/editor/page.tsx
import { addDays, differenceInCalendarDays, parseISO } from "date-fns";
import { EditorShell } from "@/components/viajero/editor/EditorShell";

// util segura para fechas
function safeDate(v?: string | string[]) {
  if (!v || Array.isArray(v)) return undefined;
  try {
    return parseISO(v);
  } catch {
    return undefined;
  }
}

type Search = {
  region?: string;
  start?: string;
  end?: string;
  visibility?: string;
};

const REGION_LABELS: Record<string, string> = {
  cdmx: "Ciudad de México",
  edomex: "Estado de México",
  hgo: "Hidalgo",
  mor: "Morelos",
  qro: "Querétaro",
};

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Search>;
}) {
  // ✅ soporta Next 15/16 con dynamic APIs
  const sp = await searchParams;

  const region =
    REGION_LABELS[(sp?.region as string) ?? ""] ?? "Zona centro (MX)";
  const start = safeDate(sp?.start);
  const end = safeDate(sp?.end) ?? (start ? addDays(start, 3) : undefined);

  const nights =
    start && end ? Math.max(0, differenceInCalendarDays(end, start)) : 0;

  // construir arreglo de días
  const days =
    start && end
      ? Array.from({ length: nights + 1 }, (_, i) => ({
          key: `day-${i}`,
          date: addDays(start, i),
        }))
      : [{ key: "day-0", date: new Date() }];

  return (
    <EditorShell
      region={region}
      start={start}
      end={end}
      nights={nights}
      days={days}
    />
  );
}
