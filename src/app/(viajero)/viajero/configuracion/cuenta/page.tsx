"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Globe,
  Lock,
  Pencil,
  Mail,
  Map,
  Users,
  ShieldCheck,
  Calendar,
  MoreVertical,
  Trash2,
  Star,
  Image as ImageIcon,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import type {
  Usuario,
  Publicacion,
  UpdatePublicationRequest,
  AverageRatingResponse,
} from "@/api/interfaces/ApiRoutes";
import { cn } from "@/lib/utils";

import type { Publicacione } from "@/api/interfaces/ApiRoutes";

// ✅ Ajusta si tu ruta real es distinta
const PUBLICACION_VIEW_ROUTE = (id: number) => `/viajero/publicaciones/${id}`;

function clampText(s: string, max = 160) {
  const t = (s ?? "").trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return t.slice(0, max).trimEnd() + "…";
}

function PrivacyPill({ isPublic }: { isPublic: boolean }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border",
        isPublic
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
          : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
      )}
    >
      {isPublic ? (
        <Globe className="h-3.5 w-3.5" />
      ) : (
        <Lock className="h-3.5 w-3.5" />
      )}
      {isPublic ? "Público" : "Privado"}
    </Badge>
  );
}

export default function AccountPage() {
  const api = ItinerariosAPI.getInstance();
  const router = useRouter();

  const [user, setUser] = useState<Usuario | null>(null);

  const [pubs, setPubs] = useState<Publicacion[]>([]);
  const [pubsLoading, setPubsLoading] = useState(true);
  const [pubsRefreshing, setPubsRefreshing] = useState(false);

  // rating cache (opcional)
  const [ratings, setRatings] = useState<Record<number, AverageRatingResponse>>(
    {}
  );

  // modal editar
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editingPub, setEditingPub] = useState<Publicacion | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editPrivacy, setEditPrivacy] = useState<"public" | "private">(
    "public"
  );

  // eliminar
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingPub, setDeletingPub] = useState<Publicacion | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .getUser()
      .then((u) => mounted && setUser(u))
      .catch((e) => {
        console.error(e);
        toast.error("No se pudo cargar tu cuenta.");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const roleStyles =
    user?.role === "admin"
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200/50"
      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200/50";

  const mapProfilePubToPublicacion = (p: Publicacione): Publicacion => ({
    id: p.id,
    descripcion: p.descripcion,
    privacity_mode: p.privacity_mode,
    itinerario: p.itinerario
      ? { id: p.itinerario.id, nombre: p.itinerario.nombre }
      : null,
    fotos: (p.fotos ?? []).map((f) => ({ id: f.id, foto_url: f.foto_url })),
  });

  const fetchMyPublications = async (opts?: { refresh?: boolean }) => {
    if (!user) return;

    if (opts?.refresh) setPubsRefreshing(true);
    setPubsLoading((prev) => (opts?.refresh ? prev : true));

    try {
      // ✅ SOLO publicaciones de ESTA cuenta
      const info = await api.getOtherUserInfo(user.username);

      const onlyMine = (info.publicaciones ?? []).map(
        mapProfilePubToPublicacion
      );
      setPubs(onlyMine);
    } catch (e) {
      console.error(e);
      toast.error("No se pudieron cargar tus publicaciones.");
      setPubs([]);
    } finally {
      setPubsLoading(false);
      setPubsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchMyPublications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const openEdit = (p: Publicacion) => {
    setEditingPub(p);
    setEditDesc(p.descripcion ?? "");
    setEditPrivacy(p.privacity_mode ? "public" : "private");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editingPub) return;

    const payload: UpdatePublicationRequest = {
      descripcion: editDesc.trim(),
      privacity_mode: editPrivacy === "public",
    };

    setEditSaving(true);
    try {
      const updated = await api.updatePublication(editingPub.id, payload);
      toast.success("Publicación actualizada");

      setPubs((prev) =>
        prev.map((x) => (x.id === editingPub.id ? { ...x, ...updated } : x))
      );

      setEditOpen(false);
      setEditingPub(null);
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudo actualizar", { description: e?.message ?? "" });
    } finally {
      setEditSaving(false);
    }
  };

  const openDelete = (p: Publicacion) => {
    setDeletingPub(p);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingPub) return;

    setDeleteLoading(true);
    try {
      await api.deletePublication(deletingPub.id);
      toast.success("Publicación eliminada");

      setPubs((prev) => prev.filter((x) => x.id !== deletingPub.id));

      setDeleteOpen(false);
      setDeletingPub(null);
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudo eliminar", { description: e?.message ?? "" });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!user) return <ProfileSkeleton />;

  return (
    <div className="min-h-screen w-full bg-background pb-20">
      {/* HERO */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-32">
        {/* PERFIL */}
        <div className="bg-card/80 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* AVATAR + ACCIONES */}
            <div className="flex flex-col items-center gap-5 shrink-0">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-blue-500 rounded-full opacity-60 blur-md group-hover:opacity-80 transition duration-500" />
                <Avatar className="h-36 w-36 md:h-44 md:w-44 border-[6px] border-background relative shadow-xl">
                  <AvatarImage
                    src={`${user.foto_url ?? ""}`}
                    alt={user.username}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-5xl font-black bg-muted text-muted-foreground/50">
                    {user.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute bottom-2 right-2 h-6 w-6 bg-emerald-500 border-4 border-background rounded-full"
                  title="Activo"
                />
              </div>

              <div className="w-full space-y-3">
                <Link
                  href="/viajero/configuracion/cuenta/editar"
                  className="w-full block"
                >
                  <Button className="w-full rounded-full gap-2 font-semibold shadow-lg shadow-primary/20 hover:scale-105 transition-transform h-11">
                    <Pencil className="h-4 w-4" />
                    Editar Perfil
                  </Button>
                </Link>
              </div>
            </div>

            {/* INFO */}
            <div className="flex-1 w-full space-y-8 text-center md:text-left pt-2">
              <div className="space-y-3">
                <div className="flex flex-col md:flex-row items-center md:items-baseline gap-3 justify-center md:justify-start">
                  <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
                    {user.username}
                  </h1>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "px-3 py-1 text-xs tracking-wider font-bold uppercase border",
                      roleStyles
                    )}
                  >
                    {user.role === "user" ? "Viajero" : user.role}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-medium text-foreground/80">
                    {user.nombre_completo}
                  </h2>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 text-primary/70" />
                    <span className="text-sm font-medium">{user.correo}</span>
                  </div>
                </div>
              </div>

              <Separator className="bg-border/40" />

              {/* STATS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-0 bg-muted/40 hover:bg-muted/60 transition-colors shadow-none">
                  <CardContent className="p-5 flex flex-col items-center md:items-start gap-1">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-2">
                      <Map className="h-6 w-6" />
                    </div>
                    <span className="text-3xl font-bold text-foreground">
                      {user.itineraryCount ?? 0}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Itinerarios
                    </span>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-muted/40 hover:bg-muted/60 transition-colors shadow-none">
                  <CardContent className="p-5 flex flex-col items-center md:items-start gap-1">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-2">
                      <Users className="h-6 w-6" />
                    </div>
                    <span className="text-3xl font-bold text-foreground">
                      {user.friendsCount ?? 0}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Amigos
                    </span>
                  </CardContent>
                </Card>

                <Card
                  className={cn(
                    "border-0 transition-colors shadow-none sm:col-span-2 lg:col-span-1",
                    user.privacity_mode
                      ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                      : "bg-amber-500/5 hover:bg-amber-500/10"
                  )}
                >
                  <CardContent className="p-5 flex flex-col items-center md:items-start gap-2 h-full justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      {user.privacity_mode ? (
                        <Globe className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Lock className="h-5 w-5 text-amber-600" />
                      )}
                      <span
                        className={cn(
                          "text-sm font-bold uppercase tracking-wider",
                          user.privacity_mode
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-amber-700 dark:text-amber-400"
                        )}
                      >
                        {user.privacity_mode ? "Público" : "Privado"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center md:text-left leading-relaxed">
                      {user.privacity_mode
                        ? "Tu perfil es visible para toda la comunidad."
                        : "Solo tus seguidores pueden ver tu actividad."}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-purple-500 to-blue-500 opacity-90" />
        </div>

        {/* MIS PUBLICACIONES */}
        <section className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Mis publicaciones
              </h3>
              <p className="text-sm text-muted-foreground">
                Administra tus publicaciones: edita o elimina cuando lo
                necesites.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {pubs.length} total
              </Badge>

              <Button
                variant="secondary"
                className="rounded-full"
                disabled={pubsRefreshing || pubsLoading}
                onClick={() => fetchMyPublications({ refresh: true })}
              >
                {pubsRefreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                actualizar
              </Button>
            </div>
          </div>

          {pubsLoading ? (
            <PublicationsSkeleton />
          ) : pubs.length === 0 ? (
            <div className="rounded-[2rem] border border-border/50 bg-card/70 backdrop-blur-md p-10 text-center shadow-sm">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                <ImageIcon className="h-7 w-7 text-muted-foreground/60" />
              </div>
              <p className="text-base font-semibold text-foreground">
                Aún no tienes publicaciones
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Cuando compartas un itinerario, aparecerá aquí para
                administrarlo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {pubs.map((p) => {
                const itineraryTitle =
                  p.itinerario?.nombre || p.itinerario?.title || "Itinerario";

                const cover = p.fotos?.[0]?.foto_url ?? null;
                const rating = ratings[p.id]?.averageRating;
                const reviewCount = ratings[p.id]?.reviewCount;

                return (
                  <Card
                    key={p.id}
                    className="group rounded-[2rem] overflow-hidden border border-border/50 bg-card/70 backdrop-blur-md shadow-sm hover:shadow-xl transition-all"
                  >
                    {/* COVER */}
                    <div className="relative h-44 w-full overflow-hidden bg-muted">
                      {cover ? (
                        <Image
                          src={cover}
                          alt="cover"
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="h-10 w-10 text-muted-foreground/25" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0" />

                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <PrivacyPill isPublic={p.privacity_mode} />
                        {typeof rating === "number" ? (
                          <Badge className="rounded-full bg-black/40 text-white border-white/10">
                            <Star className="h-3.5 w-3.5 mr-1 fill-current" />
                            {rating.toFixed(1)}
                            <span className="ml-1 text-white/70">
                              ({reviewCount ?? 0})
                            </span>
                          </Badge>
                        ) : null}
                      </div>

                      <div className="absolute top-4 right-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="rounded-full bg-black/35 text-white border border-white/10 hover:bg-black/45"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align="end"
                            className="w-52 rounded-xl"
                          >
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(PUBLICACION_VIEW_ROUTE(p.id))
                              }
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Abrir
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => openEdit(p)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => openDelete(p)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4">
                        <h4 className="text-white font-extrabold text-lg truncate drop-shadow">
                          {itineraryTitle}
                        </h4>
                        <div className="mt-1 flex items-center gap-2 text-white/80 text-xs">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>ID publicación: {p.id}</span>
                        </div>
                      </div>
                    </div>

                    {/* BODY */}
                    <CardContent className="p-6 space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed min-h-[44px]">
                        {p.descripcion?.trim()
                          ? clampText(p.descripcion, 160)
                          : "Sin descripción. Puedes editar esta publicación para agregar detalles."}
                      </p>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          className="rounded-full w-full"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </Button>

                        <Button
                          variant="ghost"
                          className="rounded-full w-full text-destructive hover:bg-destructive/10"
                          onClick={() => openDelete(p)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* MODAL EDITAR */}
      <Dialog
        open={editOpen}
        onOpenChange={(v) => !editSaving && setEditOpen(v)}
      >
        <DialogContent className="sm:max-w-[620px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Editar publicación</DialogTitle>
            <DialogDescription>
              Ajusta la descripción y la privacidad de tu publicación.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Descripción</label>
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="rounded-2xl min-h-[140px]"
                placeholder="Cuenta un poco sobre esta publicación..."
              />
              <div className="text-xs text-muted-foreground flex justify-end">
                {editDesc?.length ?? 0}/600
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Privacidad</label>
              <Select
                value={editPrivacy}
                onValueChange={(v) => setEditPrivacy(v as "public" | "private")}
              >
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Público</SelectItem>
                  <SelectItem value="private">Privado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              className="rounded-full"
              disabled={editSaving}
              onClick={() => setEditOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-full"
              disabled={editSaving}
              onClick={saveEdit}
            >
              {editSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Pencil className="h-4 w-4 mr-2" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMAR ELIMINAR */}
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(v) => !deleteLoading && setDeleteOpen(v)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              ¿Eliminar publicación?
            </AlertDialogTitle>

            {/* ⚠️ aquí NO meto <p> dentro, para evitar el error de hidratación */}
            <AlertDialogDescription>
              Esta acción es irreversible. Se eliminará la publicación y su
              contenido asociado.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={deleteLoading}>
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction
              className="rounded-xl bg-destructive hover:bg-destructive/90"
              disabled={deleteLoading}
              onClick={confirmDelete}
            >
              {deleteLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------- Skeletons ----------
function PublicationsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-[2rem] overflow-hidden border border-border/50 bg-card/70"
        >
          <Skeleton className="h-44 w-full" />
          <div className="p-6 space-y-3">
            <Skeleton className="h-5 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-5/6 rounded-lg" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-10 w-full rounded-full" />
              <Skeleton className="h-10 w-full rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-80 bg-muted animate-pulse w-full" />
      <div className="max-w-5xl mx-auto px-6 -mt-32">
        <div className="bg-card rounded-[2rem] h-[500px] w-full shadow-xl p-10 flex flex-col md:flex-row gap-10 border border-border/50">
          <div className="flex flex-col items-center gap-6">
            <Skeleton className="h-44 w-44 rounded-full border-4 border-background" />
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
          <div className="flex-1 space-y-6 pt-4">
            <Skeleton className="h-12 w-3/4 rounded-lg" />
            <Skeleton className="h-6 w-1/2 rounded-lg" />
            <div className="grid grid-cols-3 gap-4 mt-8">
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
          </div>
        </div>

        <div className="mt-10">
          <PublicationsSkeleton />
        </div>
      </div>
    </div>
  );
}
