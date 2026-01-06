"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Globe, 
  Lock, 
  Pencil, 
  Mail, 
  User, 
  Shield, 
  Map, 
  Users, 
  Loader2,
  CalendarDays
} from "lucide-react";
import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import { Usuario } from "@/api/interfaces/ApiRoutes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AccountPage() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const api = useMemo(() => ItinerariosAPI.getInstance(), []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await api.getUser();
        setUser(userData);
      } catch (error) {
        console.error("Error cargando perfil", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [api]);

  // --- Renderizado de Carga (Skeleton) ---
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-64 animate-pulse relative">
            <div className="h-32 bg-gray-200"></div>
            <div className="px-8">
                <div className="absolute top-20 h-24 w-24 bg-gray-300 rounded-full border-4 border-white"></div>
                <div className="mt-14 space-y-2">
                    <div className="h-6 w-48 bg-gray-200 rounded"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
          </div>
          {/* Info Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="h-40 bg-white rounded-2xl border border-gray-200 animate-pulse"></div>
             <div className="h-40 bg-white rounded-2xl border border-gray-200 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // --- Renderizado Principal ---
  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* 1. Cabecera del Perfil con "Cover" */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Fondo decorativo (Cover) */}
          <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
             <div className="absolute inset-0 bg-white/10 pattern-grid-lg opacity-20"></div>
          </div>
          
          <div className="px-8 pb-8">
            <div className="relative flex flex-col md:flex-row items-start md:items-end justify-between -mt-12 gap-4">
              
              {/* Avatar e Info Principal */}
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                <Avatar className="h-28 w-28 text-4xl border-4 border-white shadow-md bg-white">
                  <AvatarImage src={user.foto_url ? user.foto_url : ""} alt="Foto de perfil" className="object-cover" />
                  <AvatarFallback className="bg-gray-100 text-gray-500 font-bold">
                    {user.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="text-center md:text-left mb-1">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 justify-center md:justify-start">
                        {user.username}
                        <Badge variant="secondary" className="ml-2 font-normal text-xs bg-indigo-50 text-indigo-700 border-indigo-100">
                             {user.role === "user" ? "Viajero" : user.role.toUpperCase()}
                        </Badge>
                    </h1>
                    <p className="text-gray-500 font-medium">{user.nombre_completo}</p>
                    
                    {/* Stats Inline */}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 justify-center md:justify-start">
                        <div className="flex items-center gap-1.5">
                            <Map className="h-4 w-4 text-gray-400" />
                            <span className="font-bold text-gray-900">{user.itineraryCount || 0}</span> Itinerarios
                        </div>
                        <div className="h-4 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="font-bold text-gray-900">{user.friendsCount || 0}</span> Amigos
                        </div>
                    </div>
                </div>
              </div>

              {/* Botón de Acción */}
              <Link href="/admin/configuracion/cuenta/editar" className="w-full md:w-auto mt-4 md:mt-0">
                <Button className="w-full gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:text-gray-900 shadow-sm">
                  <Pencil className="h-4 w-4" />
                  Editar Perfil
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Grid de Detalles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Columna Izquierda: Información de Contacto */}
            <Card className="md:col-span-2 border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <User className="h-5 w-5 text-indigo-500" />
                        Información Personal
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre Completo</label>
                            <div className="flex items-center gap-2 text-gray-900 font-medium p-2 bg-gray-50 rounded-lg border border-gray-100">
                                {user.nombre_completo}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre de Usuario</label>
                            <div className="flex items-center gap-2 text-gray-900 font-medium p-2 bg-gray-50 rounded-lg border border-gray-100">
                                @{user.username}
                            </div>
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Correo Electrónico</label>
                            <div className="flex items-center gap-3 text-gray-900 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                <Mail className="h-4 w-4 text-gray-400" />
                                {user.correo}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Columna Derecha: Estado de Cuenta */}
            <div className="space-y-6">
                <Card className="border-gray-200 shadow-sm h-full">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Shield className="h-5 w-5 text-indigo-500" />
                            Privacidad y Estado
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        
                        {/* Estado de Privacidad */}
                        <div className="flex items-start gap-4 p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                             <div className={`p-2 rounded-lg ${user.privacity_mode ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                {user.privacity_mode ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                             </div>
                             <div>
                                <p className="font-semibold text-gray-900">
                                    {user.privacity_mode ? "Perfil Público" : "Perfil Privado"}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {user.privacity_mode 
                                        ? "Tu perfil es visible para toda la comunidad." 
                                        : "Solo tus amigos pueden ver tu actividad."}
                                </p>
                             </div>
                        </div>

                        <Separator />

                        {/* Rol */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nivel de Acceso</label>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Tipo de Cuenta</span>
                                <Badge variant="outline" className="uppercase font-bold tracking-wide border-indigo-200 bg-indigo-50 text-indigo-700">
                                    {user.role}
                                </Badge>
                            </div>
                        </div>

                        {/* Fecha de Registro (Simulado si no existe en API) */}
                        <div className="flex items-center gap-2 text-xs text-gray-400 pt-2">
                             <CalendarDays className="h-3.5 w-3.5" />
                             Miembro activo de la plataforma
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>

      </div>
    </div>
  );
}