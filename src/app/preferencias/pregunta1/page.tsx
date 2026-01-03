"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { PreguntaWrapper } from "@/components/cuestionario/PreguntaWrapper";

import {
  MapPin,
  Landmark,
  Trees,
  Tent,
  Utensils,
  Coffee,
  Beer,
  Ticket,
  PawPrint,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const CATEGORY_CONFIG: Record<string, string> = {
  "Atracciones turísticas": "tourist_attraction",
  Museos: "museum",
  Parques: "park",
  Zoológicos: "zoo",
  "Parques de diversión": "amusement_park",
  Campamentos: "campground",
  Restaurantes: "restaurant",
  Cafes: "cafe",
  Bares: "bar",
};

const CATEGORY_ICONS: Record<string, { icon: typeof Sparkles; color: string }> =
  {
    "Atracciones turísticas": { icon: Sparkles, color: "text-amber-600" },
    Museos: { icon: Landmark, color: "text-purple-600" },
    Parques: { icon: Trees, color: "text-green-600" },
    Zoológicos: { icon: PawPrint, color: "text-orange-600" },
    "Parques de diversión": { icon: Ticket, color: "text-pink-600" },
    Campamentos: { icon: Tent, color: "text-emerald-600" },
    Restaurantes: { icon: Utensils, color: "text-red-600" },
    Cafes: { icon: Coffee, color: "text-amber-700" },
    Bares: { icon: Beer, color: "text-indigo-600" },
  };

const PreguntaSchema = z.object({
  pregunta1: z
    .array(z.string())
    .min(1, "Selecciona al menos una opción")
    .max(3, "Selecciona máximo 3"),
});

type PreguntaValues = z.infer<typeof PreguntaSchema>;

const loadFormData = () => {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem("form-data");
  return stored ? JSON.parse(stored) : {};
};

const saveFormData = (data: Partial<PreguntaValues>) => {
  if (typeof window === "undefined") return;
  const stored = loadFormData();
  localStorage.setItem("form-data", JSON.stringify({ ...stored, ...data }));
};

export default function Pregunta1Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const totalPreguntas = 3;

  const form = useForm<PreguntaValues>({
    resolver: zodResolver(PreguntaSchema),
    defaultValues: {
      pregunta1: [],
    },
  });

  useEffect(() => {
    const stored = loadFormData();

    if (
      stored.pregunta1 &&
      Array.isArray(stored.pregunta1) &&
      typeof stored.pregunta1[0] === "string" &&
      Object.keys(CATEGORY_CONFIG).includes(stored.pregunta1[0])
    ) {
      form.reset({ pregunta1: stored.pregunta1 });
    } else {
      form.reset({ pregunta1: [] });
    }
  }, [form]);

  const toggleValue = (values: string[], value: string) => {
    if (values.includes(value)) {
      return values.filter((v) => v !== value);
    }
    return [...values, value];
  };

  const onSiguiente = (data: PreguntaValues) => {
    setIsLoading(true);

    const mappedData = {
      ...data,
      pregunta1: data.pregunta1.map((label) => CATEGORY_CONFIG[label]),
    };

    saveFormData(mappedData);
    router.push("/preferencias/pregunta2");
  };

  const selectedValues = form.watch("pregunta1") || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSiguiente)} className="w-full">
        <PreguntaWrapper
          preguntaActual={1}
          totalPreguntas={totalPreguntas}
          onSiguiente={form.handleSubmit(onSiguiente)}
          isLoading={isLoading}
          selectedCount={selectedValues.length}
        >
          <FormField
            control={form.control}
            name="pregunta1"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <div className="flex justify-between items-center">
                  <FormLabel className="text-2xl font-bold text-blue-950">
                    ¿Qué lugares prefieres para turistear?
                  </FormLabel>
                  <span
                    className={cn(
                      "text-xs px-3 py-1 rounded-full border",
                      selectedValues.length === 0
                        ? "bg-gray-100 text-gray-500"
                        : selectedValues.length > 3
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-50 text-blue-700"
                    )}
                  >
                    Seleccionados: {selectedValues.length} / 3
                  </span>
                </div>

                <FormControl>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.keys(CATEGORY_CONFIG).map((opt) => {
                      const isSelected = field.value.includes(opt);
                      const config = CATEGORY_ICONS[opt] || {
                        icon: Sparkles,
                        color: "text-gray-500",
                      };
                      const Icon = config.icon;

                      return (
                        <div
                          key={opt}
                          onClick={() => {
                            if (!isSelected && field.value.length >= 3) return;
                            field.onChange(toggleValue(field.value, opt));
                          }}
                          className={cn(
                            "relative cursor-pointer flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 h-32 transition-all select-none",
                            isSelected
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-gray-100 hover:border-primary/30",
                            !isSelected &&
                              field.value.length >= 3 &&
                              "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-6 h-6",
                              isSelected ? config.color : "text-gray-400"
                            )}
                          />

                          <span
                            className={cn(
                              "text-sm text-center",
                              isSelected
                                ? "text-primary font-semibold"
                                : "text-gray-600"
                            )}
                          >
                            {opt}
                          </span>

                          {isSelected && (
                            <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-primary fill-white" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </FormControl>

                <FormMessage className="text-center" />
              </FormItem>
            )}
          />
        </PreguntaWrapper>
      </form>
    </Form>
  );
}
