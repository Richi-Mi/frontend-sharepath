"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  Pencil, 
  Lock, 
  Unlock,
  Trash2, 
  Search, 
  Filter, 
  UserPlus, 
  MoreVertical,
  Shield,
  User as UserIcon,
  AlertCircle
} from 'lucide-react';
import { ItinerariosAPI } from '@/api/ItinerariosAPI';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// --- Interfaces (Sin cambios en lógica, solo visual) ---
interface User {
  id: string;
  nombre: string;
  username: string;
  correo: string;
  ultimoAcceso: string;
  role: string;
  account_status: boolean;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado visual para búsqueda (solo UI por ahora)
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ItinerariosAPI.getInstance().getAllUsers();
      
      const usersArray = Array.isArray(response)
        ? response
        : (response as any)?.users || (response as any)?.data?.users || (response as any)?.data;

      if (!usersArray || !Array.isArray(usersArray)) {
        setUsuarios([]);
        return;
      }
      
      const mappedUsers: User[] = usersArray.map((u: any) => {
        const correo = u?.correo || u?.email || u?.mail || u?.user_email || "";
        const username = u?.username || u?.user || u?.nick || u?.login || "";
        const nombre = u?.nombre_completo || u?.nombre || u?.full_name || u?.name || "";
        const role = u?.role || u?.rol || u?.tipo || "user";
        const account_status =
          u?.account_status ?? u?.is_active ?? u?.activo ?? (u?.status === "active" ? true : u?.status === "blocked" ? false : true);

        return {
          id: correo || username || String(u?.id || u?._id || crypto.randomUUID?.() || Math.random()),
          nombre,
          username,
          correo,
          ultimoAcceso: 'N/A', // Podríamos formatear fecha aquí si la API la trajera
          role,
          account_status: Boolean(account_status),
        } as User;
      });

      setUsuarios(mappedUsers);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('No se pudieron cargar los usuarios. Por favor, verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  // --- Lógica original intacta ---
  const handleEdit = (id: string) => {
    console.log('Editar usuario:', id);
    // TODO: Implementar modal
  };

  const handleBlock = async (id: string) => {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return;

    const confirmMessage = usuario.account_status 
      ? '¿Estás seguro de que deseas bloquear este usuario?' 
      : '¿Estás seguro de que deseas desbloquear este usuario?';
    
    setConfirmDialog({
      open: true,
      title: usuario.account_status ? "Bloquear usuario" : "Desbloquear usuario",
      description: confirmMessage,
      onConfirm: async () => {
        try {
          if (usuario.account_status) {
            await ItinerariosAPI.getInstance().block(usuario.correo);
            toast.success('Usuario bloqueado correctamente');
          } else {
            await ItinerariosAPI.getInstance().unblock(usuario.correo);
            toast.success('Usuario desbloqueado correctamente');
          }
          await loadUsuarios();
        } catch (error) {
          console.error('Error:', error);
          toast.error('Error al cambiar el estado del usuario');
        }
      }
    });
  };

  const handleDelete = async (id: string) => {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return;

    setConfirmDialog({
      open: true,
      title: "Eliminar usuario",
      description: '¿Estás seguro de que deseas eliminar este usuario permanentemente? Se borrarán todas sus fotos, posts, amigos y más. Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          console.log('Intentando eliminar usuario con username:', usuario.username);
          await ItinerariosAPI.getInstance().deleteUserByUsername(usuario.username);
          await loadUsuarios();
          toast.success('Usuario eliminado exitosamente');
        } catch (error: any) {
          console.error('Error al eliminar usuario:', error);
          toast.error(`Error al eliminar el usuario: ${error.message || 'Error desconocido'}`);
        }
      }
    });
  };

  // --- Helper UI: Generar iniciales para Avatar ---
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // --- Filtro en tiempo real ---
  const usuariosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return usuarios;
    
    const lowerSearch = searchTerm.toLowerCase();
    return usuarios.filter(usuario => 
      usuario.nombre.toLowerCase().includes(lowerSearch) ||
      usuario.username.toLowerCase().includes(lowerSearch) ||
      usuario.correo.toLowerCase().includes(lowerSearch) ||
      usuario.role.toLowerCase().includes(lowerSearch)
    );
  }, [usuarios, searchTerm]);

  // --- Renderizado Condicional: Skeleton Loader ---
  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center p-4 border-b border-gray-100 last:border-0">
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse mr-4"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Renderizado Condicional: Error State ---
  if (error) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="bg-red-50 p-6 rounded-full mb-4">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Algo salió mal</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <button 
          onClick={loadUsuarios}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Reintentar cargar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="container mx-auto max-w-7xl">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Usuarios</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gestiona los accesos y roles de los miembros del sistema.
            </p>
          </div>
        </div>

        {/* --- Controls & Filter Section (Visual UI) --- */}
        <div className="bg-white p-4 rounded-t-xl border border-b-0 border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, correo o username..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
             <button className="inline-flex items-center px-3 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
               <Filter size={16} className="mr-2 text-gray-500" />
               Filtros
             </button>
             <div className="text-sm text-gray-500 font-medium px-2">
                Total: {usuariosFiltrados.length}
             </div>
          </div>
        </div>

        {/* --- Table Section --- */}
        <div className="bg-white border border-gray-200 rounded-b-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Rol
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <UserIcon size={48} className="mb-4 text-gray-200" />
                        <p className="text-lg font-medium text-gray-900">
                          {searchTerm.trim() ? 'Sin resultados' : 'No hay usuarios'}
                        </p>
                        <p className="text-sm">
                          {searchTerm.trim() 
                            ? 'Intenta ajustar tu búsqueda.' 
                            : 'Intenta ajustar los filtros de búsqueda.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((usuario) => (
                    <tr key={usuario.id} className="group hover:bg-gray-50/80 transition-colors duration-150">
                      
                      {/* Columna Usuario: Avatar + Nombre + Email */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm
                              ${usuario.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-blue-400 to-cyan-500'}
                            `}>
                              {getInitials(usuario.nombre || usuario.username)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{usuario.nombre || 'Sin Nombre'}</div>
                            <div className="text-sm text-gray-500">{usuario.correo}</div>
                            <div className="text-xs text-gray-400 md:hidden">@{usuario.username}</div>
                          </div>
                        </div>
                      </td>

                      {/* Columna Rol */}
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="flex flex-col">
                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit
                            ${usuario.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                            {usuario.role === 'admin' && <Shield size={12} className="mr-1" />}
                            {usuario.role.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400 mt-1 pl-1">@{usuario.username}</span>
                        </div>
                      </td>

                      {/* Columna Estado */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                          ${usuario.account_status 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${usuario.account_status ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          {usuario.account_status ? 'Activo' : 'Bloqueado'}
                        </span>
                      </td>

                      {/* Columna Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          
                          <button
                            onClick={() => handleDelete(usuario.id)}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 size={18} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer de la tabla (Paginación visual placeholder) */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
             <span className="text-xs text-gray-500">Mostrando {usuariosFiltrados.length} resultados</span>
             <div className="flex gap-1">
                <button disabled className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-400 bg-white cursor-not-allowed">Anterior</button>
                <button disabled className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-400 bg-white cursor-not-allowed">Siguiente</button>
             </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(prev => ({ ...prev, open: false }));
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}