"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Globe2,
  CalendarDays,
  Loader2,
  Heart,
  Users,
  Compass,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getInitials } from "@/lib/utils";
import { ItinerariosAPI } from "@/api/ItinerariosAPI";

// --- Tipos que vienen (o vendrán) del backend ---

interface ApiUser {
  username: string;
  correo: string;
  foto_url: string;

  // Estos campos son opcionales por si después los agregas en el backend
  bio?: string;
  ciudad?: string;
  pais?: string;
  idiomas?: string[]; // ["Español", "Inglés"]
  intereses?: string[]; // ["Gastronomía", "Museos", "Naturaleza"]
  created_at?: string; // Fecha de registro
  stats?: {
    itinerarios_publicos?: number;
    lugares_visitados?: number;
    amigos?: number;
  };
}

// Estructura interna del perfil
interface TravelerProfile {
  username: string;
  name: string;
  email: string;
  avatar: string | null;
  bio?: string;
  ciudad?: string;
  pais?: string;
  idiomas: string[];
  intereses: string[];
  createdAtLabel?: string;
  stats: {
    itinerarios_publicos: number;
    lugares_visitados: number;
    amigos: number;
  };
}

export default function ViajeroProfilePage() {
  const [profile, setProfile] = useState<TravelerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Usamos la capa de API en lugar de fetch
        const api = ItinerariosAPI.getInstance();
        const data = await api.getUser();

        // Pequeña función para formatear fecha si el backend llega a mandarla
        const formatCreatedAt = (iso?: string) => {
          if (!iso) return undefined;
          const d = new Date(iso);
          if (Number.isNaN(d.getTime())) return undefined;
          return d.toLocaleDateString("es-MX", {
            year: "numeric",
            month: "short",
          });
        };

        setProfile({
          username: data.username,
          name: data.username, // Si después tienes "nombre completo", cámbialo aquí
          email: data.correo,
          avatar: data.foto_url,
          bio: data.bio ?? "Aún no ha escrito una biografía.",
          ciudad: data.ciudad,
          pais: data.pais,
          idiomas: data.idiomas ?? ["Español"],
          intereses: data.intereses ?? ["Exploración urbana", "Gastronomía"],
          createdAtLabel: formatCreatedAt(data.created_at),
          stats: {
            itinerarios_publicos: data.stats?.itinerarios_publicos ?? 0,
            lugares_visitados: data.stats?.lugares_visitados ?? 0,
            amigos: data.stats?.amigos ?? 0,
          },
        });

        setErrorMsg(null);
      } catch (error) {
        console.error("Error cargando perfil de viajero:", error);
        setErrorMsg("No se pudo cargar el perfil del viajero.");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando perfil de viajero...
        </div>
      </div>
    );
  }

  if (!profile || errorMsg) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Perfil no disponible</CardTitle>
            <CardDescription>
              {errorMsg ?? "Ocurrió un problema al cargar el perfil."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Intenta recargar la página o volver más tarde.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 lg:px-0">
      {/* Header del perfil */}
      <Card className="border-none shadow-sm">
        <CardContent className="flex flex-col gap-6 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 rounded-2xl shadow-sm">
              <AvatarImage
                src={profile.avatar || undefined}
                alt={profile.name}
              />
              <AvatarFallback className="rounded-2xl text-lg font-semibold">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold leading-tight">
                  {profile.name}
                </h1>
                <Badge variant="outline" className="text-xs">
                  @{profile.username}
                </Badge>
              </div>
              <p className="max-w-xl text-sm text-muted-foreground">
                {profile.bio}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {(profile.ciudad || profile.pais) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {profile.ciudad && <span>{profile.ciudad}</span>}
                    {profile.ciudad && profile.pais && <span>•</span>}
                    {profile.pais && <span>{profile.pais}</span>}
                  </span>
                )}

                {profile.idiomas.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Globe2 className="h-3 w-3" />
                    {profile.idiomas.join(" · ")}
                  </span>
                )}

                {profile.createdAtLabel && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    Se unió en {profile.createdAtLabel}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Acciones rápidas sobre el perfil */}
          <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
            <Button variant="outline" size="sm">
              Añadir
            </Button>
            <Button variant="outline" size="sm">
              Enviar mensaje
            </Button>
            {/* Si en algún punto tienes tu propia URL pública del perfil */}
            {/* <Button variant="ghost" size="sm">Copiar enlace</Button> */}
          </div>
        </CardContent>
      </Card>

      {/* Stats principales */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
        <StatCard
          label="Itinerarios públicos"
          value={profile.stats.itinerarios_publicos}
          icon={Compass}
        />
        <StatCard
          label="Lugares visitados"
          value={profile.stats.lugares_visitados}
          icon={MapPin}
        />
        <StatCard label="Amigos" value={profile.stats.amigos} icon={Users} />
      </div>

      {/* Intereses del viajero */}
      {profile.intereses.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Intereses de viaje
            </CardTitle>
            <CardDescription className="text-xs">
              Temas y estilos de viaje que le gustan a este viajero.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {profile.intereses.map((tag) => (
              <Badge
                key={tag}
                variant="default"
                className="rounded-full text-xs"
              >
                {tag}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tabs de contenido: Itinerarios, favoritos, reseñas */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Actividad pública
          </CardTitle>
          <CardDescription className="text-xs">
            Itinerarios y actividad que otros viajeros pueden ver.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="itinerarios" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="itinerarios">
                Itinerarios públicos
              </TabsTrigger>
              <TabsTrigger value="favoritos">Lugares favoritos</TabsTrigger>
              <TabsTrigger value="reseñas">Reseñas</TabsTrigger>
            </TabsList>

            {/* TODO: Conectar con tu endpoint real de itinerarios del viajero */}
            <TabsContent value="itinerarios" className="space-y-3">
              {profile.stats.itinerarios_publicos === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este viajero aún no ha publicado itinerarios.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {/* Ejemplo de tarjeta de itinerario; reemplaza con datos reales cuando tengas el endpoint */}
                  <ItineraryCard
                    title="CDMX en 3 días: comida, historia y miradores"
                    days={3}
                    placesCount={12}
                    likes={48}
                    updatedAt="Hace 2 semanas"
                    coverLabel="Ejemplo"
                  />
                  <ItineraryCard
                    title="Ruta por Puebla y Cholula"
                    days={2}
                    placesCount={8}
                    likes={23}
                    updatedAt="Hace 1 mes"
                    coverLabel="Ejemplo"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="favoritos" className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Aquí se mostrarán los lugares marcados como favoritos por este
                viajero (restaurantes, miradores, museos, etc.).
              </p>
              {/* TODO: Conectar con tu endpoint de lugares favoritos cuando lo tengas */}
            </TabsContent>

            <TabsContent value="reseñas" className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Aquí se mostrarán reseñas y comentarios que este viajero haya
                dejado en itinerarios y lugares.
              </p>
              {/* TODO: Conectar con tu endpoint de reseñas/ratings cuando lo tengas */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Componentes auxiliares ---

type StatCardProps = {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
};

function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <Card className="border bg-card/60 shadow-sm">
      <CardContent className="flex items-center gap-3 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-sm font-semibold">{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}

type ItineraryCardProps = {
  title: string;
  days: number;
  placesCount: number;
  likes: number;
  updatedAt: string;
  coverLabel?: string;
};

function ItineraryCard({
  title,
  days,
  placesCount,
  likes,
  updatedAt,
  coverLabel,
}: ItineraryCardProps) {
  return (
    <Card className="group cursor-pointer overflow-hidden border bg-card/70 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-24 w-full bg-gradient-to-tr from-blue-500/50 to-purple-500/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent)]" />
        {coverLabel && (
          <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
            {coverLabel}
          </span>
        )}
      </div>
      <CardContent className="space-y-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold">{title}</h3>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span>
            {days} día{days !== 1 && "s"}
          </span>
          <span>•</span>
          <span>{placesCount} lugares</span>
          <span>•</span>
          <span>{likes} me gusta</span>
        </div>
        <p className="text-[11px] text-muted-foreground/80">
          Actualizado {updatedAt}
        </p>
      </CardContent>
    </Card>
  );
}
