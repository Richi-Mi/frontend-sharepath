
import { z } from "zod";

export const itinerarySchema = z.object({
  region: z.enum(["cdmx", "edomex", "hgo", "mor", "qro"], {
      message: "Selecciona un destino válido dentro de la zona soportada",
  }),
  start: z.date().optional(),
  end: z.date().optional(),
  visibility: z.enum(["private", "friends", "public"]).default("friends"),
  companions: z.string().optional(), // correos separados por coma (validación más fina si la quieres)
});

export type ItineraryFormValues = z.infer<typeof itinerarySchema>;
