"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotificationsC } from '@/context/NotificationContext';

interface NotificationBellProps {
  type?: "admin" | "viajero";
}

export function NotificationBell({ type = "viajero" }: NotificationBellProps) {
  const { unreadCount } = useNotificationsC();
  
  const notificationRoute = type === "admin" ? "/admin/notificaciones" : "/viajero/notificacion";

  return (
    <Link href={notificationRoute} className="relative cursor-pointer p-4">
      <Bell className="h-6 w-6 text-gray-700" />
      {unreadCount > 0 && (
        <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
          {unreadCount}
        </span>
      )}
    </Link>
  );
}
