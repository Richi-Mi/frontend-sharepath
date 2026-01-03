"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Globe,
  Lock,
  Save,
  ShieldAlert,
  User,
  Key,
  Check,
  Loader2,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Pencil,
  Eye,
  EyeOff,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z, ZodError } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import { Usuario } from "@/api/interfaces/ApiRoutes";
import { cn } from "@/lib/utils";

// --- VALIDACIONES DE CONTRASEÑA ---
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$_?¿*]).{8,}$/;

const newPasswordSchema = z
  .string()
  .min(8, "La contraseña debe tener mínimo 8 caracteres")
  .regex(passwordRegex, {
    message:
      "La contraseña debe contener mayúscula, minúscula, número y un carácter especial válido (#, $, _, ?, ¿, *).",
  });

const profileSchema = z.object({
  nombre_completo: z
    .string()
    .trim()
    .min(1, "El nombre es requerido")
    .regex(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/, "Solo letras y espacios"),
  username: z.string().trim().min(5, "Mínimo 5 caracteres"),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function EditAccountPage() {
  const api = ItinerariosAPI.getInstance();
  const router = useRouter();

  const [user, setUser] = useState<Usuario | null>(null);
  const [privacidad, setPrivacidad] = useState("publica");
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [foto, setFoto] = useState<File | undefined>(undefined);
  const [preview, setPreview] = useState<string | null>(null);

  // Estados contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Estados de interfaz (Visibilidad y Errores)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // NUEVO: Estado para el mensaje de error en línea
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { nombre_completo: "", username: "" },
  });

  // --- CARGA INICIAL ---
  useEffect(() => {
    api.getUser().then((data) => {
      setUser(data);
      form.reset({
        nombre_completo: data.nombre_completo || "",
        username: data.username || "",
      });
      setPrivacidad(data.privacity_mode ? "publica" : "privada");
      setPreview(data.foto_url || null);
    });
  }, []);

  // --- HANDLERS ---
  const handleSave = async (values: ProfileForm) => {
    if (!user) return;
    const body: any = {
      nombre_completo: values.nombre_completo.trim(),
      username: values.username.trim(),
      privacity_mode: privacidad === "publica",
      ...(foto ? { foto } : {}),
    };
    toast.promise(api.updateUser(body), {
      loading: "Guardando cambios...",
      success: (data) => {
        setUser(data);
        form.reset({
          nombre_completo: data.nombre_completo,
          username: data.username,
        });
        setPrivacidad(data.privacity_mode ? "publica" : "privada");
        setPreview(data.foto_url || null);
        return "Perfil actualizado con éxito";
      },
      error: (err) => err.message,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    setFoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDeleteClick = () => {
    toast("¿Estás absolutamente seguro?", {
      description: "Esta acción no se puede deshacer.",
      action: {
        label: "Eliminar mi cuenta",
        onClick: async () => {
          setLoadingDelete(true);
          try {
            await api.deleteUser();
            localStorage.removeItem("authToken");
            router.push("/sign-up");
          } catch (err: any) {
            toast.error(err.message || "Error al eliminar");
          } finally {
            setLoadingDelete(false);
          }
        },
      },
      cancel: { label: "Cancelar", onClick: () => {} },
      actionButtonStyle: {
        backgroundColor: "var(--destructive)",
        color: "white",
      },
    });
  };

  const handleVerifyCurrent = async () => {
    if (!currentPassword) return toast.error("Ingresa tu contraseña actual");
    setVerifying(true);
    try {
      const resp = await api.verifyPassword({ password: currentPassword });
      toast.success(resp.message);
      setVerified(true);
    } catch (error: any) {
      toast.error(error?.message || "Error");
      setVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleUpdatePassword = async () => {
    // 1. Limpiamos errores previos
    setPasswordError(null);

    // 2. Validación con Zod
    try {
      newPasswordSchema.parse(newPassword);
    } catch (err) {
      if (err instanceof ZodError) {
        // En lugar de toast, guardamos el error en el estado para mostrarlo abajo del input
        setPasswordError(err.issues[0].message);
        return; // Detenemos la ejecución
      }
      return toast.error("Contraseña inválida");
    }

    setUpdating(true);
    
    toast.promise(api.updatePassword({ newPassword }), {
      loading: "Actualizando...",
      success: () => {
        setVerified(false);
        setCurrentPassword("");
        setNewPassword("");
        setUpdating(false);
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setPasswordError(null); // Limpiamos error al finalizar
        return "Contraseña actualizada";
      },
      error: (err) => {
        setUpdating(false);
        return err.message;
      },
    });
  };

  if (!user) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">Configuración de Cuenta</h1>
          </div>
          <div className="text-sm text-muted-foreground hidden sm:block">
            Cambios guardados localmente hasta confirmar.
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          
          {/* --- IZQUIERDA: PERFIL --- */}
          <div className="lg:col-span-4 relative">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="relative group overflow-hidden rounded-3xl bg-card border border-border/50 shadow-xl dark:shadow-none dark:bg-muted/10 p-8 text-center">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50 group-hover:opacity-70 transition-opacity" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative mb-4">
                    <input
                      id="foto-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="foto-input"
                      className="cursor-pointer block relative group/avatar"
                    >
                      <Avatar className="h-32 w-32 border-4 border-background shadow-2xl transition-transform duration-300 group-hover/avatar:scale-105">
                        <AvatarImage
                          src={preview || user.foto_url || ""}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-4xl font-black bg-muted">
                          {user.username?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-[2px]">
                        <Camera className="h-8 w-8 text-white drop-shadow-md" />
                      </div>
                      <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg border-2 border-background">
                        <Pencil className="h-3 w-3" />
                      </div>
                    </label>
                  </div>

                  <h2 className="text-xl font-bold text-foreground truncate w-full">
                    {form.watch("nombre_completo") || user.nombre_completo}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    @{form.watch("username") || user.username}
                  </p>

                  <Badge variant="outline" className="bg-background/50 backdrop-blur-sm px-3 py-1">
                    {user.role === "user" ? "Viajero" : user.role}
                  </Badge>
                </div>
              </div>

              <div className="hidden lg:block p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 text-blue-800 dark:text-blue-300 text-sm">
                <p className="font-semibold flex items-center gap-2 mb-1">
                  <Globe className="h-4 w-4" /> ¿Sabías qué?
                </p>
                <p className="opacity-80 text-xs leading-relaxed">
                  Tener un perfil público aumenta en un 40% las posibilidades de conectar con otros viajeros en tu misma ruta.
                </p>
              </div>
            </div>
          </div>

          {/* --- DERECHA: FORMULARIOS --- */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* 1. INFO PÚBLICA */}
            <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Información Pública</h3>
                  <p className="text-sm text-muted-foreground">
                    Datos visibles para otros usuarios.
                  </p>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="nombre_completo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wide text-muted-foreground font-bold">
                            Nombre Completo
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-12 bg-muted/30 border-transparent focus:bg-background focus:border-primary transition-all rounded-xl"
                              placeholder="Ej. Juan Pérez"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wide text-muted-foreground font-bold">
                            Usuario
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">@</span>
                              <Input
                                {...field}
                                className="h-12 pl-9 bg-muted/30 border-transparent focus:bg-background focus:border-primary transition-all rounded-xl"
                                placeholder="usuario"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-3">
                    <FormLabel className="text-xs uppercase tracking-wide text-muted-foreground font-bold">
                      Visibilidad
                    </FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div
                        onClick={() => setPrivacidad("publica")}
                        className={cn(
                          "cursor-pointer relative p-4 rounded-2xl border-2 transition-all duration-200 flex items-start gap-4 hover:shadow-md",
                          privacidad === "publica"
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:border-primary/30"
                        )}
                      >
                        <div className={cn("p-2 rounded-full", privacidad === "publica" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            <Globe className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <p className={cn("font-semibold", privacidad === "publica" ? "text-primary" : "text-foreground")}>Pública</p>
                            <p className="text-xs text-muted-foreground leading-snug">Cualquier viajero puede ver tus itinerarios y seguirte.</p>
                        </div>
                        {privacidad === "publica" && (
                            <div className="absolute top-4 right-4 text-primary"><Check className="h-5 w-5" /></div>
                        )}
                      </div>

                      <div
                        onClick={() => setPrivacidad("privada")}
                        className={cn(
                          "cursor-pointer relative p-4 rounded-2xl border-2 transition-all duration-200 flex items-start gap-4 hover:shadow-md",
                          privacidad === "privada"
                            ? "border-amber-500 bg-amber-500/5 shadow-sm"
                            : "border-border bg-card hover:border-amber-500/30"
                        )}
                      >
                        <div className={cn("p-2 rounded-full", privacidad === "privada" ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground")}>
                            <Lock className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <p className={cn("font-semibold", privacidad === "privada" ? "text-amber-600 dark:text-amber-500" : "text-foreground")}>Privada</p>
                            <p className="text-xs text-muted-foreground leading-snug">Solo tus seguidores aprobados verán tu actividad.</p>
                        </div>
                        {privacidad === "privada" && (
                            <div className="absolute top-4 right-4 text-amber-500"><Check className="h-5 w-5" /></div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" size="lg" className="rounded-full px-8 shadow-lg shadow-primary/25 hover:scale-105 transition-transform">
                      <Save className="h-4 w-4 mr-2" /> Guardar Cambios
                    </Button>
                  </div>
                </form>
              </Form>
            </section>

            <Separator className="bg-border/60" />

            {/* 2. SEGURIDAD */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Seguridad</h3>
                  <p className="text-sm text-muted-foreground">
                    Actualiza tu contraseña.
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-6">
                
                {/* --- Paso 1: Verificar --- */}
                <div className="space-y-3">
                    <label className="text-xs uppercase tracking-wide text-muted-foreground font-bold">Contraseña Actual</label>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Input
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                disabled={verified}
                                className={cn(
                                    "h-12 bg-muted/30 border-transparent focus:bg-background focus:border-primary transition-all rounded-xl pr-10",
                                    verified && "border-emerald-500/50 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                                )}
                                placeholder="••••••••"
                            />
                            {verified ? (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                            ) : (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-1 top-1 h-10 w-10 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            )}
                        </div>
                        {!verified && (
                            <Button 
                                onClick={handleVerifyCurrent} 
                                disabled={verifying || !currentPassword} 
                                variant="secondary" 
                                className="h-12 rounded-xl px-6"
                            >
                                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
                            </Button>
                        )}
                    </div>
                </div>

                {/* --- Paso 2: Nueva (Visible solo tras verificar) --- */}
                {verified && (
                    <div className="pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-3">
                            <label className="text-xs uppercase tracking-wide text-muted-foreground font-bold">Nueva Contraseña</label>
                            
                            <div className="relative">
                              <Input
                                  type={showNewPassword ? "text" : "password"}
                                  value={newPassword}
                                  onChange={(e) => {
                                      setNewPassword(e.target.value);
                                      if (passwordError) setPasswordError(null); // Limpiar error al escribir
                                  }}
                                  className={cn(
                                    "h-12 bg-background border-input focus:border-emerald-500 transition-all rounded-xl pr-10",
                                    // Si hay error, borde rojo
                                    passwordError && "border-destructive focus:border-destructive"
                                  )}
                                  placeholder="Mínimo 8 caracteres, mayúscula y símbolo..."
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1 h-10 w-10 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>

                            {/* --- AQUÍ EL MENSAJE DE ERROR --- */}
                            {passwordError && (
                              <p className="text-[0.8rem] font-medium text-destructive animate-in slide-in-from-top-1">
                                {passwordError}
                              </p>
                            )}

                            <div className="flex justify-end mt-4">
                                <Button 
                                    onClick={handleUpdatePassword} 
                                    disabled={updating || !newPassword} 
                                    className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                                >
                                    {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                                    Actualizar Contraseña
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
              </div>
            </section>

            <Separator className="bg-border/60" />

            {/* 3. DANGER ZONE */}
            <section className="space-y-6 opacity-90 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
                        <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-destructive">Zona de Peligro</h3>
                        <p className="text-sm text-muted-foreground">Acciones irreversibles.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h4 className="font-semibold text-foreground">Eliminar cuenta</h4>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Perderás acceso a tus itinerarios, amigos y datos guardados de forma permanente.
                        </p>
                    </div>
                    <Button 
                        variant="destructive" 
                        onClick={handleDeleteClick} 
                        disabled={loadingDelete}
                        className="shrink-0 rounded-full shadow-sm"
                    >
                        {loadingDelete ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Eliminar definitivamente
                    </Button>
                </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}