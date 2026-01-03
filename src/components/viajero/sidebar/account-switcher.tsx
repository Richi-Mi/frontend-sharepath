"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { BadgeCheck, Bell, Edit, LogOut, User } from "lucide-react";
import Link from "next/link";

import { useSocket } from "@/context/socketContext"; // <--- Importar esto

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import { cn, getInitials } from "@/lib/utils";

// Tipo que viene del backend
interface ApiUser {
  username: string;
  correo: string;
  foto_url: string;
}

// Tipo que usamos localmente
type ActiveUser = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly avatar: string;
  readonly role: string;
};

//Definir usuario
interface AccountSwitcherProps {
  type?: "admin" | "viajero";
}

export function AccountSwitcher({ type = "viajero" }: AccountSwitcherProps) {
  const router = useRouter();

  //Rutas dinamicas segun usuario
  const profileRoute = type === "admin" ? "/admin/configuracion/cuenta" : "/viajero/configuracion/cuenta";

  const { recargarUsuario } = useSocket();

  const handleLogout = () => {
    Cookies.remove("auth_token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("sessionID");

    recargarUsuario();

    router.push("/sign-in");
    router.refresh();
    // console.log("Sesion cerrada");
  };
  const [activeUser, setActiveUser] = useState<ActiveUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Usamos la capa de API en lugar de fetch
        const api = ItinerariosAPI.getInstance();
        const data = await api.getUser();

        setActiveUser({
          id: data.correo || "current-user",
          name: data.username,
          email: data.correo,
          avatar: data.foto_url || "",
          role: type === "admin" ? "Administrador" : "Viajero", // Rol fijo para este proyecto
        });
        setErrorUser(null);
      } catch (error) {
        console.error("Error fetching user data in AccountSwitcher:", error);
        setActiveUser(null);
        setErrorUser("No se pudo cargar la cuenta");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, [type]);

  // Estado de carga
  if (loadingUser) {
    return (
      <Avatar className="size-9 rounded-lg">
        <AvatarFallback className="rounded-lg animate-pulse">SP</AvatarFallback>
      </Avatar>
    );
  }

  // Estado de error o sin usuario
  if (!activeUser || errorUser) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="size-9 rounded-lg">
            <AvatarFallback className="rounded-lg">
              {getInitials("Invitado")}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="min-w-56 space-y-1 rounded-lg"
          side="bottom"
          align="end"
          sideOffset={4}
        >
          <div className="px-2 py-2 text-xs text-destructive">
            {errorUser ?? "No se pudo cargar la cuenta"}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-9 rounded-lg cursor-pointer">
          <AvatarImage
            src={activeUser.avatar || undefined}
            alt={activeUser.name}
          />
          <AvatarFallback className="rounded-lg">
            {getInitials(activeUser.name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 space-y-1 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        {/* 
          Antes aquí se listaban múltiples usuarios (users.map).
          En este proyecto SOLO usamos la cuenta activa del backend.
          Dejo el bloque comentado para que no cause dudas.
        */}
        {/*
        {users.map((user) => (
          <DropdownMenuItem
            key={user.email}
            className={cn(
              "p-0",
              user.id === activeUser.id &&
                "bg-accent/50 border-l-primary border-l-2"
            )}
            onClick={() => setActiveUser(user)}
          >
            ...
          </DropdownMenuItem>
        ))}
        */}
        <DropdownMenuItem
          className={cn(
            "p-0 bg-accent/40 border-l-primary border-l-2 cursor-default"
          )}
        >
          <div className="flex w-full items-center justify-between gap-2 px-1 py-1.5">
            <Avatar className="size-9 rounded-lg">
              <AvatarImage
                src={activeUser.avatar || undefined}
                alt={activeUser.name}
              />
              <AvatarFallback className="rounded-lg">
                {getInitials(activeUser.name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{activeUser.name}</span>
              <span className="truncate text-xs capitalize">
                {activeUser.role}
              </span>
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {/* 
            Estas opciones son SOLO UI en este proyecto.
            No tienen lógica de navegación/acción aún.
          */}

           {/* <DropdownMenuItem>
            <User />
            Perfil
          </DropdownMenuItem>  */}
          <DropdownMenuItem>
            <Link
              href={profileRoute}
              className="flex gap-1.5 items-center"
            >
              <Edit />
              Cuenta
            </Link>
          </DropdownMenuItem>
          {/* <DropdownMenuItem>
            <Bell />
            Notificaciones
          </DropdownMenuItem> */}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* 
          TODO: Conectar lógica real de logout cuando la tengas lista.
        */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
