"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Flag, 
  UserPlus, 
  ShieldAlert, 
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Filter,
  Search
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Tipos de notificaciones para administrador
type NotificacionAdminTipo = 
  | "NUEVO_REPORTE" 
  | "USUARIO_REGISTRADO" 
  | "CONTENIDO_BANEADO"
  | "USUARIO_BLOQUEADO"
  | "ITINERARIO_ELIMINADO";

interface NotificacionAdmin {
  id: string;
  tipo: NotificacionAdminTipo;
  titulo: string;
  mensaje: string;
  fecha: Date;
  leido: boolean;
  usuario?: {
    nombre: string;
    username: string;
    avatar?: string;
  };
  metadata?: {
    reporteId?: number;
    usuarioId?: string;
    itinerarioId?: number;
  };
}

// Configuración visual para cada tipo de notificación
const getNotificationConfig = (tipo: NotificacionAdminTipo) => {
  switch (tipo) {
    case "NUEVO_REPORTE":
      return {
        icon: Flag,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-100"
      };
    case "USUARIO_REGISTRADO":
      return {
        icon: UserPlus,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-100"
      };
    case "CONTENIDO_BANEADO":
      return {
        icon: ShieldAlert,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-100"
      };
    case "USUARIO_BLOQUEADO":
      return {
        icon: AlertTriangle,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-100"
      };
    case "ITINERARIO_ELIMINADO":
      return {
        icon: Trash2,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-100"
      };
    default:
      return {
        icon: Bell,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-100"
      };
  }
};

export default function NotificacionesAdmin() {
  const [notificaciones, setNotificaciones] = useState<NotificacionAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "no_leidas">("todas");
  const [busqueda, setBusqueda] = useState("");

  // Datos de ejemplo (aquí conectarías con tu API)
  useEffect(() => {
    // Simular carga de notificaciones
    setTimeout(() => {
      const notificacionesEjemplo: NotificacionAdmin[] = [
        {
          id: "1",
          tipo: "NUEVO_REPORTE",
          titulo: "Nuevo reporte de contenido",
          mensaje: "Usuario @juanperez reportó una publicación por contenido inapropiado",
          fecha: new Date(Date.now() - 5 * 60 * 1000), // hace 5 minutos
          leido: false,
          usuario: {
            nombre: "Juan Pérez",
            username: "juanperez",
            avatar: undefined
          },
          metadata: {
            reporteId: 123
          }
        },
        {
          id: "2",
          tipo: "USUARIO_REGISTRADO",
          titulo: "Nuevo usuario registrado",
          mensaje: "Se registró un nuevo usuario en la plataforma",
          fecha: new Date(Date.now() - 30 * 60 * 1000), // hace 30 minutos
          leido: false,
          usuario: {
            nombre: "María García",
            username: "mariagarcia",
            avatar: undefined
          }
        },
        {
          id: "3",
          tipo: "CONTENIDO_BANEADO",
          titulo: "Contenido baneado exitosamente",
          mensaje: "Se baneó la publicación #456 por violar las normas de la comunidad",
          fecha: new Date(Date.now() - 2 * 60 * 60 * 1000), // hace 2 horas
          leido: true,
          metadata: {
            reporteId: 456
          }
        },
        {
          id: "4",
          tipo: "USUARIO_BLOQUEADO",
          titulo: "Usuario bloqueado",
          mensaje: "Se bloqueó al usuario @usuarioproblematico por múltiples reportes",
          fecha: new Date(Date.now() - 24 * 60 * 60 * 1000), // hace 1 día
          leido: true,
          usuario: {
            nombre: "Usuario Problemático",
            username: "usuarioproblematico",
            avatar: undefined
          }
        }
      ];
      setNotificaciones(notificacionesEjemplo);
      setLoading(false);
    }, 500);
  }, []);

  const marcarComoLeida = (id: string) => {
    setNotificaciones(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, leido: true } : notif
      )
    );
  };

  const marcarTodasComoLeidas = () => {
    setNotificaciones(prev =>
      prev.map(notif => ({ ...notif, leido: true }))
    );
  };

  const notificacionesFiltradas = notificaciones
    .filter(n => filtro === "todas" || !n.leido)
    .filter(n => 
      busqueda === "" ||
      n.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      n.mensaje.toLowerCase().includes(busqueda.toLowerCase()) ||
      n.usuario?.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

  const noLeidas = notificaciones.filter(n => !n.leido).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Notificaciones</h1>
            <p className="text-gray-500 mt-2 text-sm">
              Centro de alertas y eventos del sistema
            </p>
          </div>
          {noLeidas > 0 && (
            <button
              onClick={marcarTodasComoLeidas}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marcar todas como leídas
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 p-2 rounded-lg">
                <Bell className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{notificaciones.length}</p>
                <p className="text-xs text-gray-500">Total notificaciones</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{noLeidas}</p>
                <p className="text-xs text-gray-500">Sin leer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar notificaciones..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFiltro("todas")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  filtro === "todas"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                Todas
              </button>
              <button
                onClick={() => setFiltro("no_leidas")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  filtro === "no_leidas"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                No leídas ({noLeidas})
              </button>
            </div>
          </div>
        </div>

        {/* Lista de notificaciones */}
        <div className="space-y-3">
          {notificacionesFiltradas.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <div className="bg-gray-100 p-3 rounded-full w-fit mx-auto mb-3">
                <Bell className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-gray-900 font-medium mb-1">Sin notificaciones</h3>
              <p className="text-sm text-gray-500">
                {busqueda ? "No se encontraron resultados" : "No hay notificaciones que mostrar"}
              </p>
            </div>
          ) : (
            notificacionesFiltradas.map((notif) => {
              const config = getNotificationConfig(notif.tipo);
              const Icon = config.icon;

              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.leido && marcarComoLeida(notif.id)}
                  className={cn(
                    "bg-white rounded-xl border shadow-sm p-4 transition-all cursor-pointer hover:shadow-md",
                    notif.leido ? "border-gray-200" : "border-indigo-200 bg-indigo-50/30"
                  )}
                >
                  <div className="flex gap-4">
                    <div className={cn("flex-shrink-0 p-2 rounded-lg h-fit", config.bgColor)}>
                      <Icon className={cn("h-5 w-5", config.color)} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className={cn(
                          "text-sm font-semibold",
                          notif.leido ? "text-gray-700" : "text-gray-900"
                        )}>
                          {notif.titulo}
                        </h3>
                        {!notif.leido && (
                          <span className="flex-shrink-0 h-2 w-2 bg-indigo-600 rounded-full"></span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {notif.mensaje}
                      </p>

                      {notif.usuario && (
                        <div className="flex items-center gap-2 mb-3">
                          <Avatar className="h-6 w-6 border border-gray-200">
                            <AvatarImage src={notif.usuario.avatar} />
                            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                              {notif.usuario.nombre.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-500">
                            {notif.usuario.nombre} (@{notif.usuario.username})
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(notif.fecha, { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
