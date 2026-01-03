"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Camera,
  MapPin,
  Calendar,
  Plus,
  X,
  ArrowLeft,
  Lock,
  Globe,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ImagePlus,
  Eye,
  GripHorizontal,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { ItinerariosAPI } from "@/api/ItinerariosAPI";

// 1. IMPORTAMOS LA UTILIDAD DE CATEGORÍAS
import { getCategoryStyle } from "@/lib/category-utils";

// --- TIPOS ---
interface Lugar {
  id: string;
  titulo: string;
}

interface Dia {
  dia: number;
  fecha: string;
  lugares: Lugar[];
}

interface Itinerario {
  id: string;
  titulo: string;
  dias: Dia[];
  resumen: {
    diasTotales: number;
    totalLugares: number;
    categorias: string[];
  };
}

interface SortablePhotoProps {
  id: string;
  file: File;
  index: number;
  onRemove: (index: number) => void;
  onView: (file: File) => void;
}

// --- COMPONENTE FOTO ORDENABLE ---
function SortablePhoto({
  id,
  file,
  index,
  onRemove,
  onView,
}: SortablePhotoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative aspect-square rounded-xl overflow-hidden bg-muted border shadow-sm hover:shadow-md transition-all"
    >
      <Image src={previewUrl} alt="Preview" fill className="object-cover" />

      {/* Overlay al hacer hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div
          className="p-2 bg-white/90 rounded-full cursor-grab active:cursor-grabbing shadow-sm hover:scale-110 transition-transform"
          {...attributes}
          {...listeners}
        >
          <GripHorizontal className="h-4 w-4 text-gray-700" />
        </div>
      </div>

      {/* Botón Ver */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onView(file);
        }}
        className="absolute bottom-2 left-2 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all"
        title="Ver grande"
      >
        <Maximize2 className="h-3 w-3" />
      </button>

      {/* Botón Eliminar */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 rounded-full text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all shadow-sm"
        title="Eliminar"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function ItineraryPublishView({ id }: { id: string }) {
  const router = useRouter();

  // Estados
  const [itinerario, setItinerario] = useState<Itinerario | null>(null);
  const [loading, setLoading] = useState(true);
  const [descripcion, setDescripcion] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [privacityMode, setPrivacityMode] = useState<boolean | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [lightboxFile, setLightboxFile] = useState<File | null>(null); // Estado para el lightbox

  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_CARACTERES = 300;
  const MAX_FOTOS = 10;

  // Sensores DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- CARGA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const api = ItinerariosAPI.getInstance();
        const data = await api.getItinerarioById(id); // Usando la API
        const actividadesOrdenadas =
          data.actividades?.sort(
            (a: any, b: any) =>
              new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
          ) || [];

        const actividadesPorDia: Record<string, Lugar[]> = {};
        actividadesOrdenadas.forEach((act: any) => {
          const fecha = new Date(act.fecha).toISOString().split("T")[0];
          if (!actividadesPorDia[fecha]) actividadesPorDia[fecha] = [];
          actividadesPorDia[fecha].push({
            id: act.id,
            titulo: act.lugar.nombre,
          });
        });

        const dias = Object.keys(actividadesPorDia)
          .sort()
          .map((fecha, index) => ({
            dia: index + 1,
            fecha,
            lugares: actividadesPorDia[fecha],
          }));

        setItinerario({
          id: data.id,
          titulo: data.title,
          dias,
          resumen: {
            diasTotales: dias.length,
            totalLugares: actividadesOrdenadas.length,
            categorias: [
              ...new Set(
                actividadesOrdenadas.map((a: any) => a.lugar.category)
              ),
            ] as string[],
          },
        });

        if (data.descripcion) setDescripcion(data.descripcion);
      } catch (err) {
        toast.error("Error", {
          description: "No pudimos cargar el itinerario.",
        });
        router.push("/viajero");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  // --- FOTOS ---
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const archivos = Array.from(files);

    if (fotos.length + archivos.length > MAX_FOTOS) {
      toast.warning(`Máximo ${MAX_FOTOS} fotos permitidas.`);
      return;
    }

    const validFiles = archivos.filter(
      (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length !== archivos.length) {
      toast.warning("Algunos archivos eran inválidos (>5MB o no imagen).");
    }

    setFotos((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  // DnD Handler
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setFotos((items) => {
        const oldIndex = items.findIndex((f) => f.name === active.id);
        const newIndex = items.findIndex((f) => f.name === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // --- PUBLICAR ---
  const publicarItinerario = async () => {
    if (fotos.length === 0) return toast.error("Se requiere al menos 1 foto.");
    if (privacityMode === null) return toast.error("Selecciona la privacidad.");

    setPublishing(true);
    const toastId = toast.loading("Publicando viaje...");

    try {
      const api = ItinerariosAPI.getInstance();

      const shareRequest = {
        descripcion: descripcion.trim(),
        privacity_mode: privacityMode!, // Usamos '!' porque el botón está deshabilitado si es null
        fotos: fotos, // Pasamos el array de archivos directamente
      };

      // 2. Llamamos al método de la API con el objeto correcto.
      console.log("Publicando con datos:", shareRequest);
      await api.shareItinerary(Number(id), shareRequest);

      toast.success("¡Viaje publicado!", { id: toastId });
      router.push("/viajero");
    } catch (error) {
      console.error("Error al publicar:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo conectar con el servidor.";
      toast.error("Error al publicar", {
        id: toastId,
        description: errorMessage,
      });
    } finally {
      setPublishing(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  if (!itinerario) return null;

  const hasPhotos = fotos.length > 0;
  const hasPrivacy = privacityMode !== null;
  const isReady = hasPhotos && hasPrivacy;

  return (
    <div className="min-h-screen bg-muted/5 pb-20">
      {/* HEADER COMPACTO */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-9 w-9 rounded-full shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Publicando
              </span>
              <h1 className="text-base font-bold truncate">
                {itinerario.titulo}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              disabled={publishing}
              className="hidden sm:flex"
            >
              Cancelar
            </Button>
            <Button
              onClick={publicarItinerario}
              disabled={!isReady || publishing}
              size="sm"
              className={cn(
                "px-6 rounded-full transition-all font-semibold",
                isReady ? "shadow-lg shadow-primary/20" : "opacity-60"
              )}
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                "Publicar"
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* === COLUMNA IZQUIERDA: EDITOR === */}
        <div className="space-y-8">
          {/* 1. HISTORIA (Primero, como pediste) */}
          <Card className="border-none shadow-sm overflow-hidden bg-card">
            <CardHeader className="pb-4 border-b bg-muted/10 px-6 pt-5">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" /> Tu Historia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative">
                <Textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="¿Qué fue lo mejor del viaje? Comparte tips, anécdotas o por qué recomiendas esta ruta..."
                  className="min-h-[140px] text-base leading-relaxed resize-none bg-muted/20 focus:bg-background border-0 focus-visible:ring-1 focus-visible:ring-primary/20 shadow-inner p-4 rounded-xl"
                  maxLength={MAX_CARACTERES}
                />
                <div className="flex justify-end mt-2">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-md",
                      descripcion.length > MAX_CARACTERES * 0.9
                        ? "text-amber-600 bg-amber-50"
                        : "text-muted-foreground"
                    )}
                  >
                    {descripcion.length}/{MAX_CARACTERES}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. PRIVACIDAD (Compacto) */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setPrivacityMode(true)}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all flex items-center gap-3 text-left group",
                privacityMode === true
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-transparent bg-card hover:bg-muted/50 shadow-sm"
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-full transition-colors",
                  privacityMode === true
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                )}
              >
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm font-bold">Público</span>
                <span className="text-xs text-muted-foreground">
                  Visible para todos
                </span>
              </div>
              {privacityMode === true && (
                <div className="absolute top-3 right-3 text-primary animate-in zoom-in">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
            </button>

            <button
              onClick={() => setPrivacityMode(false)}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all flex items-center gap-3 text-left group",
                privacityMode === false
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-transparent bg-card hover:bg-muted/50 shadow-sm"
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-full transition-colors",
                  privacityMode === false
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                )}
              >
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm font-bold">Privado</span>
                <span className="text-xs text-muted-foreground">
                  Solo amigos
                </span>
              </div>
              {privacityMode === false && (
                <div className="absolute top-3 right-3 text-primary animate-in zoom-in">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
            </button>
          </div>

          {/* 3. GALERÍA (Interactivo) */}
          <Card className="border-none shadow-sm overflow-hidden bg-card">
            <CardHeader className="pb-4 border-b bg-muted/10 px-6 pt-5 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" /> Galería
              </CardTitle>
              <span className="text-xs font-medium text-muted-foreground bg-background px-2.5 py-1 rounded-full border shadow-sm">
                {fotos.length}/{MAX_FOTOS}
              </span>
            </CardHeader>
            <CardContent className="p-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={fotos.map((f) => f.name)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {/* Botón Agregar (Siempre visible si no está lleno) */}
                    {fotos.length < MAX_FOTOS && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-xl border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group bg-muted/5"
                      >
                        <div className="h-10 w-10 rounded-full bg-background group-hover:bg-primary/10 flex items-center justify-center mb-2 transition-colors shadow-sm">
                          <ImagePlus className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary">
                          Añadir Foto
                        </span>
                      </div>
                    )}

                    {/* Lista de Fotos */}
                    {fotos.map((foto, idx) => (
                      <SortablePhoto
                        key={foto.name}
                        id={foto.name}
                        file={foto}
                        index={idx}
                        onRemove={removePhoto}
                        onView={setLightboxFile}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay /> {/* Opcional para feedback visual extra */}
              </DndContext>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />

              {fotos.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Arrastra fotos aquí para organizar tu galería.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* === COLUMNA DERECHA: CONTEXTO & ITINERARIO === */}
        <div className="space-y-6 lg:sticky lg:top-20">
          {/* Tarjeta de Resumen */}
          <Card className="border-none shadow-md overflow-hidden bg-card/80 backdrop-blur-sm">
            <div className="h-24 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-5 flex flex-col justify-center border-b">
              <h3 className="font-bold text-lg text-foreground line-clamp-1">
                {itinerario.titulo}
              </h3>

              {/* 2. AQUÍ APLICAMOS LA MAGIA DE CATEGORY UTILS */}
              <div className="flex gap-2 mt-2 overflow-hidden flex-wrap h-6">
                {itinerario.resumen.categorias.slice(0, 3).map((catKey) => {
                  const style = getCategoryStyle(catKey); // Obtenemos estilo y nombre en español
                  return (
                    <Badge
                      key={catKey}
                      variant="secondary"
                      className={cn(
                        "text-[9px] uppercase font-bold tracking-wider border-0",
                        style.bg,
                        style.color
                      )}
                    >
                      {style.name}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-border/40 border-b border-border/40 bg-background/50">
              <div className="p-4 text-center">
                <span className="block text-2xl font-black text-primary">
                  {itinerario.resumen.diasTotales}
                </span>
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">
                  Días
                </span>
              </div>
              <div className="p-4 text-center">
                <span className="block text-2xl font-black text-primary">
                  {itinerario.resumen.totalLugares}
                </span>
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">
                  Lugares
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4 bg-background">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Estado
              </h4>
              <div className="space-y-3">
                <CheckItem
                  label={`Fotos (${fotos.length})`}
                  isComplete={hasPhotos}
                  icon={<Camera className="h-3 w-3" />}
                />
                <CheckItem
                  label="Privacidad"
                  isComplete={hasPrivacy}
                  icon={<Eye className="h-3 w-3" />}
                />
                <CheckItem
                  label="Historia"
                  isComplete={descripcion.length > 0}
                  isOptional
                  icon={<Info className="h-3 w-3" />}
                />
              </div>
            </div>
          </Card>

          {/* Estructura del Viaje (Timeline Vertical Mejorado) */}
          <div className="rounded-2xl border bg-card p-0 overflow-hidden shadow-sm hidden lg:block">
            <div className="p-4 border-b bg-muted/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Estructura del viaje
              </h4>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-4 space-y-0 relative">
              {/* Línea conectora vertical */}
              <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-border/60 z-0" />

              {itinerario.dias.map((d, i) => (
                <div
                  key={d.dia}
                  className="flex gap-4 relative z-10 pb-6 last:pb-0 group"
                >
                  {/* Nodo Día */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-background border-2 border-primary text-[10px] font-bold flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                      {d.dia}
                    </div>
                  </div>

                  {/* Contenido Día */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <p className="text-xs font-bold text-foreground">
                        Día {d.dia}
                      </p>
                      <span className="text-[9px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded-full">
                        {d.lugares.length} paradas
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {d.lugares.slice(0, 3).map((l) => (
                        <div
                          key={l.id}
                          className="flex items-center gap-2 text-xs text-muted-foreground pl-1 border-l-2 border-transparent hover:border-primary/30 hover:text-foreground transition-colors cursor-default"
                        >
                          <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                          <span className="truncate">{l.titulo}</span>
                        </div>
                      ))}
                      {d.lugares.length > 3 && (
                        <p className="text-[9px] text-muted-foreground pl-4 italic">
                          +{d.lugares.length - 3} más...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* LIGHTBOX MODAL */}
      <Dialog
        open={!!lightboxFile}
        onOpenChange={(open) => !open && setLightboxFile(null)}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none shadow-2xl">
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            <DialogTitle className="sr-only">Vista previa</DialogTitle>
            {lightboxFile && (
              <Image
                src={URL.createObjectURL(lightboxFile)}
                alt="Full preview"
                fill
                className="object-contain"
              />
            )}
            <button
              onClick={() => setLightboxFile(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Subcomponente CheckItem
function CheckItem({
  label,
  isComplete,
  isOptional,
  icon,
}: {
  label: string;
  isComplete: boolean;
  isOptional?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-xs group">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-1.5 rounded-full transition-colors",
            isComplete
              ? "bg-green-100 text-green-600 dark:bg-green-900/30"
              : "bg-muted text-muted-foreground"
          )}
        >
          {icon}
        </div>
        <span
          className={cn(
            "font-medium transition-colors",
            isComplete
              ? "text-foreground"
              : "text-muted-foreground group-hover:text-foreground"
          )}
        >
          {label}
        </span>
      </div>
      {isComplete ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 animate-in zoom-in" />
      ) : isOptional ? (
        <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium">
          Opcional
        </span>
      ) : (
        <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/30" />
      )}
    </div>
  );
}
