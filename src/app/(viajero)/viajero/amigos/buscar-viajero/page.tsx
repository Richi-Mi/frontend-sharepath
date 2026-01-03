"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  UserPlus,
  Users,
  Sparkles,
  UserCheck,
  Loader2,
  MapPin,
  ChevronRight,
  X, // <--- Importamos el icono X para cancelar
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";

// ===== Tipos =====

interface ViajeroData {
  id: number;
  nombre_completo: string;
  username: string;
  foto_url: string | null;
  amigos_en_comun: number;
  ciudad?: string;
  status?: number; // 0: pendiente/enviada, 1: desconocido, 2: amigo
}

interface FriendSuggestionApi {
  username: string;
  nombre_completo: string;
  correo?: string;
  foto_url?: string | null;
}

const api = ItinerariosAPI.getInstance();

async function sendFriendRequest(receiving: string) {
  return await api.sendFriendRequest(receiving);
}

async function cancelFriendRequest(receiving: string) {
  return await api.cancelFriendRequest(receiving);
}

// ===== Componentes Internos =====

function ViajeroCard({
  data,
  onSent,
}: {
  data: ViajeroData;
  onSent?: (username: string) => void;
}) {
  const [status, setStatus] = useState<number | undefined>(data.status);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setStatus(data.status);
  }, [data.status]);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Si ya es amigo (2) o está cargando, no hacemos nada.
    if (isSending || status === 2) return;

    // LÓGICA PARA CANCELAR (Status 0)
  if (status === 0) {
  try {
    setIsSending(true);

    console.log("Cancelando solicitud a:", data.username);

    await cancelFriendRequest(data.username);

    toast.success("Solicitud cancelada");

    setStatus(undefined); // vuelve a "Agregar"

  } catch (error) {
    console.error("No se pudo cancelar la solicitud:", error);
    toast.error("No se pudo cancelar la solicitud");
  } finally {
    setIsSending(false);
  }
  return;
}

    // LÓGICA PARA ENVIAR (Status != 0 y != 2)
    try {
      setIsSending(true);
      console.log("Enviando solicitud a:", data.username);

      const response = await sendFriendRequest(data.username);

      toast.success("Solicitud enviada correctamente");
      console.log("Respuesta del backend:", response);

      setStatus(0); // Actualizar visualmente a "Enviada/Cancelar"

      if (onSent) onSent(data.username);
    } catch (error) {
      console.error("No se pudo enviar la solicitud:", error);
      toast.error("No se pudo enviar la solicitud");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Link href={`/viajero/perfil/${data.username}`} className="block group">
      <Card className="overflow-hidden border-border/50 transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:bg-muted/20">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4 overflow-hidden">
            {/* Avatar */}
            <Avatar className="h-14 w-14 border-2 border-background shadow-sm transition-transform group-hover:scale-105">
              <AvatarImage
                src={data.foto_url || undefined}
                alt={data.nombre_completo}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                {getInitials(data.nombre_completo)}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-base leading-none truncate group-hover:text-primary transition-colors">
                  {data.nombre_completo}
                </h4>
                <Badge
                  variant="secondary"
                  className="text-[10px] font-normal text-muted-foreground h-5 px-1.5"
                >
                  @{data.username}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {data.ciudad && (
                  <span className="flex items-center gap-1 shrink-0">
                    <MapPin className="h-3 w-3" /> {data.ciudad}
                  </span>
                )}
                <span className="flex items-center gap-1 shrink-0">
                  <Users className="h-3 w-3" /> {data.amigos_en_comun || 0} en
                  común
                </span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3 pl-2">
            <Button
              size="sm"
              variant={status === 2 ? "secondary" : status === 0 ? "ghost" : "default"}
              className={`h-8 px-3 text-xs font-medium transition-all duration-200 ${
                status === 2
                  ? "text-muted-foreground bg-muted opacity-50 cursor-not-allowed" // Estilo Amigos
                  : status === 0
                  ? "bg-muted text-muted-foreground hover:bg-red-600 hover:text-white" // <--- ESTILO CANCELAR (Gris -> Rojo)
                  : "shadow-sm" // Estilo Agregar
              }`}
              onClick={handleAdd}
              // IMPORTANTE: Quitamos "status === 0" del disabled para permitir el hover y el click
              disabled={status === 2 || isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Enviando
                </>
              ) : status === 2 ? (
                <>
                  <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Amigo
                </>
              ) : status === 0 ? (
                // --- NUEVO ESTADO: CANCELAR ---
                <>
                  <X className="mr-1.5 h-3.5 w-3.5" /> Cancelar
                </>
              ) : (
                <>
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Agregar
                </>
              )}
            </Button>

            <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SugerenciaCard({
  nombre,
  username,
  status,
  amigosComun = 12,
  foto_url,
  onConnect,
}: {
  nombre: string;
  username?: string;
  status: "Agregar" | "Solicitud enviada";
  amigosComun?: number;
  foto_url?: string;
  onConnect?: (username?: string) => void | Promise<void>;
}) {
  const safeUsername = username || nombre.toLowerCase().replace(/\s+/g, "");

  return (
    <Card className="w-[160px] shrink-0 overflow-hidden transition-all hover:border-primary/40 hover:shadow-md group relative">
      <Link
        href={`/viajero/perfil/${safeUsername}`}
        className="absolute inset-0 z-0"
      />

      <CardContent className="relative z-10 flex flex-col items-center gap-3 p-4 text-center">
        <Avatar className="h-16 w-16 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
          {foto_url && <AvatarImage src={foto_url} />}
          <AvatarFallback className="bg-muted text-muted-foreground text-lg font-medium">
            {getInitials(nombre)}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1 w-full">
          <p
            className="text-sm font-semibold leading-none truncate w-full group-hover:text-primary transition-colors"
            title={nombre}
          >
            {nombre}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {amigosComun} amigos en común
          </p>
        </div>

        <Button
          className="w-full h-8 text-xs z-20"
          variant={status === "Solicitud enviada" ? "secondary" : "outline"}
          disabled={status === "Solicitud enviada"}
          onClick={(e) => {
            e.preventDefault();
            if (onConnect) onConnect(username);
          }}
        >
          {status === "Solicitud enviada" ? "Pendiente" : "Agregar"}
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptySearchState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/5 to-primary/10 mb-6">
        <Search className="h-10 w-10 text-primary/60" />
      </div>
      <h3 className="text-xl font-bold text-foreground">
        Encuentra compañeros de viaje
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mt-2 mb-8 leading-relaxed">
        Busca por nombre de usuario o nombre completo para conectar, ver sus
        perfiles y planear juntos.
      </p>
    </div>
  );
}

