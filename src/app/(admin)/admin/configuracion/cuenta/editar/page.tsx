"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Camera, 
  Globe, 
  Lock, 
  Save, 
  Trash2, 
  User, 
  ShieldCheck, 
  KeyRound,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { z, ZodError } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label"; 
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";

import { Usuario } from "@/api/interfaces/ApiRoutes";
import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import { cn } from "@/lib/utils";

function isZodError(err: unknown): err is ZodError {
  return err instanceof ZodError;
}

export default function EditAccountPage() {
  const api = ItinerariosAPI.getInstance();
  const router = useRouter();

  // Estados Globales
  const [user, setUser] = useState<Usuario | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Estados Perfil
  const [privacidad, setPrivacidad] = useState("publica");
  const [foto, setFoto] = useState<File | undefined>(undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const [loadingSave, setLoadingSave] = useState(false);

  // Estados Seguridad (Password / Delete)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [updatingPass, setUpdatingPass] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Estados Visuales
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // --- Esquemas de Validación ---
  const profileSchema = z.object({
    nombre_completo: z.string().trim().min(1, "El nombre es requerido").regex(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/, "Solo letras y espacios"),
    username: z.string().trim().min(5, "Mínimo 5 caracteres"),
  });

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$_?¿*]).{8,}$/;
  const verifySchema = z.string().min(1, "Ingresa tu contraseña actual");
  
  const newPasswordSchema = z.string()
    .min(8, "Mínimo 8 caracteres")
    .regex(passwordRegex, "Debe tener mayúscula, minúscula, número y carácter especial (#, $, _, ?, ¿, *).");

  type ProfileForm = z.infer<typeof profileSchema>;

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { nombre_completo: "", username: "" },
  });

  // --- Carga Inicial ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getUser();
        setUser(data);
        form.reset({
          nombre_completo: data.nombre_completo || "",
          username: data.username || "",
        });
        setPrivacidad(data.privacity_mode ? "publica" : "privada");
        setPreview(data.foto_url || null);
      } catch (error) {
        toast.error("Error al cargar perfil");
      } finally {
        setLoadingInitial(false);
      }
    };
    loadData();
  }, []);

  // --- Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (values: ProfileForm) => {
    if (!user) return;
    setLoadingSave(true);

    const body: any = {
      nombre_completo: values.nombre_completo.trim(),
      username: values.username.trim(),
      privacity_mode: privacidad === "publica",
      ...(foto ? { foto } : {}),
    };

    try {
      const data = await api.updateUser(body);
      setUser(data);
      form.reset({ nombre_completo: data.nombre_completo, username: data.username });
      setPrivacidad(data.privacity_mode ? "publica" : "privada");
      setPreview(data.foto_url || null);
      toast.success("Perfil actualizado correctamente");
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar");
    } finally {
      setLoadingSave(false);
    }
  };

  // --- Handlers Seguridad ---
  const handleVerifyCurrent = async () => {
    try {
      verifySchema.parse(currentPassword);
      setVerifying(true);
      const resp = await api.verifyPassword({ password: currentPassword });
      toast.success(resp.message);
      setVerified(true);
    } catch (err: any) {
      if (isZodError(err)) toast.error(err.issues[0].message);
      else toast.error(err?.message || "Contraseña inválida");
      setVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError(null);
    if (!verified) return toast.error("Verifica tu contraseña actual primero");
    
    try {
      newPasswordSchema.parse(newPassword);
    } catch (err: any) {
      if (isZodError(err)) {
        setPasswordError(err.issues[0].message);
        return;
      }
      return toast.error("Error de validación");
    }

    setUpdatingPass(true);
    try {
      await api.updatePassword({ newPassword });
      toast.success("Contraseña actualizada correctamente");
      setVerified(false);
      setCurrentPassword("");
      setNewPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setPasswordError(null);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar");
    } finally {
      setUpdatingPass(false);
    }
  };

  const handleDeleteClick = () => {
    toast("¿Estás seguro de eliminar tu cuenta?", {
      description: "Esta acción es irreversible. Perderás todos tus datos.",
      action: {
        label: "Eliminar definitivamente",
        onClick: async () => {
          if (loadingDelete) return;
          setLoadingDelete(true);
          try {
            await api.deleteUser();
            localStorage.removeItem("authToken");
            router.push("/sign-up");
            toast.success("Cuenta eliminada");
          } catch (err: any) {
            toast.error(`Error: ${err.message}`);
          } finally {
            setLoadingDelete(false);
          }
        },
      },
      cancel: { label: "Cancelar", onClick: () => {} },
      actionButtonStyle: { backgroundColor: "#ef4444", color: "white" },
      duration: 5000,
    });
  };

  if (loadingInitial) {
    return (
      // Fondo oscuro en carga
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    // Fondo principal ajustado para dark mode
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 p-6 md:p-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header de Navegación */}
        <div className="flex items-center gap-4 mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al perfil
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Configuración de Cuenta de administrador
          </h1>
        </div>

        {/* --- TARJETA 1: DATOS PÚBLICOS --- */}
        {/* Agregado dark:bg-zinc-900 y bordes oscuros */}
        <Card className="border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <CardHeader className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
               {/* Icon wrapper adaptado */}
               <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <User className="h-5 w-5" />
               </div>
               <div>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Perfil Público</CardTitle>
                  <CardDescription className="dark:text-gray-400">Información visible para otros usuarios.</CardDescription>
               </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              
              {/* Sección Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                   <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer pointer-events-none z-10">
                      <Camera className="h-6 w-6 text-white" />
                   </div>
                   <input
                      id="foto-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="foto-input" className="cursor-pointer block relative">
                      <Avatar className="h-32 w-32 border-4 border-white dark:border-zinc-800 shadow-md ring-1 ring-gray-200 dark:ring-zinc-700">
                        <AvatarImage src={preview || ""} className="object-cover" />
                        <AvatarFallback className="text-2xl bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 font-bold">
                           {user?.username?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 bg-white dark:bg-zinc-800 p-1.5 rounded-full border dark:border-zinc-700 shadow-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        <Camera className="h-4 w-4" />
                      </div>
                    </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Click para cambiar</p>
              </div>

              {/* Formulario Datos */}
              <div className="flex-1 w-full">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSaveProfile)} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="nombre_completo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 dark:text-gray-300">Nombre Completo</FormLabel>
                            <FormControl>
                              {/* Inputs adaptados */}
                              <Input 
                                placeholder="Ej: Juan Pérez" 
                                {...field} 
                                className="bg-gray-50/50 dark:bg-zinc-950/50 border-gray-200 dark:border-zinc-800 dark:text-white" 
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
                            <FormLabel className="text-gray-700 dark:text-gray-300">Nombre de Usuario</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400">@</span>
                                <Input 
                                  placeholder="juanperez" 
                                  {...field} 
                                  className="pl-7 bg-gray-50/50 dark:bg-zinc-950/50 border-gray-200 dark:border-zinc-800 dark:text-white" 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                       <Label className="text-gray-700 dark:text-gray-300">Visibilidad del Perfil</Label>
                       <Select value={privacidad} onValueChange={setPrivacidad}>
                        <SelectTrigger className="w-full bg-gray-50/50 dark:bg-zinc-950/50 border-gray-200 dark:border-zinc-800 dark:text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                          <SelectItem value="publica" className="dark:focus:bg-zinc-800">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-blue-500" />
                              <span className="dark:text-white">Pública <span className="text-gray-400 text-xs ml-1">(Visible para todos)</span></span>
                            </div>
                          </SelectItem>
                          <SelectItem value="privada" className="dark:focus:bg-zinc-800">
                            <div className="flex items-center gap-2">
                              <Lock className="h-4 w-4 text-amber-500" />
                              <span className="dark:text-white">Privada <span className="text-gray-400 text-xs ml-1">(Solo amigos)</span></span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 flex justify-end">
                       <Button type="submit" disabled={loadingSave} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]">
                          {loadingSave ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          Guardar Cambios
                       </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- TARJETA 2: SEGURIDAD --- */}
        <Card className="border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <CardHeader className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 pb-4">
             <div className="flex items-center gap-2">
               <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
               </div>
               <div>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Seguridad</CardTitle>
                  <CardDescription className="dark:text-gray-400">Gestiona tu contraseña y acceso.</CardDescription>
               </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
             <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                   <Label className="text-gray-700 dark:text-gray-300">Contraseña Actual</Label>
                   <div className="flex gap-2">
                      <div className="relative flex-1">
                         <Input 
                           type={showCurrentPassword ? "text" : "password"}
                           placeholder="••••••••" 
                           value={currentPassword}
                           onChange={(e) => setCurrentPassword(e.target.value)}
                           // Estilos dark mode para input
                           className="bg-gray-50/50 dark:bg-zinc-950/50 border-gray-200 dark:border-zinc-800 dark:text-white pr-10" 
                           disabled={verified}
                         />
                         {!verified && (
                             <Button
                               type="button"
                               variant="ghost"
                               size="sm"
                               className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                               onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                             >
                               {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                             </Button>
                         )}
                      </div>
                      <Button 
                         type="button" 
                         variant={verified ? "outline" : "secondary"}
                         onClick={handleVerifyCurrent}
                         disabled={verifying || verified || !currentPassword}
                         // Ajustes para el botón de verificar
                         className={cn(
                           verified 
                             ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400" 
                             : "dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                         )}
                      >
                         {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : verified ? <CheckCircle2 className="h-4 w-4 mr-2" /> : null}
                         {verified ? "Verificada" : "Verificar"}
                      </Button>
                   </div>
                </div>

                {verified && (
                   <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-2 space-y-4 border-t border-gray-100 dark:border-zinc-800 mt-4">
                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300">Nueva Contraseña</Label>
                        <div className="relative">
                            <Input 
                                type={showNewPassword ? "text" : "password"}
                                placeholder="Mínimo 8 caracteres, mayúscula, símbolo..." 
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    if(passwordError) setPasswordError(null);
                                }}
                                className={cn(
                                    "bg-gray-50/50 dark:bg-zinc-950/50 border-gray-200 dark:border-zinc-800 dark:text-white pr-10",
                                    passwordError && "border-red-500 focus-visible:ring-red-500"
                                )}
                            />
                            <Button
                               type="button"
                               variant="ghost"
                               size="sm"
                               className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                               onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                               {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        
                        {passwordError ? (
                            <p className="text-sm font-medium text-red-500 animate-in slide-in-from-top-1">
                                {passwordError}
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                               <KeyRound className="h-3 w-3" />
                               Debe incluir mayúscula, número y símbolo (#, $, _, ?, ¿, *)
                            </p>
                        )}
                      </div>
                      
                      <div className="flex justify-end">
                         <Button onClick={handleUpdatePassword} disabled={updatingPass || !newPassword} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {updatingPass && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Actualizar Contraseña
                         </Button>
                      </div>
                   </div>
                )}
             </div>
          </CardContent>
        </Card>

        {/* --- ZONA DE PELIGRO --- */}
        {/* Fondo rojo suave que se adapta al modo oscuro */}
        <div className="border border-red-100 dark:border-red-900/50 rounded-xl bg-red-50/30 dark:bg-red-900/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
           <div>
              <h3 className="text-base font-bold text-red-700 dark:text-red-400">Zona de Peligro</h3>
              <p className="text-sm text-red-600/80 dark:text-red-400/70 mt-1">
                 Eliminar tu cuenta es una acción permanente y no se puede deshacer.
              </p>
           </div>
           <Button 
              variant="destructive" 
              onClick={handleDeleteClick}
              disabled={loadingDelete}
              className="bg-white dark:bg-red-950/30 border-2 border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm whitespace-nowrap"
           >
              {loadingDelete ? "Procesando..." : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Cuenta
                </>
              )}
           </Button>
        </div>

      </div>
    </div>
  );
}