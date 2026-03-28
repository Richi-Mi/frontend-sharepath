"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

// Importaciones de los componentes de Formulario de Shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FiEye, FiEyeOff } from "react-icons/fi";

import { ItinerariosAPI } from "@/api/ItinerariosAPI";

import FloatingShape from "@/components/FloatingShape"
import PasswordSM from "@/components/PasswordSM"

// 1. Definimos el "contrato" de validación con Zod
const formSchema = z.object({
  nombre_completo: z.string()
    .min(10, {
      message: "El nombre debe tener al menos 10 caracteres.",
    })
    .refine((name) => {
      // Solo acepta letras y espacios, no números ni caracteres especiales
      const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
      return nameRegex.test(name);
    }, {
      message: "El nombre solo debe contener letras, sin números ni caracteres especiales.",
    })
    .refine((name) => {
      // No debe contener múltiples espacios consecutivos o puntos inválidos
      const invalidPattern = /\s{2,}|\.\s|\s\./;
      return !invalidPattern.test(name);
    }, {
      message: "El nombre no puede contener múltiples espacios consecutivos o puntos inválidos.",
    }),
  
  correo: z.string()
    .min(1, {
      message: "El correo es requerido.",
    })
    .refine((email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
      return emailRegex.test(email);
    }, {
      message: "Ingresa un correo válido",
    }),
  
  password: z.string()
    .min(8, {
      message: "La contraseña debe tener mínimo 8 caracteres.",
    })
    .refine((password) => {
      // Debe contener mayúscula, minúscula, número y caracteres especiales válidos (#, $, _, ?, ¿, *)
      // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$_?¿*]).{8,}$/;
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
      return passwordRegex.test(password);
    }, {
      message: "La contraseña debe contener mayúscula, minúscula, número y un carácter especial válido (#, $, _, ?, ¿, *).",
    }),
  
  username: z.string()
    .min(5, {
      message: "El username debe tener al menos 5 caracteres.",
    })
    .refine((username) => {
      // Debe iniciar con una letra, no con número ni carácter especial
      const startsWithLetter = /^[a-zA-Z]/.test(username);
      return startsWithLetter;
    }, {
      message: "El username debe comenzar con una letra.",
    })
    .refine((username) => {
      // No debe contener múltiples espacios consecutivos o puntos inválidos
      const invalidPattern = /\s{2,}|\.\s|\s\./;
      return !invalidPattern.test(username);
    }, {
      message: "El username no puede contener múltiples espacios consecutivos o puntos inválidos.",
    }),
  
  foto: z.instanceof(File).optional(),
});

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 2. Configuramos el formulario con React Hook Form y el resolver de Zod
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre_completo: "",
      correo: "",
      password: "",
      username: "",
    },
  });

  // 3. La lógica de envío ahora recibe los datos validados del formulario
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    const formData = new FormData();
    formData.append("nombre_completo", values.nombre_completo);
    formData.append("correo", values.correo);
    formData.append("password", values.password);
    formData.append("username", values.username);
    if (values.foto) {
      formData.append("foto", values.foto);
    }

    const api = ItinerariosAPI.getInstance();

    const promise = (async () => {
      const correoVal = formData.get("correo");
      const usernameVal = formData.get("username");
      const passwordVal = formData.get("password");
      const nombreVal = formData.get("nombre_completo");

      if (!correoVal ||!usernameVal || !passwordVal ||!nombreVal)
          throw new Error("Datos inválidos");
   
      const registerResponse = await api.doRegister({ nombre_completo: values.nombre_completo, correo: values.correo, 
        username: values.username, password: values.password, role: "user", privacity_mode: false,
      });
      const loginUser = await api.doLogin(values.correo, values.password)
      
       router.push("/viajero"); 

      return registerResponse;
    })();

    toast.promise(promise, {
      loading: "Creando tu cuenta...",
      success: (data) => {
        setTimeout(() => router.push("/preferencias/pregunta1"), 3000);
        return "¡Registro exitoso! Serás redirigido para darnos tus preferencias.";
      },
      error: (error) => error.message,
      finally: () => setIsLoading(false),
    });
  };

  return (
    // <main className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
    <main className="flex min-h-screen w-full items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-blue-900 to-sky-900 relative overflow-hidden">
      <FloatingShape color="bg-blue-500" size="w-64 h-64" top="-5%" left="10%" delay={0} />
      <FloatingShape color="bg-sky-500" size="w-48 h-48" top="70%" left="80%" delay={5} />

      <div className="flex w-full max-w-4xl min-h-[600px] overflow-hidden rounded-2xl shadow-2xl">
        {/* Panel Izquierdo: Imagen */}
        <div className="hidden lg:block lg:w-1/2">
          <Image src="/img/bellas_artes.jpg" alt="Mural" width={1920} height={1080} className="h-full w-full object-cover" />
        </div>

        {/* Panel Derecho: Formulario */}
        <div className="flex w-full flex-col items-center justify-center bg-card p-8 lg:w-1/2">
          <div className="w-full max-w-sm text-center">
            <h2 className="mb-2 text-3xl font-bold">Regístrate</h2>
            <p className="mb-4 text-sm text-muted-foreground">Crea tu cuenta para empezar a explorar.</p>

            {/* 4. Envolvemos el formulario con los componentes de Shadcn UI */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nombre_completo"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Nombre completo" {...field} className="py-5" disabled={isLoading} />
                      </FormControl>
                      {/* <FormMessage /> */}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Username" {...field} className="py-5" disabled={isLoading} />
                      </FormControl>
                      {/* <FormMessage /> */}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="correo"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="email" placeholder="Correo (ejemplo: usuario@dominio.com)" {...field} className="py-5" disabled={isLoading} />
                      </FormControl>
                      {/* <FormMessage /> */}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Contraseña"
                            {...field}
                            className="py-5 pr-10"
                            disabled={isLoading}
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                        </button>
                      </div>
                      {/* <FormMessage /> */}
                      <PasswordSM password={form.watch("password")} />
                    </FormItem>
                  )}
                />
                
                <p className="text-xs text-muted-foreground">
                    Al registrarte, aceptas nuestras <Link href="/sign-up/terminos" className="underline">Terminos y Condiciones</Link>.
                </p>

                <Button type="submit" className="w-full py-6 text-lg font-semibold" disabled={isLoading}>
                  {isLoading ? "Registrando..." : "Regístrate"}
                </Button>
              </form>
            </Form>
            
            <p className="mt-3 text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/sign-in" className="font-semibold text-primary hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}