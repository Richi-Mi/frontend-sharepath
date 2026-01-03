"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  Map, 
  Trash2, 
  Eye, 
  Settings, 
  MoreVertical, 
  Image as ImageIcon, 
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  AlertCircle
} from "lucide-react"; // Usamos Lucide para consistencia con el primer diseño
import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import { ItinerarioData } from "@/api/interfaces/ApiRoutes";
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

// --- Interfaces ---
type ItinerarioUI = ItinerarioData & {
  estado: "Reportado" | "No publicado" | "Publicado";
  autor?: {
    username?: string;
    correo?: string;
    nombre?: string;
  };
};

export default function ItinerariosPage() {
  // --- Estados ---
  const [busqueda, setBusqueda] = useState("");
  const [itinerariosData, setItinerariosData] = useState<ItinerarioUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Estados del Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [itinerarioSeleccionado, setItinerarioSeleccionado] = useState<ItinerarioUI | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [loadingModal, setLoadingModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });
  
  const api = useMemo(() => ItinerariosAPI.getInstance(), []);

  // --- Lógica de Carga (Intacta) ---
  useEffect(() => {
    loadItinerarios();
  }, [api]);

  const loadItinerarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const listResp = await api.getMyItinerarios();

      const fetchedItinerarios: any[] = Array.isArray(listResp)
        ? listResp
        : (listResp as any)?.itinerarios || (listResp as any)?.items || [];

      if (Array.isArray(fetchedItinerarios) && fetchedItinerarios.length > 0) {
        const mapped = fetchedItinerarios.map((it: any) => {
          // Extraer autor de diferentes posibles ubicaciones
          const autor = it.usuario || it.user || it.owner || it.autor || {};
          return {
            ...it,
            id: it.id ?? it.itinerario_id ?? it._id ?? it.Id,
            title: it.title ?? it.nombre ?? it.name ?? "Sin nombre",
            actividades: Array.isArray(it.actividades) ? it.actividades : (Array.isArray(it.activities) ? it.activities : []),
            createdAt: it.createdAt ?? it.fecha_creacion ?? it.created_at ?? new Date().toISOString(),
            estado: ((it.estado === "Aprobado" || it.estado === "aprobado") ? "Publicado" : it.estado) as ItinerarioUI["estado"] ?? "Publicado",
            autor: {
              username: autor.username || it.username || "Anónimo",
              correo: autor.correo || autor.email || it.correo || "",
              nombre: autor.nombre_completo || autor.full_name || autor.nombre || it.nombre_usuario || "",
            },
            imagenes: it.imagenes || it.images || it.fotos || it.gallery || (it.cover ? [it.cover] : []),
            descripcion: it.descripcion ?? it.description ?? "Sin descripción disponible.",
            calificacion: it.calificacion ?? it.google_score ?? it.rating ?? 0,
          };
        });

        // Enriquecer cada itinerario con los mismos datos detallados que usa el modal
        const enriched = await Promise.all(
          mapped.map(async (base) => {
            try {
              const detalle = await api.getItinerarioById(base.id);
              const autorDetalle = detalle.usuario || detalle.user || detalle.owner || detalle.autor || detalle.creador || detalle.created_by || {};
              const actividadesDetalle = Array.isArray(detalle.actividades)
                ? detalle.actividades
                : (Array.isArray(detalle.activities) ? detalle.activities : (base.actividades || []));

              return {
                ...base,
                ...detalle,
                id: detalle.id ?? base.id,
                title: detalle.title ?? detalle.nombre ?? base.title,
                actividades: actividadesDetalle,
                createdAt: detalle.createdAt ?? detalle.fecha_creacion ?? detalle.created_at ?? base.createdAt,
                autor: {
                  username: autorDetalle.username || detalle.username || detalle.username_user || base.autor?.username || "Anónimo",
                  correo: autorDetalle.correo || autorDetalle.email || detalle.correo || detalle.email || base.autor?.correo || "",
                  nombre: autorDetalle.nombre_completo || autorDetalle.full_name || autorDetalle.nombre || detalle.nombre_completo || detalle.full_name || detalle.nombre_usuario || base.autor?.nombre || "",
                },
                imagenes: detalle.imagenes || detalle.images || detalle.fotos || detalle.gallery || base.imagenes,
                descripcion: detalle.descripcion ?? detalle.description ?? base.descripcion,
                calificacion: detalle.calificacion ?? detalle.google_score ?? detalle.rating ?? base.calificacion ?? 0,
                estado: ((detalle.estado === "Aprobado" || detalle.estado === "aprobado") ? "Publicado" : detalle.estado) as ItinerarioUI["estado"] ?? base.estado,
              } as ItinerarioUI;
            } catch (err) {
              console.warn("No se pudo enriquecer itinerario", base.id, err);
              return base;
            }
          })
        );

        setItinerariosData(enriched);
      } else {
        setItinerariosData([]);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "No se pudieron cargar los datos.";
      setError(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Filtrado ---
  const itinerariosFiltrados = useMemo(() => {
    return itinerariosData.filter(
      (item) =>
        String(item.id).includes(busqueda) ||
        (item.title && item.title.toLowerCase().includes(busqueda.toLowerCase())) ||
        (item.autor?.username && item.autor.username.toLowerCase().includes(busqueda.toLowerCase()))
    );
  }, [itinerariosData, busqueda]);

  // --- Helpers de UI ---
  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  const handleVerItinerario = (id: number | string) => {
    const it = itinerariosData.find((i) => String(i.id) === String(id));
    if (!it) return;
    
    // Cargar datos completos del itinerario incluyendo el autor y las paradas
    setLoadingModal(true);
    api.getItinerarioById(id)
      .then(async (itinerarioDetalle: any) => {
        console.log("Itinerario detalle recibido:", itinerarioDetalle);
        
        // Mapear datos del itinerario detallado
        const autorDetalle = itinerarioDetalle.usuario || itinerarioDetalle.user || itinerarioDetalle.owner || itinerarioDetalle.autor || {};
        
        // Obtener detalles de cada lugar/parada
        let actividadesConDetalles = Array.isArray(itinerarioDetalle.actividades) 
          ? itinerarioDetalle.actividades 
          : (Array.isArray(itinerarioDetalle.activities) ? itinerarioDetalle.activities : (Array.isArray(it.actividades) ? it.actividades : []));
        
        console.log("Actividades encontradas:", actividadesConDetalles);
        
        // Cargar detalles de lugares si existen id_api_place
        try {
          actividadesConDetalles = await Promise.all(
            actividadesConDetalles.map(async (actividad: any) => {
              console.log("Procesando actividad:", actividad);
              const idPlace = actividad.id_api_place || actividad.lugarId || actividad.lugar_id;
              
              if (idPlace) {
                try {
                  console.log("Cargando lugar con ID:", idPlace);
                  const lugarDetalle = await api.getLugarById(idPlace);
                  console.log("Lugar cargado:", lugarDetalle);
                  return {
                    ...actividad,
                    lugarDetalle: lugarDetalle
                  };
                } catch (err) {
                  console.warn(`Error cargando lugar ${idPlace}:`, err);
                  return actividad;
                }
              }
              return actividad;
            })
          );
        } catch (err) {
          console.warn("Error cargando detalles de lugares:", err);
        }

        const itinerarioConDetalles: ItinerarioUI = {
          ...it,
          ...itinerarioDetalle,
          id: itinerarioDetalle.id ?? it.id,
          title: itinerarioDetalle.title ?? itinerarioDetalle.nombre ?? it.title,
          actividades: actividadesConDetalles,
          createdAt: itinerarioDetalle.createdAt ?? itinerarioDetalle.fecha_creacion ?? itinerarioDetalle.created_at ?? it.createdAt,
          autor: {
            username: autorDetalle.username || it.autor?.username || "Anónimo",
            correo: autorDetalle.correo || autorDetalle.email || it.autor?.correo || "",
            nombre: autorDetalle.nombre_completo || autorDetalle.full_name || autorDetalle.nombre || it.autor?.nombre || "",
          }
        };
        console.log("Itinerario cargado completamente:", itinerarioConDetalles);
        setItinerarioSeleccionado(itinerarioConDetalles);
        setCarouselIndex(0);
        setModalAbierto(true);
      })
      .catch((err) => {
        console.error("Error cargando itinerario:", err);
        setItinerarioSeleccionado(it);
        setCarouselIndex(0);
        setModalAbierto(true);
      })
      .finally(() => setLoadingModal(false));
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setItinerarioSeleccionado(null);
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!itinerarioSeleccionado) return;
    const total = (itinerarioSeleccionado as any).imagenes.length;
    setCarouselIndex((prev) => (prev + 1) % total);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!itinerarioSeleccionado) return;
    const total = (itinerarioSeleccionado as any).imagenes.length;
    setCarouselIndex((prev) => (prev - 1 + total) % total);
  };

  const handleEliminar = async (id: number | string) => {
    const itinerario = itinerariosData.find((item) => item.id === id);
    const username = itinerario?.autor?.username;
    
    if (!username) {
      toast.error("No se pudo identificar el username del autor del itinerario.");
      return;
    }
    
    setConfirmDialog({
      open: true,
      title: "Eliminar itinerario",
      description: "¿Eliminar este itinerario permanentemente? Esta acción no se puede deshacer.",
      onConfirm: async () => {
        try {
          setDeletingId(Number(id));
          await api.deleteUserByUsername(username);
          setItinerariosData((prev) => prev.filter((item) => item.id !== id));
          toast.success("Itinerario eliminado.");
        } catch (err: any) {
          toast.error(`Error: ${err?.message}`);
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  // --- Render Skeleton ---
  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
           <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-64 bg-gray-100 rounded animate-pulse"></div>
           </div>
           <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center p-4 border-b border-gray-100 gap-4">
              <div className="h-16 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-1/4 bg-gray-100 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Render Principal ---
  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="container mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Itinerarios</h1>
            <p className="text-sm text-gray-500 mt-1">
              Administra las rutas, guías y contenido de viaje creados por la comunidad.
            </p>
          </div>
          <div className="flex gap-3">
             <button 
                onClick={loadItinerarios}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
             >
                <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
             </button>
             <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium border border-indigo-100 flex items-center">
                <Map size={16} className="mr-2" />
                Total: {itinerariosData.length}
             </div>
          </div>
        </div>

        {/* Toolbar de Filtros */}
        <div className="bg-white p-4 rounded-t-xl border border-b-0 border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por título, ID o autor..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all sm:text-sm"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
             <Filter size={16} className="mr-2" />
             Filtros avanzados
          </button>
        </div>

        {/* Tabla */}
        <div className="bg-white border border-gray-200 rounded-b-xl shadow-sm overflow-hidden">
          
          {error && (
            <div className="bg-red-50 p-4 border-b border-red-100 flex items-center text-red-700 text-sm">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Itinerario</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Autor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalles</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {itinerariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <Map size={48} className="text-gray-200 mb-4" />
                        <p className="text-lg font-medium text-gray-900">No se encontraron itinerarios</p>
                        <p className="text-sm">Intenta con otra búsqueda.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  itinerariosFiltrados.map((item) => (
                    <tr key={item.id} className="group hover:bg-gray-50/80 transition-colors">
                      {/* Columna Itinerario (Imagen + Título) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-12 w-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
                             {(item as any).imagenes?.[0] ? (
                               <img 
                                 src={(item as any).imagenes[0]} 
                                 className="h-full w-full object-cover" 
                                 alt="Thumbnail" 
                               />
                             ) : (
                               <div className="flex items-center justify-center h-full text-gray-300">
                                 <ImageIcon size={20} />
                               </div>
                             )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900 truncate max-w-[200px]" title={item.title}>
                                {item.title}
                            </div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">ID: {item.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Columna Autor */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                           <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 mr-2">
                              {getInitials(item.autor?.nombre || item.autor?.username || "A")}
                           </div>
                           <div className="flex flex-col">
                             <span className="text-sm font-medium text-gray-900">
                                {item.autor?.nombre || item.autor?.username || "An\u00f3nimo"}
                             </span>
                             <span className="text-xs text-gray-500">{item.autor?.correo || "@" + (item.autor?.username || "desconocido")}</span>
                           </div>
                        </div>
                      </td>

                      {/* Columna Detalles */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center text-xs text-gray-600">
                            <MapPin size={12} className="mr-1.5 text-gray-400" />
                            {item.actividades?.length || 0} Paradas
                          </div>
                        </div>
                      </td>

                       {/* Columna Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleVerItinerario(item.id)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEliminar(item.id)}
                            disabled={deletingId === Number(item.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
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
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
             <span className="text-xs text-gray-500">Mostrando {itinerariosFiltrados.length} resultados</span>
             {/* Paginación visual placeholder */}
             <div className="flex gap-1">
                <button disabled className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-400 bg-white cursor-not-allowed">Anterior</button>
                <button disabled className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-400 bg-white cursor-not-allowed">Siguiente</button>
             </div>
          </div>
        </div>

      </div>

      {/* --- MODAL DETALLE --- */}
      {modalAbierto && itinerarioSeleccionado && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={(e) => { if (e.target === e.currentTarget) cerrarModal(); }}
        >
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" />
          
          <div className="relative z-10 w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-20">
               <div>
                  <h3 className="text-lg font-bold text-gray-900">{itinerarioSeleccionado.title}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                     <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">ID: {itinerarioSeleccionado.id}</span>
                     <span>Creado por @{itinerarioSeleccionado.autor?.username}</span>
                  </p>
               </div>
               <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <span className="sr-only">Cerrar</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>

            <div className="flex flex-col md:flex-row h-full">
               {/* Columna Única: Información y Paradas */}
              <div className="w-full bg-white p-6">
                  
                  <div className="space-y-6">
                     {/* Información del Autor */}
                     <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Información del Autor</h4>
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-full bg-indigo-200 flex items-center justify-center text-sm font-bold text-indigo-700">
                              {getInitials(itinerarioSeleccionado.autor?.nombre || itinerarioSeleccionado.autor?.username || "A")}
                           </div>
                           <div>
                              <p className="text-sm font-semibold text-gray-900">
                                 {itinerarioSeleccionado.autor?.nombre || itinerarioSeleccionado.autor?.username || "Anónimo"}
                              </p>
                              <p className="text-xs text-indigo-600">@{itinerarioSeleccionado.autor?.username || "desconocido"}</p>
                              <p className="text-xs text-gray-500">{itinerarioSeleccionado.autor?.correo || "Sin correo"}</p>
                           </div>
                        </div>
                     </div>

                     {/* Métricas */}
                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                           <span className="text-indigo-600 block text-xs font-bold">Calificación</span>
                           <span className="text-xl font-bold text-indigo-900">{((itinerarioSeleccionado as any).calificacion || 0).toFixed(1)}</span>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                           <span className="text-emerald-600 block text-xs font-bold">Paradas</span>
                           <span className="text-xl font-bold text-emerald-900">{itinerarioSeleccionado.actividades?.length || 0}</span>
                        </div>
                     </div>

                     {/* Lista de Actividades/Paradas */}
                     <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Ruta de Paradas ({itinerarioSeleccionado.actividades?.length || 0})</h4>
                        <div className="space-y-0 border-l-2 border-gray-200 ml-2 pl-4">
                           {itinerarioSeleccionado.actividades?.length > 0 ? (
                              itinerarioSeleccionado.actividades.map((act: any, idx: number) => (
                                 <div key={idx} className="relative pb-6 last:pb-0">
                                    <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-white"></div>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                       {/* Nombre de la Parada */}
                                       <h5 className="text-sm font-semibold text-gray-900">
                                          {act.lugarDetalle?.nombre || act.titulo || act.nombre || `Parada ${idx + 1}`}
                                       </h5>
                                       
                                       {/* Detalles del Lugar si existen */}
                                       {act.lugarDetalle ? (
                                          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                             <div className="grid grid-cols-2 gap-2">
                                                {act.lugarDetalle.categoria && (
                                                   <div className="text-xs">
                                                      <span className="font-semibold text-gray-700">Categoría:</span>
                                                      <p className="text-gray-600">{act.lugarDetalle.categoria}</p>
                                                   </div>
                                                )}
                                                {act.lugarDetalle.mexican_state && (
                                                   <div className="text-xs">
                                                      <span className="font-semibold text-gray-700">Estado:</span>
                                                      <p className="text-gray-600">{act.lugarDetalle.mexican_state}</p>
                                                   </div>
                                                )}
                                                {act.lugarDetalle.google_score && (
                                                   <div className="text-xs">
                                                      <span className="font-semibold text-gray-700">Calificación:</span>
                                                      <p className="text-yellow-600">★ {act.lugarDetalle.google_score}</p>
                                                   </div>
                                                )}
                                                {act.lugarDetalle.total_reviews && (
                                                   <div className="text-xs">
                                                      <span className="font-semibold text-gray-700">Reseñas:</span>
                                                      <p className="text-gray-600">{act.lugarDetalle.total_reviews}</p>
                                                   </div>
                                                )}
                                             </div>
                                             {act.lugarDetalle.descripcion && (
                                                <p className="text-xs text-gray-600 line-clamp-2 mt-2">{act.lugarDetalle.descripcion}</p>
                                             )}
                                             {(act.lugarDetalle.latitud || act.lugarDetalle.longitud) && (
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                                                   <MapPin size={12} />
                                                   {act.lugarDetalle.latitud?.toFixed(4)}, {act.lugarDetalle.longitud?.toFixed(4)}
                                                </p>
                                             )}
                                          </div>
                                       ) : (
                                          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                             {act.descripcion && (
                                                <p className="text-xs text-gray-600">{act.descripcion}</p>
                                             )}
                                             {act.fecha && (
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                   <Calendar size={12} />
                                                   {new Date(act.fecha).toLocaleDateString('es-MX')}
                                                </p>
                                             )}
                                             {!act.descripcion && !act.fecha && (
                                                <p className="text-xs text-gray-400 italic">Sin detalles adicionales</p>
                                             )}
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              ))
                           ) : (
                              <p className="text-sm text-gray-400 italic">No hay paradas registradas.</p>
                           )}
                        </div>
                     </div>
                  </div>

               </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
               <button 
                  onClick={cerrarModal}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
               >
                  Cerrar
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmDialog.onConfirm?.();
                setConfirmDialog({ ...confirmDialog, open: false });
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}