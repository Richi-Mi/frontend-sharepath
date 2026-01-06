import type { Place as PlaceUI } from "@/stores/trip-store";
import { SUGGESTIONS as RAW } from "@/lib/constants/mock";

const GEO: Record<string, { lat: number; lng: number }> = {
  "Palacio de Bellas Artes": { lat: 19.4353, lng: -99.1412 },
  "Bosque de Chapultepec": { lat: 19.4204, lng: -99.187 },
  "Peña de Bernal": { lat: 20.7505, lng: -99.9497 },
  "Grutas de Tolantongo": { lat: 20.6534, lng: -98.997 },
  Teotihuacán: { lat: 19.6925, lng: -98.8434 },
  "Jardín Borda": { lat: 18.9242, lng: -99.2441 },
};

export const SUGGESTIONS: PlaceUI[] = RAW.map((r) => ({
  id: r.id,
  name: r.name,
  city: r.city,
  tag: r.tag,
  img: r.img,
  ...(GEO[r.name] ?? {}),
}));
