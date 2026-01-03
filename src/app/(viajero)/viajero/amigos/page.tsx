"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  UserPlus,
  Users,
  UserCheck,
  UserX,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
  UserMinus,
  Ban,
  Unlock,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

// 1. IMPORTAR LA API
import { ItinerariosAPI } from "@/api/ItinerariosAPI";

// 2. INSTANCIAR LA API
const api = ItinerariosAPI.getInstance();

// Estados posibles
enum FriendRequestState {
  PENDING = 0,
  FRIEND = 1,
  REJECTED = 2,
}

// ===== Tipos =====
type Friend = {
  id: string;
  username: string;
  correo: string;
  name: string;
  avatar: string;
  city?: string;
  country?: string;
  mutualCount: number;
  isOnline: boolean;
};

type FriendRequest = {
  id: string | number;
  name: string;
  username: string;
  avatar: string;
  message?: string;
  dateLabel?: string;
  status: number;
};

type FriendSuggestion = {
  id: string;
  username: string;
  name: string;
  avatar: string;
  city?: string;
  country?: string;
  mutualCount: number;
  interests: string[];
};

type BlockedUser = Friend;

// ===== Página Principal =====

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [blocked, setBlocked] = useState<BlockedUser[]>([]); 
  
  const [pendingSuggestions, setPendingSuggestions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // --- ACCIONES DEL USUARIO ---

  const handleRespond = async (id: number, state: number) => {
    try {
      await api.respondFriendRequest(id, state);
      setRequests((prev) => prev.filter((req) => Number(req.id) !== id));

      if (state === FriendRequestState.FRIEND) {
        toast.success("Solicitud aceptada");
        loadFriendsData();
      } else {
        toast.info("Solicitud rechazada");
      }
    } catch (error) {
      console.error(error);
      toast.error("Hubo un error al procesar la solicitud");
    }
  };

  const handleDelete = async (correo: string) => {
    try {
      if ("deleteFriend" in api) {
        await (api as any).deleteFriend(correo);
      } else {
        console.warn("Falta agregar deleteFriend a ItinerariosAPI");
      }
      setFriends((prev) => prev.filter((f) => f.correo !== correo));
      toast.success("Amigo eliminado");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar al amigo");
    }
  };

  const handleBlock = async (friend: Friend) => {
    toast.promise(api.block(friend.username), {
      loading: "Bloqueando usuario...",
      success: () => {  
        setFriends((prev) => prev.filter((f) => f.username !== friend.username));
        setBlocked((prev) => [...prev, friend]);
        return `@${friend.username} ha sido bloqueado`;
      },
      error: () => "Error al bloquear usuario",
    });
  };

  const handleUnblock = async (username: string) => {
    try {
        await (api as any).unblock(username); 
        setBlocked((prev) => prev.filter((b) => b.username !== username));
        toast.success(`@${username} desbloqueado`);
        // Opcional: Recargar sugerencias/amigos
        loadFriendsData();
    } catch (error) {
        console.error(error);
        toast.error("No se pudo desbloquear al usuario");
    }
  };

  const handleConnectSuggestion = async (username: string) => {
    try {
        setPendingSuggestions(prev => new Set(prev).add(username));
        await api.sendFriendRequest(username);
        toast.success(`Solicitud enviada a @${username}`);
    } catch (error) {
        console.error(error);
        toast.error("No se pudo enviar la solicitud");
        setPendingSuggestions(prev => {
            const next = new Set(prev);
            next.delete(username);
            return next;
        });
    }
  };

  // --- FUNCIONES DE CARGA DE DATOS ---

  const loadFriendsData = async () => {
    try {
      const json = await api.getFriends();
      const rawFriends = Array.isArray(json) ? json : [];
      const meJson = localStorage.getItem("user");
      const me = meJson ? JSON.parse(meJson).username : "";

      const mapped: Friend[] = rawFriends.map((f: any) => {
        const user = f.requesting_user?.username !== me ? f.requesting_user : f.receiving_user;
        return {
          id: f.id,
          username: user?.username || "desconocido",
          name: user?.nombre_completo || user?.nombre || user?.username || "Usuario",
          avatar: user?.foto_url || "",
          correo: user?.correo,
          city: user?.ciudad,
          country: user?.pais,
          mutualCount: 0,
          isOnline: false,
        };
      });
      setFriends(mapped);
    } catch (err) {
      console.error("Error cargando amigos:", err);
      setFriends([]);
    }
  };

  const loadRequestsData = async () => {
    try {
      const res = await api.getRequests();
      const json = res as any;
      const rawRequests = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];

      const mappedRequests: FriendRequest[] = rawRequests.map((r: any) => {
        const sender = r.requesting_user || {};
        return {
          id: r.id,
          name: sender.nombre_completo || sender.nombre || "Usuario desconocido",
          username: sender.username || "desconocido",
          avatar: sender.foto_url || "",
          dateLabel: r.fecha_amistad
            ? new Date(r.fecha_amistad).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
            : undefined,
          status: r.status,
          message: undefined,
        };
      });
      setRequests(mappedRequests);
    } catch (error) {
      console.error("Error cargando solicitudes:", error);
      setRequests([]);
    }
  };

 
  const loadBlockedData = async () => {
    try {
        console.log("Desde loadBlockedData")
        if ('listblock' in api) {
            const res = await (api as any).listblock();  
            const list = Array.isArray(res?.data) ? res.data : []
            console.log(list);
            const mappedBlocked: BlockedUser[] = list.map((u: any) => ({
                id: u.username, 
                username: u.username,
                name: u.nombre_completo || u.username,
                avatar: u.foto_url || "",
                correo: u.correo || "",
                mutualCount: 0,
                isOnline: false
            }));
            
            setBlocked(mappedBlocked);
        } else {
            console.warn("Falta la función listblock() en ItinerariosAPI.ts");
        }
    } catch (error) {
        console.warn("Error cargando bloqueados:", error);
    }
  };

  const loadSuggestionsData = async () => {
    try {
      let list = [];
      if ("getFriendSuggestions" in api) {
        const res = await (api as any).getFriendSuggestions();
        list = Array.isArray(res?.data) ? res.data : [];
      }
      const mapped: FriendSuggestion[] = list.map((s: any) => ({
        id: s.username || String(s.id || ""),
        username: s.username,
        name: s.nombre_completo || s.username,
        avatar: s.foto_url || "",
        city: s.ciudad,
        country: s.pais,
        mutualCount: s.mutuos || 0,
        interests: s.intereses || [],
      }));
      setSuggestions(mapped);
    } catch (err) {
      console.warn("Error cargando sugerencias:", err);
      setSuggestions([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
          loadFriendsData(), 
          loadRequestsData(), 
          loadSuggestionsData(),
          loadBlockedData() // Cargamos bloqueados con la función correcta
        ]);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalFriends = friends.length;
  const totalRequests = requests.length;
  const totalSuggestions = suggestions.length;
  const totalBlocked = blocked.length;

  if (loading) {
    return (
      <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando tu red...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Amigos y Conexiones</h1>
          <p className="text-sm text-muted-foreground">Gestiona tu red de viajeros y descubre nuevas aventuras juntos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild className="h-9">
            <Link href="/viajero/amigos/buscar-viajero">
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Link>
          </Button>
          <Button size="sm" className="h-9">
            <UserPlus className="mr-2 h-4 w-4" />
            Invitar
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <SummaryCard label="Total Amigos" value={totalFriends} icon={Users} active />
        <SummaryCard label="Solicitudes" value={totalRequests} icon={UserCheck} intent={totalRequests > 0 ? "warning" : "default"} />
        <SummaryCard label="Sugerencias" value={totalSuggestions} icon={Sparkles} intent="info" />
        <SummaryCard label="Bloqueados" value={totalBlocked} icon={Ban} intent="danger" /> 
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="friends" className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="h-9 w-full justify-start rounded-lg bg-muted p-1 sm:w-auto overflow-x-auto">
            <TabsTrigger value="friends" className="px-4 text-xs sm:text-sm">
              Amigos <Badge variant="default" className="ml-2 h-5 px-1.5 text-[10px] font-normal">{totalFriends}</Badge>
            </TabsTrigger>
            <TabsTrigger value="requests" className="px-4 text-xs sm:text-sm">
              Solicitudes
              {totalRequests > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px] font-normal">{totalRequests}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="px-4 text-xs sm:text-sm">Sugerencias</TabsTrigger>
            <TabsTrigger value="blocked" className="px-4 text-xs sm:text-sm">Bloqueados</TabsTrigger>
          </TabsList>
        </div>

        {/* Pestaña Amigos */}
        <TabsContent value="friends" className="animate-in fade-in-50 slide-in-from-bottom-2">
          {friends.length === 0 ? (
            <EmptyState icon={Users} title="Tu lista de amigos está vacía" description="¡Es hora de socializar! Busca viajeros con tus mismos intereses para empezar." actionLabel="Buscar viajeros" actionHref="/viajero/amigos/buscar-viajero" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {friends.map((friend) => (
                <FriendCard key={friend.id} friend={friend} onDelete={handleDelete} onBlock={() => handleBlock(friend)} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pestaña Solicitudes */}
        <TabsContent value="requests" className="animate-in fade-in-50 slide-in-from-bottom-2">
          {requests.length === 0 ? (
            <EmptyState icon={UserCheck} title="Todo al día" description="No tienes solicitudes de amistad pendientes en este momento." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {requests.map((req) => (
                <FriendRequestCard key={req.id} request={req} onRespond={handleRespond} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pestaña Sugerencias */}
        <TabsContent value="suggestions" className="animate-in fade-in-50 slide-in-from-bottom-2">
          {suggestions.length === 0 ? (
            <EmptyState icon={Sparkles} title="Sin sugerencias nuevas" description="Vuelve más tarde o interactúa más con la plataforma para recibir recomendaciones personalizadas." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((s) => (
                <FriendSuggestionCard 
                    key={s.id} 
                    suggestion={s} 
                    onConnect={handleConnectSuggestion} 
                    isPending={pendingSuggestions.has(s.username)} 
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pestaña Bloqueados */}
        <TabsContent value="blocked" className="animate-in fade-in-50 slide-in-from-bottom-2">
          {blocked.length === 0 ? (
            <EmptyState icon={Ban} title="Sin usuarios bloqueados" description="Aquí aparecerán las personas que hayas bloqueado." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {blocked.map((b) => (
                <BlockedUserCard key={b.id} user={b} onUnblock={handleUnblock} />
              ))}
            </div>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}

// ===== Componentes Auxiliares =====

function SummaryCard({ label, value, icon: Icon, active = false, intent = "default" }: any) {
  const colors: any = { 
      default: "bg-primary/10 text-primary", 
      warning: "bg-orange-500/10 text-orange-600", 
      info: "bg-blue-500/10 text-blue-600",
      danger: "bg-red-500/10 text-red-600"
  };
  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${active ? "border-primary/50 ring-1 ring-primary/20" : ""}`}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[intent]}`}><Icon className="h-5 w-5" /></div>
        <div><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="text-2xl font-bold tracking-tight">{value}</p></div>
      </CardContent>
    </Card>
  );
}

function FriendCard({ friend, onDelete, onBlock }: any) {
  const confirmBlock = () => {
    toast(`¿Estás seguro de bloquear a @${friend.username}?`, {
      description: "Ya no aparecerá en tu lista de amigos",
      action: { label: "Bloquear", onClick: onBlock },
      cancel: { label: "Cancelar", onClick: () => {} },
      actionButtonStyle: { backgroundColor: "var(--destructive)", color: "white" },
    });
  };

  return (
    <Card className="group flex flex-col justify-between overflow-hidden transition-all hover:border-primary/30 hover:shadow-md">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/viajero/perfil/${friend.username}`} className="flex gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
              <AvatarImage src={friend.avatar} alt={friend.name} />
              <AvatarFallback className="bg-primary/5 font-medium text-primary">{getInitials(friend.name)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 min-w-0">
              <h4 className="font-semibold leading-none truncate">{friend.name}</h4>
              <p className="text-xs text-muted-foreground truncate">@{friend.username}</p>
              {friend.isOnline && <div className="flex items-center gap-1.5 pt-1"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span></span><span className="text-[10px] font-medium text-emerald-600">En línea</span></div>}
            </div>
          </Link>
          <Link href={`/viajero/chats?username=${friend.username}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"><MessageCircle className="h-4 w-4" /></Button>
          </Link>
        </div>
        <div className="space-y-2 rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
          {(friend.city || friend.country) && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{[friend.city, friend.country].filter(Boolean).join(", ")}</span></div>}
          {friend.mutualCount > 0 && <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 shrink-0" /><span>{friend.mutualCount} amigos en común</span></div>}
        </div>
      </CardContent>
      <div className="grid grid-cols-2 border-t">
        <Button variant="ghost" className="w-full rounded-none h-10 text-xs text-muted-foreground hover:bg-muted hover:text-foreground border-r" onClick={() => onDelete(friend.correo)}><UserMinus className="mr-2 h-3.5 w-3.5" />Eliminar</Button>
        <Button variant="ghost" className="w-full rounded-none h-10 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={confirmBlock}><Ban className="mr-2 h-3.5 w-3.5" />Bloquear</Button>
      </div>
    </Card>
  );
}

function BlockedUserCard({ user, onUnblock }: { user: BlockedUser; onUnblock: (username: string) => void }) {
    const [loading, setLoading] = useState(false);
    const handleUnblockClick = async () => {
        setLoading(true);
        await onUnblock(user.username);
        setLoading(false);
    }
    return (
      <Card className="flex flex-col justify-between overflow-hidden border-destructive/20 bg-destructive/5 transition-all">
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-background opacity-80"><AvatarImage src={user.avatar} alt={user.name} /><AvatarFallback>{getInitials(user.name)}</AvatarFallback></Avatar>
            <div className="space-y-1 min-w-0">
              <h4 className="font-semibold leading-none truncate text-muted-foreground line-through">{user.name}</h4>
              <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5 font-normal">Bloqueado</Badge>
            </div>
          </div>
        </CardContent>
        <div className="border-t bg-background/50 p-2">
          <Button variant="ghost" size="sm" className="w-full text-xs hover:bg-primary/10 hover:text-primary" onClick={handleUnblockClick} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin"/> : <Unlock className="mr-2 h-3.5 w-3.5" />} Desbloquear
          </Button>
        </div>
      </Card>
    );
}

function FriendRequestCard({ request, onRespond }: any) {
  const [loading, setLoading] = useState(false);
  const handleAction = async (state: number) => { setLoading(true); await onRespond(Number(request.id), state); setLoading(false); };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <Link href={`/viajero/perfil/${request.username}`} className="flex gap-3 group hover:bg-muted/5 p-1 -m-1 rounded-md transition-colors">
          <Avatar className="h-10 w-10"><AvatarImage src={request.avatar} alt={request.name} /><AvatarFallback>{getInitials(request.name)}</AvatarFallback></Avatar>
          <div className="flex-1 space-y-1 min-w-0">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-sm truncate pr-2 group-hover:text-primary transition-colors">{request.name}</h4>
              {request.dateLabel && <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">{request.dateLabel}</span>}
            </div>
            <p className="text-xs text-muted-foreground truncate">@{request.username}</p>
            {request.message && <div className="mt-2 rounded-md bg-muted p-2 text-xs italic text-muted-foreground">&quot;{request.message}&quot;</div>}
          </div>
        </Link>
      </CardContent>
      <div className="grid grid-cols-2 gap-px bg-border border-t">
        <Button variant="ghost" className="rounded-none bg-card hover:bg-primary/5 hover:text-primary h-10 text-xs font-medium disabled:opacity-50" onClick={() => handleAction(FriendRequestState.FRIEND)} disabled={loading}>{loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <UserCheck className="mr-2 h-3.5 w-3.5" />}Aceptar</Button>
        <Button variant="ghost" className="rounded-none bg-card hover:bg-destructive/5 hover:text-destructive h-10 text-xs font-medium disabled:opacity-50" onClick={() => handleAction(FriendRequestState.REJECTED)} disabled={loading}>{loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <UserX className="mr-2 h-3.5 w-3.5" />}Rechazar</Button>
      </div>
    </Card>
  );
}

function FriendSuggestionCard({ suggestion, onConnect, isPending }: any) {
  const [loading, setLoading] = useState(false);

  return (
    <Card className="flex flex-col justify-between transition-all hover:border-primary/40">
      <CardContent className="p-4">
        <Link href={`/viajero/perfil/${suggestion.username}`} className="flex items-center gap-3 mb-3 group">
          <Avatar className="h-12 w-12 group-hover:scale-105 transition-transform"><AvatarImage src={suggestion.avatar} alt={suggestion.name} /><AvatarFallback>{getInitials(suggestion.name)}</AvatarFallback></Avatar>
          <div className="min-w-0">
            <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">{suggestion.name}</h4>
            <p className="text-xs text-muted-foreground truncate">@{suggestion.username}</p>
            {suggestion.mutualCount > 0 && <p className="text-[10px] text-muted-foreground mt-0.5">{suggestion.mutualCount} amigos en común</p>}
          </div>
        </Link>
        <div className="flex flex-wrap gap-1.5 min-h-[24px]">
          {suggestion.interests.slice(0, 3).map((tag: string) => <Badge key={tag} variant="secondary" className="rounded-md px-1.5 py-0 text-[10px] font-normal">{tag}</Badge>)}
          {suggestion.interests.length > 3 && <Badge variant="outline" className="rounded-md px-1.5 py-0 text-[10px] font-normal">+{suggestion.interests.length - 3}</Badge>}
        </div>
      </CardContent>
      <div className="p-3 pt-0 mt-auto">
        <Button 
            className="w-full h-8 text-xs" 
            variant={isPending ? "secondary" : "outline"}
            disabled={isPending || loading}
            onClick={async () => {
                setLoading(true);
                await onConnect(suggestion.username);
                setLoading(false);
            }}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin"/> : isPending ? "Enviada" : <><UserPlus className="mr-2 h-3.5 w-3.5" />Agregar</>}
        </Button>
      </div>
    </Card>
  );
}

function EmptyState({ icon: Icon, title, description, actionLabel, actionHref }: any) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-8 text-center animate-in zoom-in-95 duration-300">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted"><Icon className="h-7 w-7 text-muted-foreground/50" /></div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && actionHref && <Button className="mt-6" size="sm" asChild><Link href={actionHref}>{actionLabel}</Link></Button>}
    </div>
  );
}