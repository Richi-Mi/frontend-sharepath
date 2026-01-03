"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import type {
  PublicacionConResenas,
  Usuario,
  Resena,
  CreateResenaRequest,
  UpdateResenaRequest,
} from "@/api/interfaces/ApiRoutes";

import { cn } from "@/lib/utils";
import { getCategoryStyle } from "@/lib/category-utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  MapPin,
  MoreVertical,
  Star,
  Trash2,
  Pencil,
  ShieldAlert,
  Share2,
  MessageCircle,
  Map,
  Loader2,
  X,
  Send,
  Image as ImageIcon,
  Plus,
  Route,
  CalendarDays,
} from "lucide-react";

// ---------------- VALIDACIONES ----------------
const editSchema = z.object({
  descripcion: z
    .string()
    .trim()
    .max(600, "Máximo 600 caracteres.")
    .optional()
    .or(z.literal("")),
  privacity_mode: z.boolean(),
});

const reviewSchema = z.object({
  score: z.number().min(1, "Califica con al menos 1 estrella.").max(5),
  commentario: z
    .string()
    .trim()
    .max(280, "Máximo 280 caracteres.")
    .optional()
    .or(z.literal("")),
});

type EditForm = z.infer<typeof editSchema>;
type ReviewForm = z.infer<typeof reviewSchema>;
type ReadErrorKind = "none" | "forbidden" | "notfound" | "generic";

// ---------------- UTILIDADES ----------------
function safeUserFromLocalStorage(): Usuario | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw) as Usuario;
  } catch {
    return null;
  }
}

function averageScore(reviews: { score: number }[]) {
  if (!reviews?.length) return { avg: 0, count: 0 };
  const sum = reviews.reduce((a, r) => a + (Number(r.score) || 0), 0);
  const avg = Math.round((sum / reviews.length) * 10) / 10;
  return { avg, count: reviews.length };
}

function detectErrorKind(e: any): ReadErrorKind {
  const msg = String(e?.message ?? "").toLowerCase();
  const status = e?.status;
  if (status === 403 || msg.includes("no tienes acceso")) return "forbidden";
  if (
    status === 404 ||
    msg.includes("not found") ||
    msg.includes("no encontrada")
  )
    return "notfound";
  return "generic";
}

function isValidHttpUrl(url: string) {
  return /^https?:\/\/.+/i.test(url.trim());
}

// ---------------- TIPOS RESUMEN ITINERARIO ----------------
type ItineraryPlaceSummary = {
  id: string;
  nombre: string;
  foto_url: string | null;
  category?: string | null;
  mexican_state?: string | null;
};

type ItineraryDaySummary = {
  dayIndex: number;
  dateISO: string; // yyyy-mm-dd
  places: ItineraryPlaceSummary[];
};

type ItinerarySummary = {
  itineraryId: number;
  title: string;
  days: ItineraryDaySummary[];
  totalPlaces: number;
  startDate: Date | null;
  endDate: Date | null;
};

