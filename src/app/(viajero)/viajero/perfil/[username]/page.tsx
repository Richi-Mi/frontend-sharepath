"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Heart,
  Star,
  Map as MapIcon,
  Users,
  LayoutGrid,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import { getInitials } from "@/lib/utils";
import { UserInfoResponse } from "@/api/interfaces/ApiRoutes";
import { ListFriend } from "@/api/interfaces/ApiRoutes";
import { Amigo } from "@/api/interfaces/ApiRoutes";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const usernameParam = params.username as string;

  const [profile, setProfile] = useState<UserInfoResponse | null>(null);
  const [friendsCount, setFriendsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null); // estado para toast
  const [toastType, setToastType] = useState<"success" | "error">("success"); // tipo de toast

  const api = ItinerariosAPI.getInstance();

  // Cargar info del usuario
  useEffect(() => {
    setLoading(true);

    const fetchData = async () => {
      try {
        const userJson = localStorage.getItem("user");
        const currentUser = userJson ? JSON.parse(userJson) : null;
        const isOwnProfile = currentUser?.username === usernameParam;

        const [userData, friends] = await Promise.all([
          api.getOtherUserInfo(usernameParam),
          isOwnProfile
            ? api.getFriends().catch(() => [])
            : Promise.resolve(null),
        ]);
        setProfile(userData);

        if (isOwnProfile && Array.isArray(friends)) {
          setFriendsCount(friends.length);
        } else {
          setFriendsCount((userData as any).friendsCount || 0);
        }
      } catch (error) {
        setErrorMsg("Error al cargar el perfil.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [usernameParam]);

  // Cargar cantidad de amigos
  useEffect(() => {
    const loadFriendsCount = async () => {
      try {
        if ("countFriends" in api && profile?.correo) {
          const res = await (api as any).countFriends(profile.correo);
          setFriendsCount(res.data);
        }
      } catch (error) {
        console.warn("Error cargando cantidad de amigos", error);
      }
    };

    if (profile?.correo) {
      loadFriendsCount();
    }
  }, [profile]);

  // Función para mostrar toast temporal
  const showToast = (
    message: string,
    type: "success" | "error" = "success",
    duration = 3000
  ) => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), duration);
  };

  // Enviar solicitud de amistad
  const handleAddFriend = async () => {
    if (!profile?.correo) return;
    setSendingRequest(true);

    try {
      await api.sendFriendRequest(profile.correo);
      showToast("Solicitud de amistad enviada", "success");
    } catch (error) {
      console.error("Error enviando solicitud de amistad", error);
      showToast("Error enviando solicitud de amistad", "error");
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) return <ProfileSkeleton />;

  if (errorMsg || !profile)
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-center p-4">
        <h2 className="text-xl font-semibold">
          {errorMsg || "Usuario no encontrado"}
        </h2>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    );

  return (
    <div className="min-h-screen bg-muted/10 dark:bg-background pb-10">
      {/* --- Toast flotante --- */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white ${
            toastType === "success" ? "bg-green-500" : "bg-red-500"
          } animate-fade-in`}
        >
          {toastMessage}
        </div>
      )}

      {/* --- ENCABEZADO SUPERIOR --- */}
      <div className="relative h-48 w-full bg-gradient-to-b from-primary to-white dark:from-slate-900 dark:to-background overflow-hidden">
        {profile.foto_url && (
          <Image
            src={profile.foto_url}
            alt="bg"
            fill
            className="object-cover opacity-10 blur-2xl scale-125"
          />
        )}

        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full bg-background/50 backdrop-blur-md shadow-sm hover:bg-background"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* --- BLOQUE DE IDENTIDAD --- */}
      <div className="max-w-3xl mx-auto px-4 -mt-24 relative z-20">
        <Card className="flex flex-col items-center p-6 md:p-8 shadow-xl border-border/50 bg-background/95 backdrop-blur-sm rounded-3xl">
          {/* Avatar */}
          <div className="-mt-20 mb-4 p-1.5 bg-background rounded-full shadow-sm ring-1 ring-border/10">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 shadow-inner">
              <AvatarImage
                src={profile.foto_url || undefined}
                className="object-cover"
              />
              <AvatarFallback className="text-4xl bg-muted text-muted-foreground">
                {getInitials(profile.username)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Nombre */}
          <div className="text-center space-y-1 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              {profile.nombre_completo}
            </h1>
            <p className="text-base font-medium text-muted-foreground">
              @{profile.username}
            </p>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-8 md:gap-16 w-full max-w-md border-t border-b border-border/40 py-4 mb-2">
            <StatItem
              count={profile.publicaciones.length}
              label="Publicaciones"
              icon={MapIcon}
            />
            <StatItem count={friendsCount} label="Amigos" icon={Users} />
            <StatItem count={0} label="Lugares" icon={MapPin} />
          </div>

          {/* Botón Añadir amigo */}
          <div className="mt-6 w-full max-w-xs">
            <Button
              className="w-full rounded-full font-semibold shadow-sm"
              size="lg"
              onClick={handleAddFriend}
              disabled={sendingRequest}
            >
              {sendingRequest ? "Enviando..." : "Añadir amigo"}
            </Button>
          </div>
        </Card>
      </div>

      {/* --- CONTENIDO (TABS) --- */}
      <div className="max-w-3xl mx-auto px-4 mt-8">
        <Tabs defaultValue="itinerarios" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-muted/50 p-1 rounded-xl mb-6">
            <TabsTrigger
              value="itinerarios"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <LayoutGrid className="h-4 w-4 mr-2" /> Itinerarios
            </TabsTrigger>
            <TabsTrigger
              value="favoritos"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Heart className="h-4 w-4 mr-2" /> Favoritos
            </TabsTrigger>
            <TabsTrigger
              value="reseñas"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Star className="h-4 w-4 mr-2" /> Reseñas
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="itinerarios"
            className="animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            {profile.publicaciones.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground ml-1">
                  Itinerarios Públicos ({profile.publicaciones.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.publicaciones.map((post) => (
                    <Link
                      key={post.id}
                      href={`/viajero/itinerarios/${post.id}`}
                    >
                      <div className="group relative aspect-video w-full overflow-hidden rounded-xl bg-muted border border-border/50 shadow-sm hover:shadow-md transition-all">
                        {post.fotos.length > 0 ? (
                          <>
                            <Image
                              src={post.fotos[0].foto_url}
                              alt="Cover"
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          </>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <MapIcon className="h-8 w-8 opacity-20" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2 px-1">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          Ver detalles del viaje
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState icon={MapIcon} text="Sin itinerarios publicados" />
            )}
          </TabsContent>

          <TabsContent value="favoritos">
            <EmptyState icon={Heart} text="No hay favoritos visibles" />
          </TabsContent>

          <TabsContent value="reseñas">
            <EmptyState icon={Star} text="Aún no hay reseñas" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// --- Componentes auxiliares ---
function StatItem({
  count,
  label,
  icon: Icon,
}: {
  count: number;
  label: string;
  icon: any;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 group cursor-default">
      <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase font-bold tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-xl md:text-2xl font-bold text-foreground">
        {count}
      </span>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-muted rounded-xl">
      <Icon className="h-10 w-10 text-muted-foreground/50 mb-3" />
      <p className="text-muted-foreground font-medium">{text}</p>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-48 bg-muted animate-pulse" />
      <div className="max-w-3xl mx-auto px-4 -mt-20">
        <div className="bg-background rounded-3xl p-8 shadow-lg flex flex-col items-center space-y-4">
          <Skeleton className="h-32 w-32 rounded-full -mt-20" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-12 pt-4 w-full justify-center">
            <Skeleton className="h-12 w-16" />
            <Skeleton className="h-12 w-16" />
            <Skeleton className="h-12 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