function NoResultsState({ term }: { term: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
        <Users className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <p className="text-base font-medium text-foreground">
        No encontramos a nadie
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        No hay resultados para{" "}
        <span className="font-semibold text-foreground">"{term}"</span>.
      </p>
    </div>
  );
}

// ===== Página Principal =====

export default function BuscarViajeroPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viajeros, setViajeros] = useState<ViajeroData[]>([]);
  const [sugerenciasApi, setSugerenciasApi] = useState<FriendSuggestionApi[]>(
    []
  );
  const [pendingSugerencias, setPendingSugerencias] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Función para buscar viajeros
  const handleSearch = async (term: string) => {
    if (term.trim() === "") {
      setViajeros([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const myUserJson = localStorage.getItem("user");
      const myUsername = myUserJson ? JSON.parse(myUserJson).username : null;

      const [searchResp, friendsResp, requestsResp] = await Promise.all([
        api.searchUsers(term).catch(() => []),
        api.getFriends().catch(() => []),
        api.getRequests().catch(() => []),
      ]);

      let users: any[] = [];
      if (Array.isArray((searchResp as any).users))
        users = (searchResp as any).users;
      else if (Array.isArray((searchResp as any).data))
        users = (searchResp as any).data;
      else if (Array.isArray(searchResp)) users = searchResp as any[];

      const userStatus = new Map<string, number>();

      const friendsList = Array.isArray(friendsResp) ? friendsResp : [];
      friendsList.forEach((f: any) => {
        const friendUsername =
          f.requesting_user?.username === myUsername
            ? f.receiving_user?.username
            : f.requesting_user?.username;

        if (friendUsername) {
          userStatus.set(friendUsername, 2);
        }
      });

      const requestsData =
        requestsResp && (requestsResp as any).data
          ? (requestsResp as any).data
          : [];

      requestsData.forEach((req: any) => {
        const sender = req.requesting_user?.username;
        const receiver = req.receiving_user?.username;

        if (sender === myUsername && receiver) {
          userStatus.set(receiver, 0);
        }

        if (receiver === myUsername && sender) {
          userStatus.set(sender, 0);
        }
      });

      const mapped: ViajeroData[] = users
        .map((u: any, idx: number) => ({
          id: u.id ?? idx,
          nombre_completo: u.nombre_completo || u.nombre || u.username,
          username: u.username,
          foto_url: u.foto_url || null,
          amigos_en_comun: u.amigos_en_comun || 0,
          ciudad: u.ciudad,
          status: userStatus.get(u.username) ?? 1,
        }))
        .filter((v) => v.username !== myUsername);

      setViajeros(mapped);
    } catch (error) {
      console.error("Error en búsqueda:", error);
      setViajeros([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchTerm) handleSearch(searchTerm);
      else {
        setViajeros([]);
        setHasSearched(false);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getFriendSuggestions();
        const list = Array.isArray(res?.data) ? res.data : [];
        if (!mounted) return;
        setSugerenciasApi(list);
      } catch (err) {
        console.warn("No se pudieron cargar sugerencias:", err);
        if (!mounted) return;
        setSugerenciasApi([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="-ml-2 hover:bg-muted/50 rounded-full"
          >
            <Link href="/viajero/amigos">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="search"
                placeholder="Buscar viajeros por nombre o usuario..."
                className="h-10 w-full bg-muted/50 pl-10 pr-4 border-transparent focus:border-primary/20 focus:bg-background focus:shadow-sm transition-all rounded-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 space-y-8">
        <section>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 animate-in fade-in">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Buscando perfiles...
              </p>
            </div>
          ) : hasSearched ? (
            viajeros.length > 0 ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Resultados
                  </h2>
                  <Badge
                    variant="outline"
                    className="h-5 px-2 text-[10px] font-medium"
                  >
                    {viajeros.length} encontrados
                  </Badge>
                </div>
                <div className="space-y-3">
                  {viajeros.map((viajero) => (
                    <ViajeroCard
                      key={viajero.id}
                      data={viajero}
                      onSent={(username) => {
                        setViajeros((prev) =>
                          prev.map((v) =>
                            v.username === username ? { ...v, status: 0 } : v
                          )
                        );
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <NoResultsState term={searchTerm} />
            )
          ) : (
            <EmptySearchState />
          )}
        </section>

        <Separator className="bg-border/60" />

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="p-1.5 rounded-md bg-amber-500/10">
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <h2 className="text-base font-bold">Sugerencias para ti</h2>
          </div>

          <ScrollArea className="w-full whitespace-nowrap pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-4 py-1">
              {sugerenciasApi.length === 0 ? (
                <div className="flex w-full flex-col items-center justify-center py-6 text-center text-muted-foreground">
                  <div className="mb-2 rounded-full bg-muted p-3">
                    <Users className="h-6 w-6 opacity-50" />
                  </div>
                  <p className="text-sm font-medium">
                    No tienes sugerencias aún
                  </p>
                  <p className="text-xs">
                    Agrega amigos para conectar con más personas.
                  </p>
                </div>
              ) : (
                sugerenciasApi.map((s) => (
                  <SugerenciaCard
                    key={s.username}
                    nombre={s.nombre_completo}
                    username={s.username}
                    foto_url={s.foto_url || undefined}
                    status={
                      pendingSugerencias.has(s.username)
                        ? "Solicitud enviada"
                        : "Agregar"
                    }
                    onConnect={async (u?: string) => {
                      if (!u) return;
                      try {
                        await sendFriendRequest(u);
                        toast.success("Solicitud enviada");
                        setPendingSugerencias((prev) => new Set(prev).add(u));
                      } catch (err) {
                        console.error(
                          "Error enviando solicitud desde sugerencias:",
                          err
                        );
                        toast.error("No se pudo enviar la solicitud");
                      }
                    }}
                  />
                ))
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      </main>
    </div>
  );
}