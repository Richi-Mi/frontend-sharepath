'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PreguntaWrapper } from '@/components/cuestionario/PreguntaWrapper';
import { cn } from '@/lib/utils';

import {
  Drama,
  Music2,
  Footprints,
  ShoppingBag,
  Popcorn,
  CheckCircle2,
} from 'lucide-react';


const ACTIVITY_CONFIG: Record<
  string,
  { icon: any; color: string; bgColor: string }
> = {
  Acuarios: {
    icon: Drama,
    color: 'text-cyan-500',
    bgColor: 'group-hover:bg-cyan-50',
  },
  Casinos: {
    icon: Music2,
    color: 'text-yellow-600',
    bgColor: 'group-hover:bg-yellow-50',
  },
  Spas: {
    icon: Footprints,
    color: 'text-pink-500',
    bgColor: 'group-hover:bg-pink-50',
  },
  Cines: {
    icon: Popcorn,
    color: 'text-red-500',
    bgColor: 'group-hover:bg-red-50',
  },
  Boliches: {
    icon: ShoppingBag,
    color: 'text-purple-500',
    bgColor: 'group-hover:bg-purple-50',
  },
};


const ACTIVITY_TO_DB: Record<string, string> = {
  Acuarios: 'aquarium',
  Casinos: 'casino',
  Spas: 'spa',
  Cines: 'movie_theater',
  Boliches: 'bowling_alley',
};


const PreguntaSchema = z.object({
  pregunta3: z
    .array(z.string())
    .min(1, 'Selecciona al menos una opción')
    .max(3, 'Selecciona máximo tres'),
});

type PreguntaValues = z.infer<typeof PreguntaSchema>;


const loadFormData = () => {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem('form-data');
  return stored ? JSON.parse(stored) : {};
};

const saveFormData = (data: Partial<PreguntaValues>) => {
  if (typeof window === 'undefined') return;
  const current = loadFormData();
  localStorage.setItem(
    'form-data',
    JSON.stringify({ ...current, ...data })
  );
};

export default function Pregunta3Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const totalPreguntas = 3;

  const form = useForm<PreguntaValues>({
    resolver: zodResolver(PreguntaSchema),
    defaultValues: {
      pregunta3: [],
    },
  });

  useEffect(() => {
    const stored = loadFormData();

    if (
      Array.isArray(stored.pregunta3) &&
      stored.pregunta3.every((v: string) =>
        Object.keys(ACTIVITY_CONFIG).includes(v)
      )
    ) {
      form.reset({ pregunta3: stored.pregunta3 });
    } else {
      form.reset({ pregunta3: [] });
    }
  }, [form]);

  const selectedValues = form.watch('pregunta3') || [];
  const selectedCount = selectedValues.length;

  const toggleValue = (values: string[], value: string) => {
    if (values.includes(value)) {
      return values.filter((v) => v !== value);
    }
    return [...values, value];
  };

  const onSiguiente = () => {
    // This is the final question, so move to next step
    form.handleSubmit(onGuardar)();
  };

  const onGuardar = async (data: PreguntaValues) => {
    setIsLoading(true);

    const actividadesDB = data.pregunta3.map(
      (label) => ACTIVITY_TO_DB[label]
    );

    saveFormData(data);
    const finalData = loadFormData();

    try {
      const token = localStorage.getItem('authToken');

      const res = await fetch(
        'https://harol-lovers.up.railway.app/preferencias/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token: `Bearer ${token}`,
          },
          body: JSON.stringify({
            lugares_preferidos: finalData.pregunta1 || [],
            estados_visitados: finalData.pregunta2 || [],
            actividades_preferidas: actividadesDB,
          }),
        }
      );

      if (!res.ok) throw new Error(await res.text());

      toast.success('¡Preferencias guardadas con éxito!');
      router.push('/viajero');
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar preferencias');
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onGuardar)} className="w-full">
        <PreguntaWrapper
          preguntaActual={3}
          totalPreguntas={totalPreguntas}
          onSiguiente={onSiguiente}
          onGuardar={form.handleSubmit(onGuardar)}
          isLoading={isLoading}
          selectedCount={selectedCount}
        >
          <FormField
            control={form.control}
            name="pregunta3"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className="text-2xl font-bold text-blue-950">
                  3) ¿Qué actividades prefieres hacer?
                </FormLabel>

                <FormControl>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.entries(ACTIVITY_CONFIG).map(
                      ([label, config]) => {
                        const isSelected =
                          field.value.includes(label);

                        const isDisabled =
                          !isSelected && field.value.length >= 3;

                        const Icon = config.icon;

                        return (
                          <div
                            key={label}
                            onClick={() => {
                              if (isDisabled) return;
                              field.onChange(
                                toggleValue(field.value, label)
                              );
                            }}
                            className={cn(
                              'group relative flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 h-32 cursor-pointer transition-all',
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-100 hover:border-primary/30',
                              isDisabled &&
                                'opacity-50 cursor-not-allowed'
                            )}
                          >
                            <div
                              className={cn(
                                'p-3 rounded-full',
                                isSelected
                                  ? 'bg-white'
                                  : `bg-gray-50 ${config.bgColor}`
                              )}
                            >
                              <Icon
                                className={cn(
                                  'w-6 h-6',
                                  isSelected
                                    ? config.color
                                    : 'text-gray-400'
                                )}
                              />
                            </div>

                            <span className="text-sm font-medium">
                              {label}
                            </span>

                            {isSelected && (
                              <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-primary" />
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        </PreguntaWrapper>
      </form>
    </Form>
  );
}