// ---------------- UI: RATING ----------------
function RatingStars({
  rating,
  onRate,
  interactive = false,
  size = "md",
}: {
  rating: number;
  onRate?: (r: number) => void;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizeCls =
    size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-4.5 w-4.5";

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = s <= (Number(rating) || 0);
        return (
          <button
            key={s}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(s)}
            className={cn(
              "transition-transform",
              interactive ? "hover:scale-110 active:scale-95" : "cursor-default"
            )}
            aria-label={`calificar ${s} estrellas`}
          >
            <Star
              className={cn(
                sizeCls,
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-muted text-muted-foreground/25"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function PrivacyBadge({ privacity_mode }: { privacity_mode: boolean }) {
  return (
    <Badge
      variant={privacity_mode ? "outline" : "default"}
      className={cn(
        "gap-1.5 px-2.5 py-0.5 text-xs font-medium border",
        privacity_mode
          ? "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          privacity_mode ? "bg-amber-500" : "bg-emerald-500"
        )}
      />
      {privacity_mode ? "Privado" : "Público"}
    </Badge>
  );
}

// ---------------- UI: FOTOS ----------------
function PhotoGrid({
  fotos,
  onOpen,
}: {
  fotos: { id: number; foto_url: string }[];
  onOpen: (idx: number) => void;
}) {
  if (!fotos?.length) {
    return (
      <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl bg-muted border border-border/50 flex flex-col items-center justify-center text-muted-foreground">
        <ImageIcon className="h-14 w-14 opacity-20 mb-4" />
        <p className="text-sm font-medium">Sin fotos disponibles</p>
        <p className="text-xs opacity-70 mt-1">El autor no agregó imágenes.</p>
      </div>
    );
  }

  const main = fotos[0];
  const subs = fotos.slice(1, 5);

  return (
    <div className="relative grid grid-cols-1 md:grid-cols-4 gap-2 h-[360px] md:h-[520px] rounded-2xl overflow-hidden border border-border/40 bg-muted/20">
      <div
        onClick={() => onOpen(0)}
        className="md:col-span-2 md:row-span-2 relative h-full cursor-pointer group overflow-hidden"
      >
        <Image
          src={main.foto_url}
          alt="Principal"
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>

      <div className="hidden md:grid md:col-span-2 md:row-span-2 grid-cols-2 gap-2 h-full">
        {subs.length > 0
          ? subs.map((foto, idx) => (
              <div
                key={foto.id}
                onClick={() => onOpen(idx + 1)}
                className="relative overflow-hidden cursor-pointer group"
              >
                <Image
                  src={foto.foto_url}
                  alt={`Foto ${idx + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
            ))
          : [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-muted/30 flex items-center justify-center border border-border/30"
              >
                <MapPin className="h-8 w-8 text-muted-foreground/10" />
              </div>
            ))}
      </div>

      {fotos.length > 1 && (
        <div className="md:hidden absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
          +{fotos.length - 1} fotos
        </div>
      )}
    </div>
  );
}

function PhotoViewerDialog({
  open,
  onOpenChange,
  fotos,
  initialIndex,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fotos: { id: number; foto_url: string }[];
  initialIndex: number;
}) {
  const [idx, setIdx] = React.useState(initialIndex);

  const total = fotos?.length ?? 0;

  const next = React.useCallback(() => {
    if (!total) return;
    setIdx((p) => (p + 1) % total);
  }, [total]);

  const prev = React.useCallback(() => {
    if (!total) return;
    setIdx((p) => (p - 1 + total) % total);
  }, [total]);

  React.useEffect(() => {
    if (open) setIdx(initialIndex);
  }, [open, initialIndex]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onOpenChange(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange, next, prev]);

  const current = fotos?.[idx];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[95vh] p-0 bg-black border-none shadow-none flex flex-col justify-center items-center">
        <DialogClose className="absolute top-4 right-4 z-50 rounded-full bg-white/10 p-2 hover:bg-white/20 text-white">
          <X className="h-6 w-6" />
        </DialogClose>

        <div className="relative w-full h-full">
          {current ? (
            <Image
              src={current.foto_url}
              alt="Full view"
              fill
              className="object-contain"
              quality={100}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              Imagen no disponible
            </div>
          )}
        </div>

        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              type="button"
              aria-label="foto anterior"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              type="button"
              aria-label="foto siguiente"
            >
              <ArrowLeft className="h-6 w-6 rotate-180" />
            </button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-1.5 rounded-full text-white text-sm backdrop-blur-md border border-white/10">
              {idx + 1} / {total}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------- UI: RESUMEN ITINERARIO ----------------
function ItinerarySummaryPanel({
  summary,
  loading,
  onOpenItinerary,
}: {
  summary: ItinerarySummary | null;
  loading: boolean;
  onOpenItinerary?: () => void;
}) {
  if (loading) {
    return (
      <Card className="rounded-3xl border-border/60 shadow-sm">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold">Resumen del itinerario</p>
          </div>
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.days.length === 0) {
    return (
      <Card className="rounded-3xl border-border/60 shadow-sm">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold">Resumen del itinerario</p>
          </div>
          <div className="rounded-2xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
            No pudimos generar el resumen (sin actividades o sin acceso).
          </div>
        </CardContent>
      </Card>
    );
  }

  const startLabel = summary.startDate
    ? format(summary.startDate, "d MMM yyyy", { locale: es })
    : null;
  const endLabel = summary.endDate
    ? format(summary.endDate, "d MMM yyyy", { locale: es })
    : null;

  return (
    <Card className="rounded-3xl border-border/60 shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold">Resumen del itinerario</p>
          </div>

          {onOpenItinerary ? (
            <Button
              variant="outline"
              className="rounded-full h-8 px-3 text-xs"
              onClick={onOpenItinerary}
              type="button"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-2" />
              abrir
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            {summary.days.length} días
          </Badge>
          <Badge variant="secondary" className="rounded-full">
            {summary.totalPlaces} paradas
          </Badge>
          {startLabel && endLabel ? (
            <Badge variant="outline" className="rounded-full">
              <CalendarDays className="h-3.5 w-3.5 mr-2" />
              {startLabel} – {endLabel}
            </Badge>
          ) : null}
        </div>

        <Separator />

        <ScrollArea className="h-[340px] pr-3">
          <div className="space-y-3">
            {summary.days.map((d) => (
              <div
                key={d.dateISO}
                className="rounded-2xl border border-border/50 bg-muted/10 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/40 bg-background/60">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">
                      Día {d.dayIndex}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(d.dateISO), "EEEE d MMM", { locale: es })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="rounded-full shrink-0">
                    {d.places.length} lugares
                  </Badge>
                </div>

                <div className="p-3 space-y-2">
                  {d.places.map((p) => {
                    const style = getCategoryStyle(p.category ?? undefined);
                    const imageSrc = p.foto_url || style.defaultImage;
                    const Icon = style.icon;

                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 rounded-xl border border-border/40 bg-background px-3 py-2"
                      >
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">
                          <Image
                            src={imageSrc}
                            alt={p.nombre}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">
                            {p.nombre}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                            {p.mexican_state && <span>{p.mexican_state}</span>}
                            {p.mexican_state && (
                              <span className="opacity-30">·</span>
                            )}
                            <span
                              className={cn(
                                "flex items-center gap-1 font-medium",
                                style.color
                              )}
                            >
                              <Icon className="h-3 w-3" />
                              {style.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ---------------- PLACEHOLDERS ----------------
function SkeletonView() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8 min-h-screen">
      <div className="space-y-4">
        <Skeleton className="h-12 w-3/4 rounded-xl" />
        <Skeleton className="h-6 w-48 rounded-full" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-2xl" />
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    </div>
  );
}

function ErrorView({
  kind,
  onRetry,
  onBack,
}: {
  kind: ReadErrorKind;
  onRetry: () => void;
  onBack: () => void;
}) {
  const title =
    kind === "forbidden"
      ? "No tienes acceso a esta publicación"
      : kind === "notfound"
      ? "No encontramos la publicación"
      : "No se pudo cargar el contenido";

  const desc =
    kind === "forbidden"
      ? "Puede ser privada o no tienes permisos para verla."
      : kind === "notfound"
      ? "Puede que haya sido eliminada o el enlace es incorrecto."
      : "Error de conexión o del servidor. Intenta nuevamente.";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4 bg-background">
      <ShieldAlert className="h-12 w-12 text-muted-foreground/30" />
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-muted-foreground max-w-md">{desc}</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button onClick={onRetry}>Reintentar</Button>
      </div>
    </div>
  );
}

// ---------------- VISTA PRINCIPAL ----------------
export function PublicacionReadView({
  publicacionId,
  itineraryHrefBuilder,
}: {
  publicacionId: number;
  itineraryHrefBuilder?: (itinerarioId: number) => string;
}) {
  const router = useRouter();

  // Data base
  const [data, setData] = React.useState<PublicacionConResenas | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [errorKind, setErrorKind] = React.useState<ReadErrorKind>("none");

  // Modales
  const [photoOpen, setPhotoOpen] = React.useState(false);
  const [photoIndex, setPhotoIndex] = React.useState(0);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Reseñas: estados
  const [resenas, setResenas] = React.useState<Resena[]>([]);
  const [loadingResenas, setLoadingResenas] = React.useState(false);
  const [submittingResena, setSubmittingResena] = React.useState(false);
  const [deleteResenaOpen, setDeleteResenaOpen] = React.useState(false);
  const [deleteResenaId, setDeleteResenaId] = React.useState<number | null>(
    null
  );

  // Draft de reseña
  const [myResena, setMyResena] = React.useState<Resena | null>(null);
  const [editingResena, setEditingResena] = React.useState(false);

  // Draft de fotos
  const [photoDraft, setPhotoDraft] = React.useState<{
    removeIds: Set<number>;
    addUrls: string[];
    urlInput: string;
  }>({ removeIds: new Set(), addUrls: [], urlInput: "" });

  // Resumen itinerario
  const [itSummary, setItSummary] = React.useState<ItinerarySummary | null>(
    null
  );
  const [loadingItSummary, setLoadingItSummary] = React.useState(false);

  // Usuario actual
  const currentUser = React.useMemo(() => {
    if (typeof window === "undefined") return null;
    return safeUserFromLocalStorage();
  }, []);

  const canManage = React.useMemo(() => {
    if (!currentUser || !data) return false;
    return currentUser.username === data.user_shared.username;
  }, [currentUser, data]);

  const itineraryHref = React.useMemo(() => {
    const build =
      itineraryHrefBuilder ??
      ((id: number) => `/viajero/itinerarios/${id}/verPublicacion`);
    return data?.itinerario?.id ? build(data.itinerario.id) : null;
  }, [data, itineraryHrefBuilder]);

  // Forms
  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { descripcion: "", privacity_mode: false },
    mode: "onChange",
  });

  const reviewForm = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { score: 0 as any, commentario: "" },
    mode: "onChange",
  });

  // --------- cargar publicación ----------
  const fetchOne = React.useCallback(async () => {
    if (!Number.isFinite(publicacionId)) {
      setLoading(false);
      setData(null);
      setErrorKind("notfound");
      return;
    }

    setErrorKind("none");

    try {
      const api = ItinerariosAPI.getInstance();
      const res = await api.getPublicationWithResenas(publicacionId);
      setData(res);

      const rs = (res as any)?.reseñas ?? [];
      setResenas(rs);

      // reseña del usuario actual
      if (currentUser?.username) {
        const mine =
          rs.find(
            (r: Resena) => r?.usuario?.username === currentUser.username
          ) ?? null;
        setMyResena(mine);
        setEditingResena(false);

        reviewForm.reset({
          score: mine?.score ?? (0 as any),
          commentario: mine?.commentario ?? "",
        });
      } else {
        setMyResena(null);
        setEditingResena(false);
        reviewForm.reset({ score: 0 as any, commentario: "" });
      }

      // edit form
      editForm.reset({
        descripcion: res.descripcion ?? "",
        privacity_mode: Boolean(res.privacity_mode),
      });

      // fotos draft
      setPhotoDraft({ removeIds: new Set(), addUrls: [], urlInput: "" });
      setErrorKind("none");
    } catch (e: any) {
      console.error(e);
      const kind = detectErrorKind(e);
      setData(null);
      setErrorKind(kind);

      if (kind === "generic") {
        toast.error("No pudimos cargar la publicación.", {
          description: e instanceof Error ? e.message : "Error desconocido",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [publicacionId, currentUser?.username, editForm, reviewForm]);

  React.useEffect(() => {
    fetchOne();
  }, [fetchOne]);

  const { avg, count } = React.useMemo(
    () => averageScore(resenas ?? []),
    [resenas]
  );

  // --------- cargar resumen del itinerario (días/lugares) ----------
  React.useEffect(() => {
    const itineraryId = data?.itinerario?.id;
    if (!itineraryId) {
      setItSummary(null);
      return;
    }

    let cancelled = false;

    async function loadSummary() {
      setLoadingItSummary(true);
      try {
        const api = ItinerariosAPI.getInstance();
        const raw: any = await api.getItinerarioById(String(itineraryId));

        const actividades = (raw?.actividades ?? []).slice().sort((a: any, b: any) => {
          return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        });

        const grouped: Record<string, ItineraryPlaceSummary[]> = {};

        for (const act of actividades) {
          const fechaKey = new Date(act.fecha).toISOString().split("T")[0];
          if (!grouped[fechaKey]) grouped[fechaKey] = [];

          const lugar = act?.lugar ?? {};
          grouped[fechaKey].push({
            id: String(act._id ?? act.id ?? lugar.id ?? Math.random()),
            nombre: String(lugar.nombre ?? "Lugar"),
            foto_url: lugar.foto_url ?? null,
            category: lugar.category ?? null,
            mexican_state: lugar.mexican_state ?? null,
          });
        }

        const daysISO = Object.keys(grouped).sort();
        const days: ItineraryDaySummary[] = daysISO.map((dateISO, idx) => ({
          dayIndex: idx + 1,
          dateISO,
          places: grouped[dateISO],
        }));

        const totalPlaces = days.reduce((acc, d) => acc + d.places.length, 0);
        const startDate = days[0]?.dateISO ? new Date(days[0].dateISO) : null;
        const endDate = days[days.length - 1]?.dateISO
          ? new Date(days[days.length - 1].dateISO)
          : null;

        const nextSummary: ItinerarySummary = {
          itineraryId: Number(itineraryId),
          title: String(raw?.title ?? data?.itinerario?.title ?? "Itinerario"),
          days,
          totalPlaces,
          startDate,
          endDate,
        };

        if (!cancelled) setItSummary(nextSummary);
      } catch (e) {
        console.error(e);
        if (!cancelled) setItSummary(null);
      } finally {
        if (!cancelled) setLoadingItSummary(false);
      }
    }

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [data?.itinerario?.id, data?.itinerario?.title]);

  // ---------- acciones de reseñas ----------
  const reloadResenas = React.useCallback(async () => {
    if (!data) return;
    setLoadingResenas(true);
    try {
      const api = ItinerariosAPI.getInstance();
      const rs = await api.getResenasByPublicacion(data.id);
      setResenas(rs);

      if (currentUser?.username) {
        const mine =
          rs.find(
            (r: Resena) => r?.usuario?.username === currentUser.username
          ) ?? null;
        setMyResena(mine);
        setEditingResena(false);
        reviewForm.reset({
          score: mine?.score ?? (0 as any),
          commentario: mine?.commentario ?? "",
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("No se pudieron cargar las reseñas.");
    } finally {
      setLoadingResenas(false);
    }
  }, [data, currentUser?.username, reviewForm]);

  const submitResena = async () => {
    if (!data) return;
    if (!currentUser) {
      toast.info("Inicia sesión para dejar una reseña.");
      return;
    }

    const values = reviewForm.getValues();
    const parsed = reviewSchema.safeParse(values);
    if (!parsed.success) {
      const first = parsed.error.issues?.[0]?.message ?? "Revisa tu reseña.";
      toast.error(first);
      return;
    }

    setSubmittingResena(true);
    try {
      const api = ItinerariosAPI.getInstance();

      if (!myResena) {
        const req: CreateResenaRequest = {
          score: parsed.data.score,
          commentario: (parsed.data.commentario ?? "").trim(),
        };
        const created = await api.createResena(data.id, req);
        toast.success("¡Gracias por tu reseña!");
        setResenas((prev) => [created, ...prev]);
        setMyResena(created);
        setEditingResena(false);
      } else {
        const req: UpdateResenaRequest = {
          score: parsed.data.score,
          commentario: (parsed.data.commentario ?? "").trim(),
        };
        const updated = await api.updateResena(myResena.id, req);
        toast.success("Reseña actualizada");
        setResenas((prev) =>
          prev.map((r) => (r.id === myResena.id ? updated : r))
        );
        setMyResena(updated);
        setEditingResena(false);
      }
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudo guardar la reseña.", {
        description: e?.message ?? "Intenta nuevamente.",
      });
    } finally {
      setSubmittingResena(false);
    }
  };

  const confirmDeleteResena = (id: number) => {
    setDeleteResenaId(id);
    setDeleteResenaOpen(true);
  };

  const deleteResena = async () => {
    if (!deleteResenaId) return;
    setSubmittingResena(true);
    try {
      const api = ItinerariosAPI.getInstance();
      await api.deleteResena(deleteResenaId);
      toast.success("Reseña eliminada");
      setResenas((prev) => prev.filter((r) => r.id !== deleteResenaId));
      if (myResena?.id === deleteResenaId) {
        setMyResena(null);
        setEditingResena(false);
        reviewForm.reset({ score: 0 as any, commentario: "" });
      }
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudo eliminar la reseña.", {
        description: e?.message ?? "",
      });
    } finally {
      setSubmittingResena(false);
      setDeleteResenaOpen(false);
      setDeleteResenaId(null);
    }
  };

  // ---------- edición publicación (detalles + fotos) ----------
  const onSaveDetails = async (values: EditForm) => {
    if (!data) return;

    const nextDescripcion = (values.descripcion ?? "").trim();
    const unchanged =
      nextDescripcion === (data.descripcion ?? "").trim() &&
      values.privacity_mode === data.privacity_mode;

    const hasPhotoChanges =
      photoDraft.addUrls.length > 0 || photoDraft.removeIds.size > 0;

    if (unchanged && !hasPhotoChanges) {
      toast.message("No hay cambios por guardar.");
      setEditOpen(false);
      return;
    }

    setSaving(true);
    const t = toast.loading("Guardando cambios...");

    try {
      const api = ItinerariosAPI.getInstance();

      if (!unchanged) {
        await api.updatePublication(data.id, {
          descripcion: nextDescripcion,
          privacity_mode: values.privacity_mode,
        });
      }

      // Fotos (si tu backend lo soporta)
      if (hasPhotoChanges) {
        const apiAny: any = api;

        if (photoDraft.removeIds.size > 0) {
          if (typeof apiAny.deletePublicationPhoto === "function") {
            await Promise.all(
              [...photoDraft.removeIds].map((photoId) =>
                apiAny.deletePublicationPhoto(photoId)
              )
            );
          } else {
            toast.info("Tu backend aún no soporta eliminar fotos por id.");
          }
        }

        if (photoDraft.addUrls.length > 0) {
          if (typeof apiAny.addPublicationPhotoUrl === "function") {
            await Promise.all(
              photoDraft.addUrls.map((url) =>
                apiAny.addPublicationPhotoUrl(data.id, { foto_url: url })
              )
            );
          } else if (typeof apiAny.updatePublicationPhotos === "function") {
            const current = (data.fotos ?? []).filter(
              (f) => !photoDraft.removeIds.has(f.id)
            );
            const next = [
              ...current.map((f) => f.foto_url),
              ...photoDraft.addUrls,
            ];
            await apiAny.updatePublicationPhotos(data.id, { fotos: next });
          } else {
            toast.info(
              "Tu backend aún no soporta agregar/actualizar fotos de publicación."
            );
          }
        }
      }

      toast.success("Publicación actualizada", { id: t });
      setEditOpen(false);
      setRefreshing(true);
      await fetchOne();
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudo actualizar", {
        id: t,
        description: e?.message ?? "Error desconocido",
      });
    } finally {
      setSaving(false);
    }
  };

  // ---------- borrar publicación ----------
  const onDeletePublication = async () => {
    if (!data) return;
    setDeleting(true);
    const t = toast.loading("Eliminando publicación...");

    try {
      const api = ItinerariosAPI.getInstance();
      await api.deletePublication(data.id);
      toast.success("Eliminada correctamente", { id: t });
      router.push("/viajero");
    } catch (e: any) {
      console.error(e);
      toast.error("Error al eliminar", {
        id: t,
        description: e?.message ?? "",
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  // ---------- helpers UI ----------
  const publishedLabel = React.useMemo(() => {
    return `Publicado recientemente · ${format(new Date(), "dd MMM yyyy", {
      locale: es,
    })}`;
  }, []);

  const openPhoto = (idx: number) => {
    setPhotoIndex(idx);
    setPhotoOpen(true);
  };

  const onAddPhotoUrl = () => {
    const url = (photoDraft.urlInput ?? "").trim();
    if (!url) return;
    if (!isValidHttpUrl(url)) {
      toast.error("Ingresa una URL válida (http/https).");
      return;
    }
    setPhotoDraft((p) => ({
      ...p,
      addUrls: [...p.addUrls, url],
      urlInput: "",
    }));
  };

  const toggleRemovePhoto = (id: number) => {
    setPhotoDraft((p) => {
      const next = new Set(p.removeIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...p, removeIds: next };
    });
  };

  // ---------- RENDER ----------
  if (loading) return <SkeletonView />;

  if (!data) {
    return (
      <ErrorView
        kind={errorKind}
        onRetry={() => {
          setRefreshing(true);
          fetchOne();
        }}
        onBack={() => router.back()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 animate-in fade-in duration-500">
      {/* HEADER STICKY */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold text-foreground truncate max-w-[220px] sm:max-w-[420px]">
                {data.itinerario?.title || "Publicación"}
              </span>
              <PrivacyBadge privacity_mode={data.privacity_mode} />
            </div>
            <span className="text-[10px] text-muted-foreground hidden md:block truncate">
              Por @{data.user_shared.username} · {publishedLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => {
              const url = window.location.href;
              if (navigator.share) {
                navigator
                  .share({
                    title: data.itinerario?.title ?? "Publicación",
                    url,
                  })
                  .catch(() => {});
              } else {
                navigator.clipboard?.writeText(url);
                toast.success("Enlace copiado");
              }
            }}
          >
            <Share2 className="h-5 w-5" />
          </Button>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" /> Editar publicación
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* HERO */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-black text-foreground leading-tight tracking-tight">
                {data.itinerario?.title || "Sin título"}
              </h1>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={data.user_shared.foto_url || undefined} />
                    <AvatarFallback>
                      {data.user_shared.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    className="hover:text-foreground transition-colors"
                    onClick={() =>
                      router.push(
                        `/viajero/perfil/${data.user_shared.username}`
                      )
                    }
                    type="button"
                  >
                    <span className="font-semibold text-foreground/90">
                      @{data.user_shared.username}
                    </span>
                  </button>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> {publishedLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-bold">{avg.toFixed(1)}</span>
                <span className="text-xs opacity-80">({count})</span>
              </div>

              {itineraryHref && (
                <Button
                  className="rounded-full h-10 px-4"
                  onClick={() => router.push(itineraryHref)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  ver itinerario
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/40">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-4 w-4" />
              comparte, opina y guarda rutas
            </div>

            <Button
              variant="secondary"
              className="rounded-full"
              disabled={refreshing}
              onClick={() => {
                setRefreshing(true);
                fetchOne();
              }}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              actualizar
            </Button>
          </div>
        </div>

        {/* PHOTOS */}
        <PhotoGrid fotos={data.fotos} onOpen={openPhoto} />

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-2">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-10">
            {/* Descripción */}
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Sobre este viaje
                </h3>

                {canManage && (
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    editar
                  </Button>
                )}
              </div>

              <div className="rounded-2xl border border-border/50 bg-muted/10 p-5">
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {data.descripcion?.trim()
                    ? data.descripcion
                    : "El autor no ha añadido una descripción detallada."}
                </p>
              </div>
            </section>

            {/* RESUMEN DÍAS/LUGARES (NUEVO) */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Route className="h-5 w-5 text-primary" /> Resumen del itinerario
              </h3>

              <ItinerarySummaryPanel
                summary={itSummary}
                loading={loadingItSummary}
                onOpenItinerary={
                  itineraryHref ? () => router.push(itineraryHref) : undefined
                }
              />
            </section>

            <Separator />

            {/* Reseñas + comentario */}
            <section className="space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Reseñas
                  <span className="text-muted-foreground font-normal text-base">
                    ({count})
                  </span>
                </h3>

                <Button
                  variant="secondary"
                  className="rounded-full"
                  onClick={reloadResenas}
                  disabled={loadingResenas}
                >
                  {loadingResenas ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  actualizar
                </Button>
              </div>

              {/* Form reseña */}
              <Card className="rounded-3xl border-border/60 shadow-sm">
                <CardContent className="p-5 space-y-4">
                  {!currentUser ? (
                    <div className="rounded-2xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                      Inicia sesión para dejar una reseña y comentario.
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={(currentUser as any)?.foto_url || undefined}
                            />
                            <AvatarFallback>
                              {currentUser.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                              @{currentUser.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {myResena && !editingResena
                                ? "Ya dejaste una reseña"
                                : "Califica y comenta"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <RatingStars
                            rating={reviewForm.watch("score") || 0}
                            onRate={(v) =>
                              reviewForm.setValue("score", v, {
                                shouldValidate: true,
                              })
                            }
                            interactive
                            size="lg"
                          />

                          {myResena && !editingResena ? (
                            <>
                              <Button
                                variant="outline"
                                className="rounded-full"
                                onClick={() => setEditingResena(true)}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                editar
                              </Button>
                              <Button
                                variant="ghost"
                                className="rounded-full text-destructive hover:bg-destructive/10"
                                onClick={() => confirmDeleteResena(myResena.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                borrar
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>

                      {/* Textarea */}
                      {(!myResena || editingResena) && (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="¿Qué te pareció este itinerario?"
                            className="min-h-[110px] rounded-2xl"
                            {...reviewForm.register("commentario")}
                          />

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {reviewForm.formState.errors.commentario
                                ?.message ?? " "}
                            </span>
                            <span>
                              {reviewForm.watch("commentario")?.length ?? 0}/280
                            </span>
                          </div>

                          <div className="flex justify-end gap-2">
                            {myResena && editingResena ? (
                              <Button
                                variant="secondary"
                                className="rounded-full"
                                onClick={() => {
                                  setEditingResena(false);
                                  reviewForm.reset({
                                    score: myResena.score as any,
                                    commentario: myResena.commentario ?? "",
                                  });
                                }}
                                disabled={submittingResena}
                                type="button"
                              >
                                cancelar
                              </Button>
                            ) : null}

                            <Button
                              className="rounded-full"
                              disabled={
                                submittingResena ||
                                !reviewForm.formState.isValid
                              }
                              onClick={submitResena}
                              type="button"
                            >
                              {submittingResena ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4 mr-2" />
                              )}
                              {myResena ? "guardar" : "publicar"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Lista reseñas */}
              <div className="space-y-3">
                {!resenas?.length ? (
                  <div className="text-center py-10 border-2 border-dashed border-muted rounded-2xl">
                    <p className="text-muted-foreground">
                      Sé el primero en opinar.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[520px] pr-3">
                    <div className="space-y-3">
                      {resenas.map((r) => (
                        <div
                          key={r.id}
                          className={cn(
                            "p-5 rounded-2xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors",
                            myResena?.id === r.id
                              ? "ring-1 ring-primary/20"
                              : ""
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-9 w-9">
                                <AvatarImage
                                  src={r.usuario.foto_url || undefined}
                                />
                                <AvatarFallback>
                                  {r.usuario.username?.[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">
                                  {r.usuario.nombre_completo ??
                                    r.usuario.username}{" "}
                                  <span className="text-muted-foreground font-normal">
                                    @{r.usuario.username}
                                  </span>
                                </p>
                                <div className="mt-1">
                                  <RatingStars rating={Number(r.score) || 0} />
                                </div>
                              </div>
                            </div>

                            <Badge variant="secondary" className="shrink-0">
                              {Number(r.score) || 0}/5
                            </Badge>
                          </div>

                          {r.commentario?.trim() ? (
                            <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
                              {r.commentario}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-1 space-y-6">
            {/* Autor */}
            <Card className="rounded-3xl border-border/60 shadow-sm overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-90" />
              <CardContent className="px-6 pb-6 pt-0 relative">
                <div className="flex justify-center -mt-12 mb-4">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={data.user_shared.foto_url || undefined} />
                    <AvatarFallback className="text-2xl bg-muted">
                      {data.user_shared.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="text-center space-y-1 mb-6">
                  <h3 className="font-bold text-lg">
                    {data.user_shared.nombre_completo ||
                      data.user_shared.username}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    @{data.user_shared.username}
                  </p>
                </div>

                <Button
                  className="w-full rounded-xl h-11 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                  size="lg"
                  onClick={() =>
                    router.push(`/viajero/perfil/${data.user_shared.username}`)
                  }
                >
                  Ver Perfil
                </Button>
              </CardContent>
            </Card>

            {/* Mini resumen en sidebar */}
            <Card className="rounded-3xl border-border/60 shadow-sm p-6 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Resumen rápido
              </h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full">
                  {itSummary?.days?.length ?? 0} días
                </Badge>
                <Badge variant="secondary" className="rounded-full">
                  {itSummary?.totalPlaces ?? 0} paradas
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  <Star className="h-3.5 w-3.5 mr-2 fill-amber-400 text-amber-400" />
                  {avg.toFixed(1)} ({count})
                </Badge>
              </div>
            </Card>

            {/* Itinerario */}
            <Card className="rounded-3xl border-border/60 shadow-sm p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Itinerario Asociado
              </h4>

              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/40">
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <Map className="h-5 w-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="font-semibold text-sm truncate">
                    {data.itinerario?.title ?? "Sin itinerario"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ver mapa y detalles
                  </p>
                </div>
              </div>

              {itineraryHref ? (
                <Button
                  className="w-full rounded-xl h-11"
                  variant="outline"
                  onClick={() => router.push(itineraryHref)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Explorar itinerario
                </Button>
              ) : (
                <Button disabled className="w-full" variant="secondary">
                  No disponible
                </Button>
              )}
            </Card>

            {/* Reportar */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
              >
                <ShieldAlert className="h-3 w-3 mr-1.5" /> Reportar publicación
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* VIEWER DE FOTOS */}
      <PhotoViewerDialog
        open={photoOpen}
        onOpenChange={setPhotoOpen}
        fotos={data.fotos}
        initialIndex={photoIndex}
      />

      {/* EDITAR (DETALLES + FOTOS) */}
      <Dialog open={editOpen} onOpenChange={(v) => !saving && setEditOpen(v)}>
        <DialogContent className="sm:max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Editar publicación</DialogTitle>
            <DialogDescription>
              Puedes editar descripción, privacidad y fotos (si el backend lo
              soporta).
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="detalles" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="detalles">Detalles</TabsTrigger>
              <TabsTrigger value="fotos">Fotos</TabsTrigger>
            </TabsList>

            <TabsContent value="detalles" className="mt-4">
              <form
                onSubmit={editForm.handleSubmit(onSaveDetails)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descripción</label>
                  <Textarea
                    {...editForm.register("descripcion")}
                    className="resize-none h-32 rounded-xl"
                    placeholder="Cuenta un poco sobre este viaje..."
                  />
                  <div className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>
                      {editForm.formState.errors.descripcion?.message ?? " "}
                    </span>
                    <span>
                      {editForm.watch("descripcion")?.length ?? 0}/600
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Privacidad</label>
                  <Select
                    value={
                      editForm.watch("privacity_mode") ? "private" : "public"
                    }
                    onValueChange={(v) =>
                      editForm.setValue("privacity_mode", v === "private", {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        Público (Todos pueden ver)
                      </SelectItem>
                      <SelectItem value="private">
                        Privado (Más restringido)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditOpen(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving || !editForm.formState.isValid}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Pencil className="h-4 w-4 mr-2" />
                    )}
                    Guardar
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent value="fotos" className="mt-4 space-y-4">
              <div className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" /> Fotos actuales
                </p>

                {!data.fotos?.length ? (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    No hay fotos aún.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {data.fotos.map((f) => {
                      const marked = photoDraft.removeIds.has(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => toggleRemovePhoto(f.id)}
                          className={cn(
                            "relative aspect-[4/3] rounded-xl overflow-hidden border transition-all",
                            marked
                              ? "border-destructive ring-2 ring-destructive/20 opacity-75"
                              : "border-border/50 hover:border-primary/40"
                          )}
                          title={
                            marked ? "Se eliminará" : "Marcar para eliminar"
                          }
                        >
                          <Image
                            src={f.foto_url}
                            alt="foto"
                            fill
                            className="object-cover"
                          />
                          {marked && (
                            <div className="absolute inset-0 bg-destructive/25 flex items-center justify-center">
                              <span className="text-xs font-semibold text-white bg-black/40 px-2 py-1 rounded-full">
                                eliminar
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                <Separator className="my-2" />

                <p className="text-sm font-semibold flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Agregar foto por URL
                </p>

                <div className="flex gap-2">
                  <Input
                    placeholder="https://..."
                    value={photoDraft.urlInput}
                    onChange={(e) =>
                      setPhotoDraft((p) => ({ ...p, urlInput: e.target.value }))
                    }
                    className="rounded-xl"
                  />
                  <Button
                    type="button"
                    className="rounded-xl"
                    onClick={onAddPhotoUrl}
                  >
                    agregar
                  </Button>
                </div>

                {photoDraft.addUrls.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Se agregarán:
                    </p>
                    <div className="space-y-2">
                      {photoDraft.addUrls.map((u, i) => (
                        <div
                          key={`${u}-${i}`}
                          className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-background px-3 py-2"
                        >
                          <span className="text-xs truncate">{u}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            onClick={() =>
                              setPhotoDraft((p) => ({
                                ...p,
                                addUrls: p.addUrls.filter((_, idx) => idx !== i),
                              }))
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  disabled={saving}
                  onClick={() => onSaveDetails(editForm.getValues())}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Pencil className="h-4 w-4 mr-2" />
                  )}
                  Guardar cambios
                </Button>
              </DialogFooter>

              <p className="text-xs text-muted-foreground">
                * Si tu backend no soporta actualización de fotos, verás un
                aviso y no fallará la app.
              </p>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* BORRAR PUBLICACIÓN */}
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(v) => !deleting && setDeleteOpen(v)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              ¿Eliminar publicación?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. Se eliminará la publicación y su
              contenido asociado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeletePublication}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 rounded-xl"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* BORRAR RESEÑA */}
      <AlertDialog
        open={deleteResenaOpen}
        onOpenChange={(v) => !submittingResena && setDeleteResenaOpen(v)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              ¿Eliminar tu reseña?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se borrará tu calificación y comentario de esta publicación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={submittingResena}
              className="rounded-xl"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteResena}
              disabled={submittingResena}
              className="bg-destructive hover:bg-destructive/90 rounded-xl"
            >
              {submittingResena ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
