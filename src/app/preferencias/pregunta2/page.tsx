'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PreguntaWrapper } from '@/components/cuestionario/PreguntaWrapper';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Mountain,
  Landmark,
  Sun,
  Compass,
  CheckCircle2,
} from 'lucide-react';


const STATE_CONFIG: Record<
  string,
  { icon: any; color: string }
> = {
  'Ciudad de México': {
    icon: MapPin,
    color: 'text-rose-600',
  },
  'Estado de México': {
    icon: Compass,
    color: 'text-slate-600',
  },
  Querétaro: {
    icon: Landmark,
    color: 'text-amber-600',
  },
  Morelos: {
    icon: Sun,
    color: 'text-orange-500',
  },
  Hidalgo: {
    icon: Mountain,
    color: 'text-emerald-600',
  },
};

const PreguntaSchema = z.object({
  pregunta2: z
    .array(z.string())
    .min(1, 'Seleccione al menos una opción')
    .max(3, 'Seleccione máximo tres'),
});

type PreguntaValues = z.infer<typeof PreguntaSchema>;


const getStoredData = () => {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem('form-data');
  return stored ? JSON.parse(stored) : {};
};

const updateFormData = (data: Partial<PreguntaValues>) => {
  if (typeof window === 'undefined') return;
  const currentData = getStoredData();
  localStorage.setItem('form-data', JSON.stringify({ ...currentData, ...data }));
};


export default function Pregunta2Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const totalPreguntas = 3;

  const form = useForm<PreguntaValues>({
    resolver: zodResolver(PreguntaSchema),
    defaultValues: { pregunta2: [] },
  });


  useEffect(() => {
    const stored = getStoredData();
    if (Array.isArray(stored.pregunta2)) {
      form.reset({ pregunta2: stored.pregunta2 });
    }
  }, [form]);

  const currentSelection = form.watch('pregunta2') || [];

  const toggleValue = (values: string[], value: string) => {
    if (values.includes(value)) {
      return values.filter((v) => v !== value);
    }
    return [...values, value];
  };

  const onSiguiente = (data: PreguntaValues) => {
    setIsLoading(true);
    updateFormData(data);
    router.push('/preferencias/pregunta3');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSiguiente)}>
        <PreguntaWrapper
          preguntaActual={2}
          totalPreguntas={totalPreguntas}
          onSiguiente={form.handleSubmit(onSiguiente)}
          isLoading={isLoading}
          selectedCount={currentSelection.length}
        >
          <FormField
            control={form.control}
            name="pregunta2"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <div className="flex justify-between items-center">
                  <FormLabel className="text-2xl font-bold text-blue-950">
                    2) ¿Qué estado visitas con mayor frecuencia?
                  </FormLabel>
                  <span
                    className={cn(
                      'text-xs px-3 py-1 rounded-full border',
                      currentSelection.length === 0
                        ? 'bg-gray-100 text-gray-500'
                        : currentSelection.length > 3
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-50 text-blue-700'
                    )}
                  >
                    Seleccionados: {currentSelection.length} / 3
                  </span>
                </div>

                <FormControl>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.keys(STATE_CONFIG).map((opt) => {
                      const isSelected = field.value.includes(opt);
                      const { icon: Icon, color } = STATE_CONFIG[opt];
                      const isDisabled =
                        !isSelected && field.value.length >= 3;

                      return (
                        <div
                          key={opt}
                          onClick={() => {
                            if (isDisabled) return;
                            field.onChange(toggleValue(field.value, opt));
                          }}
                          className={cn(
                            'cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition h-36',
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-100 hover:border-primary/30',
                            isDisabled &&
                              'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <Icon
                            className={cn(
                              'w-7 h-7',
                              isSelected ? color : 'text-gray-400'
                            )}
                          />
                          <span className="text-sm text-center">{opt}</span>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      );
                    })}
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
