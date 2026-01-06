"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useSocket } from "@/context/socketContext"; // <--- El socket de tu compañero
import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import { RawNotification } from "@/api/interfaces/ApiRoutes";

// Definimos el tipo básico (puedes ajustarlo si usas TS estricto)
interface NotificationContextType {
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  markAsRead: (notificationId: number) => Promise<void>;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// --- FUNCIÓN HELPER PARA FORMATEAR ---
// Centraliza la lógica de transformación de datos del backend a la UI.
const formatNotification = (n: any): any => {
  // Si la notificación ya viene con el formato de la UI (desde el socket), la devolvemos tal cual.
  if (n.actor_nombre) {
    return n;
  }

  // Si no, es una `RawNotification` de la base de datos y la transformamos.
  // Añadimos comprobaciones para evitar errores si `emisor` es nulo.
  const raw = n as RawNotification;
  return {
    id: raw.id,
    tipo: raw.type,
    preview: { mensaje: raw.previewText || "Nueva notificación" },
    actor_nombre:
      raw.emisor?.nombre_completo || raw.emisor?.username || "Usuario",
    actor_username: raw.emisor?.username || "user",
    actor_avatar: raw.emisor?.foto_url || null, // Devolver null si no hay foto
    fecha: raw.createdAt,
    leido: raw.isRead,
    linkId: raw.resourceId,
  };
};

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { socket, isConnected } = useSocket(); // Obtenemos la conexión existente
  const [notifications, setNotifications] = useState<any[]>([]);
  // 1. Cargar historial de notificaciones desde la base de datos al iniciar
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const api = ItinerariosAPI.getInstance();

        // 1. Obtenemos todas las notificaciones, amigos y solicitudes pendientes en paralelo
        const [notificacionesRaw, amigosData, solicitudesData] =
          await Promise.all([
            api.getNotifications(),
            api.getFriends().catch(() => []), // Si falla, devolvemos un array vacío
            api.getRequests().catch(() => ({ data: [] })), // Si falla, devolvemos un objeto vacío
          ]);

        // Obtenemos el username del usuario actual para comparar correctamente
        const meJson = localStorage.getItem("user");
        const meUsername = meJson ? JSON.parse(meJson).username : null;

        // 2. Creamos Sets para una búsqueda rápida de estados de amistad
        const amigosUsernames = new Set(
          (amigosData || [])
            .map((amigo: any) => {
              // Lógica correcta para identificar al otro usuario
              return amigo.requesting_user?.username === meUsername
                ? amigo.receiving_user?.username
                : amigo.requesting_user?.username;
            })
            .filter(Boolean)
        );
        const solicitudesPendientesIds = new Set(
          (solicitudesData?.data || []).map((req: any) => req.id.toString())
        );

        // 3. Filtramos y transformamos las notificaciones
        const historialFiltrado = notificacionesRaw.filter((notif) => {
          const upperCaseType = notif.type.toUpperCase();

          // Lógica para notificaciones de solicitud de amistad
          if (upperCaseType === "FRIEND_REQUEST") {
            // **NO MOSTRAR** la notificación si el emisor YA es nuestro amigo.
            if (notif.emisor && amigosUsernames.has(notif.emisor.username)) {
              return false;
            }
            // Si no es amigo, solo mostrar la notificación si la solicitud aún está pendiente.
            return solicitudesPendientesIds.has(notif.resourceId?.toString());
          }

          // Para todos los demás tipos de notificaciones, las mostramos.
          return true;
        });

        setNotifications(historialFiltrado.map(formatNotification));
      } catch (error) {
        console.error("Error al cargar el historial de notificaciones:", error);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleReceiveNotification = (payload: any) => {
      console.log("🔔 Socket: Nueva notificación recibida:", payload);
      // Formateamos la notificación del socket antes de añadirla al estado
      setNotifications((prev) => [payload, ...prev]);
      const audio = new Audio("/audio/notification.mp3");
      audio.play().catch((e) => console.log(e));
    };

    socket.on("receive notification", handleReceiveNotification);

    return () => {
      socket.off("receive notification", handleReceiveNotification);
    };
  }, [socket, isConnected]);

  const unreadCount = notifications.filter((n) => !n.leido).length;

  const markAsRead = async (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, leido: true } : n))
    );

    try {
      const api = ItinerariosAPI.getInstance();
      await api.markNotificationAsRead(notificationId);
      console.log(
        `✅ Notificación ${notificationId} marcada como leída en el servidor.`
      );
    } catch (error) {
      console.error("Error al marcar como leída, revirtiendo cambio:", error);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, leido: false } : n))
      );
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        setNotifications,
        unreadCount,
        markAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationsC = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationsC debe usarse dentro de un NotificationProvider"
    );
  }
  return context;
};
