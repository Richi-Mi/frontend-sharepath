"use client";
//ESTE ARCHIVO YA NO SE UTILIZA
import { useRouter } from "next/navigation"; 
import Cookies from "js-cookie";             
import { useEffect, useState } from "react";
import {
  EllipsisVertical,
  CircleUser,
  CreditCard,
  MessageSquareDot,
  LogOut,
  User,
  Edit,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import { getInitials } from "@/lib/utils";

// Tipo que viene del backend
interface ApiUser {
  username: string;
  correo: string;
  foto_url: string;
}

// Tipo que usamos en el sidebar
type SidebarUser = {
  readonly name: string;
  readonly email: string;
  readonly avatar: string;
};

export function NavUser() {
  const router = useRouter();
  const handleLogout = () => {
    Cookies.remove("auth_token");       
    localStorage.removeItem("authToken");
    router.push("/sign-in");            
    router.refresh();                    
  };
  const { isMobile } = useSidebar();
  const [user, setUser] = useState<SidebarUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Usamos la capa de API en lugar de fetch
        const api = ItinerariosAPI.getInstance();
        const data = await api.getUser();

        setUser({
          name: data.username,
          email: data.correo,
          avatar: data.foto_url || "",
        });
        setErrorUser(null);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(null);
        setErrorUser("No se pudo cargar la cuenta");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, []);

  // Estado de carga
  if (loadingUser) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-3 rounded-lg px-2 py-2 text-xs text-muted-foreground">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
            <div className="flex flex-1 flex-col gap-1">
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-2 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Estado de error o sin usuario
  if (!user || errorUser) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-3 rounded-lg px-2 py-2 text-xs text-muted-foreground">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">SP</AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col leading-tight">
              <span className="truncate font-medium">Invitado</span>
              <span className="truncate text-xs text-destructive">
                {errorUser ?? "No se pudo cargar la cuenta"}
              </span>
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Estado normal con usuario cargado
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {/* 
                Estas opciones son SOLO UI en este proyecto.
                No hay lógica de cambio de cuenta / billing / notificaciones.
              */}
              <DropdownMenuItem>
                <User />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/viajero/configuracion/cuenta">
                <Edit />
                Cuenta
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notificaciones
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* 
              TODO: Aquí podrías conectar tu lógica de logout cuando el proyecto lo requiera.
            */}
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
