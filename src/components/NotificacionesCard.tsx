"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserPlus,
  MessageCircle,
  Heart,
  Bell,
  Signpost,
  Loader2,
  UserRoundCheck,
  UserRoundX,
  Flag,
} from "lucide-react";
import { useNotificationsC } from "@/context/NotificationContext";
import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

// 1. Mapeo simple de iconos según el TIPO que llega en tu JSON
const getIconAndColor = (type: string) => {
  // Convertimos a mayúsculas para evitar errores (friend_request vs FRIEND_REQUEST)
  const normalized = type?.toUpperCase() || "GENERIC";

  switch (normalized) {
    case "NEW_POST":
    case "NUEVA_PUBLICACION":
      return {
        icon: <Signpost size={16} className="text-white" />,
        color: "bg-green-500",
      };
    case "FRIEND_REQUEST":
    case "SOLICITUD":
      return {
        icon: <UserPlus size={16} className="text-white" />,
        color: "bg-blue-600",
      };
    case "FRIEND_ACCEPTED":
      return {
        icon: <UserRoundCheck size={16} className="text-white" />,
        color: "bg-blue-600",
      };
    case "COMMENT":

    case "COMENTARIO":
      return {
        icon: <MessageCircle size={16} className="text-white" />,
        color: "bg-blue-500",
      };
    case "LIKE":
      return {
        icon: <Heart size={16} className="text-white" />,
        color: "bg-red-500",
      };
    case "FRIEND_REJECTED":
      return {
        icon: <UserRoundX size={16} className="text-white" />,
        color: "bg-red-600",
      };
    case "REPORT":
      return {
        icon: <Flag size={16} className="text-white" />,
        color: "bg-yellow-500",
      };
    default:
      return {
        icon: <Bell size={16} className="text-white" />,
        color: "bg-gray-400",
      };
  }
};

export const NotificationCard = ({ notification }: { notification: any }) => {
  const { setNotifications, markAsRead } = useNotificationsC();
  const api = ItinerariosAPI.getInstance();
  const router = useRouter();
  // Estados para manejar las acciones de la tarjeta
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionResult, setActionResult] = useState<
    "accepted" | "declined" | null
  >(null);

  const {
    id,
    tipo,
    actor_nombre,
    actor_avatar,
    actor_username,
    preview,
    leido,
    linkId,
  } = notification;

  // Si no hay preview, usamos un objeto vacío para que no rompa
  const mensaje = notification.preview?.mensaje || "Nueva notificación";

  // Determinamos el estilo visual
  const { icon, color } = getIconAndColor(tipo);

  const isRequest =
    tipo?.toUpperCase() === "FRIEND_REQUEST" ||
    tipo?.toUpperCase() === "SOLICITUD";
  const bgClass = leido ? "" : "bg-gray-200 dark:bg-gray-700";

  const removeNotification = () => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Efecto para auto-eliminar la notificación después de una acción.
  useEffect(() => {
    // Si se ha aceptado o rechazado la solicitud...
    if (actionResult) {
      // ...esperamos 2 segundos para que el usuario vea el mensaje de confirmación...
      const timer = setTimeout(() => {
        // ...y luego eliminamos la notificación de la lista.
        removeNotification();
      }, 2000);

      // Importante: Limpiamos el temporizador si el componente se desmonta.
      return () => clearTimeout(timer);
    }
  }, [actionResult]); // Este efecto se dispara solo cuando `actionResult` cambia.

  const handleAction = async (
    e: React.MouseEvent,
    action: "accept" | "decline"
  ) => {
    e.preventDefault(); // Evita navegar al Link
    e.stopPropagation();

    // Evita múltiples clics si ya se procesó o está en proceso
    if (isProcessing || actionResult) return;

    setIsProcessing(true);

    try {
      if (action === "accept") {
        await api.respondFriendRequest(Number(linkId), 1); // Usar linkId en lugar de id
        setActionResult("accepted");
      } else {
        await api.respondFriendRequest(Number(linkId), 2); // Usar linkId en lugar de id
        setActionResult("declined");
      }
      // Marcar como leída después de la acción
      if (!leido) markAsRead(id);
    } catch (error) {
      console.error(`Error al ${action} la solicitud:`, error);
      // Opcional: mostrar un toast de error
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotificationClick = () => {
    if (!leido) {
      markAsRead(id);
    }
    // Navega solo si el destino es válido
    if (destination && destination !== "#") {
      router.push(destination);
    }
  };

  // Lógica de redirección mejorada
  const getDestination = () => {
    const upperType = tipo?.toUpperCase();
    switch (upperType) {
      case "FRIEND_REQUEST":
        return `/viajero/perfil/${actor_username}`;
      case "FRIEND_ACCEPTED":
      case "FRIEND_REJECTED":
        return `/viajero/perfil/${actor_username}`;
      case "NEW_POST":
        return `/viajero/publicaciones/${linkId}`;
      case "COMMENT":
      case "LIKE":
        return `/viajero/publicaciones/${linkId}`; // Asumiendo una ruta para ver una publicación específica

      case "REPORT":
        return `/admin/reportes`; // Asumiendo una ruta para ver el reporte en admin
      default:
        return "#";
    }
  };
  const destination = getDestination();

  return (
    <div
      className={`relative w-full p-3 mb-2 rounded-xl border shadow-sm transition-all hover:shadow-md ${bgClass} border-gray-200 cursor-pointer`}
      onClick={handleNotificationClick}
    >
      <div className="flex gap-3 items-start">
        {/* 1. AVATAR + ICONO */}
        <Link
          href={`/viajero/perfil/${actor_username}`}
          className="relative shrink-0 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border border-gray-100 shadow-sm">
            <AvatarImage
              src={actor_avatar || undefined}
              alt={actor_nombre || "Avatar de usuario"}
            />
            <AvatarFallback className="font-bold">
              {getInitials(actor_nombre || "U")}
            </AvatarFallback>
          </Avatar>
          <div
            className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-white ${color}`}
          >
            {icon}
          </div>
        </Link>

        {/* 2. CONTENIDO TEXTO */}
        <div className="flex-1 min-w-0">
          <div className="block">
            <p className="text-sm leading-snug">
              <span className="font-bold ">{actor_nombre}</span>{" "}
              {mensaje}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {/* Formato de fecha simple */}
              {notification.fecha
                ? new Date(notification.fecha).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Ahora"}
            </p>
          </div>

          {/* 3. BOTONES (Solo si es solicitud de amistad) */}
          {isRequest && (
            <div className="flex items-center gap-2 mt-3">
              {!actionResult ? (
                <>
                  <button
                    onClick={(e) => handleAction(e, "accept")}
                    disabled={isProcessing}
                    className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-md hover:bg-indigo-700 transition disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center"
                  >
                    {isProcessing && (
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    )}
                    Aceptar
                  </button>
                  <button
                    onClick={(e) => handleAction(e, "decline")}
                    disabled={isProcessing}
                    className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-md hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                </>
              ) : actionResult === "accepted" ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-md">
                  <UserRoundCheck className="h-4 w-4" /> ¡Ahora son amigos!
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-md">
                  <UserRoundX className="h-4 w-4" /> Solicitud rechazada
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
