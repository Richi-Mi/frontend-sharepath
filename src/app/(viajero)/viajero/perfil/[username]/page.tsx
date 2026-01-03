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

  const api = ItinerariosAPI.getInstance();

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
      {/* --- ENCABEZADO SUPERIOR (Navegación + Fondo decorativo) --- */}
      <div className="relative h-48 w-full bg-gradient-to-b from-primary to-white dark:from-slate-900 dark:to-background overflow-hidden">
        {/* Usamos la foto del usuario como textura de fondo muy sutil */}
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

      {/* --- BLOQUE DE IDENTIDAD (Tarjeta flotante) --- */}
      <div className="max-w-3xl mx-auto px-4 -mt-24 relative z-20">
        <Card className="flex flex-col items-center p-6 md:p-8 shadow-xl border-border/50 bg-background/95 backdrop-blur-sm rounded-3xl">
          {/* 1. Avatar Central */}
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

          {/* 2. Información del Usuario (Nombre y User) */}
          <div className="text-center space-y-1 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              {profile.nombre_completo}
            </h1>
            <p className="text-base font-medium text-muted-foreground">
              @{profile.username}
            </p>
          </div>

          {/* 3. ESTADÍSTICAS (Lo que pediste mantener visible) */}
          {/* Diseño limpio con divisores verticales */}
          <div className="grid grid-cols-3 gap-8 md:gap-16 w-full max-w-md border-t border-b border-border/40 py-4 mb-2">
            <StatItem
              count={profile.publicaciones.length}
              label="Itinerarios"
              icon={MapIcon}
            />
            <StatItem count={friendsCount} label="Amigos" icon={Users} />
            <StatItem count={0} label="Lugares" icon={MapPin} />
          </div>

          {/* Botón de Mensaje (Única acción solicitada) */}
          <div className="mt-6 w-full max-w-xs">
            <Button
              className="w-full rounded-full font-semibold shadow-sm"
              size="lg"
            >
              Mensaje
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
                            {/* Overlay sutil al hover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          </>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <MapIcon className="h-8 w-8 opacity-20" />
                          </div>
                        )}
                      </div>
                      {/* Título del itinerario (Si hubiera) o ID visual para referencia */}
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

// --- Componentes Pequeños para mantener limpio el código ---

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
