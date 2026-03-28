"use client";
import Cookies from 'js-cookie';
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "sonner";
// Se eliminan: Login, GoogleOAuthProvider
import { Usuario } from "@/api/interfaces/ApiRoutes";
import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import FloatingShape from "@/components/FloatingShape"

const formSchema = z.object({
  correo: z.string()
    .min(1, { message: "El correo es necesario" }) 
    .email({ message: "Ingresa un correo válido (ejemplo@dominio.com)" }),
  password: z.string()
    .min(1, { message: "La contraseña es necesaria" })
})

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const api = ItinerariosAPI.getInstance();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      correo: "",
      password: ""
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    const promise: Promise<Usuario> = api.doLogin(values.correo, values.password);

    toast.promise(promise, {
      loading: "Verificando credenciales...",
      success: (data) => {
        
        Cookies.set("auth_token", JSON.stringify(data), { expires: 1 });
        
        const userRole = data.role;
        let redirectPath = '/viajero';

        if (userRole === 'admin') {
          redirectPath = '/admin';
        }
        router.push(redirectPath);
        
        return `¡Bienvenido de vuelta, ${data.username}!`;
      },
      
      error: (error) => {
        return error.message || "Credenciales incorrectas. Inténtalo de nuevo.";
      },
      finally: () => {
        setIsLoading(false);
      }
    });
  };

  // Se elimina el wrapper de GoogleOAuthProvider
  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4 bg-gradient-to-tl from-gray-900 via-blue-900 to-sky-900 relative overflow-hidden">
      <div className="flex w-full max-w-4xl min-h-[600px] overflow-hidden rounded-2xl shadow-2xl">
        <FloatingShape color="bg-blue-500" size="w-64 h-64" top="70%" left="5%" delay={5} />
        <FloatingShape color="bg-sky-500" size="w-48 h-48" top="-5%" left="80%" delay={0} />
        
        {/* Panel Izquierdo: Imagen Decorativa */}
        <div className="hidden lg:block lg:w-1/2">
          <Image
            src="/img/museo_soumaya.jpg"
            alt="Mural del Palacio de Bellas Artes"
            width={1920}
            height={1080}
            className="h-full w-full object-cover"
            priority 
          />
        </div>

        {/* Panel Derecho: Formulario */}
        <div className="flex w-full flex-col items-center justify-center bg-card p-8 lg:w-1/2">
          <div className="w-full max-w-sm text-center">

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
                <Image
                  src="/img/login.png"
                  alt="Icono de login"
                  width={60}
                  height={60}
                  className="mx-auto mb-4"
                />
                <h2 className="mb-6 text-3xl font-bold text-foreground">Iniciar Sesión</h2>

                <FormField
                  control={form.control}
                  name="correo"
                  render={({ field }) => (
                    <FormItem className="text-left">
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Correo (ejemplo: usuario@dominio.com)" 
                          {...field}
                          className="py-6"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    // Se elimina el div de "Olvidé mi contraseña"
                    <FormItem className="text-left mt-4 mb-6"> 
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Contraseña"
                            {...field}
                            className="py-6 pr-10"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Se eliminó el div 'Olvidé mi contraseña' */}

                <Button type="submit" className="w-full py-6 text-lg font-semibold" disabled={isLoading}>
                  {isLoading ? "Verificando..." : "Iniciar sesión"}
                </Button>

                {/* Se eliminó el separador 'o' y el componente Login de Google */}
                
                <p className="mt-8 text-sm text-muted-foreground">
                  ¿Aún no tienes una cuenta?{" "}
                  <Link href="/sign-up" className="font-semibold text-primary hover:underline">
                    Regístrate
                  </Link>
                </p>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </main>
  );
}