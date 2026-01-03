"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Toaster, toast } from "sonner";
import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import { LugarData } from "@/api/interfaces/ApiRoutes";
import { getCategoryName, getDefaultImageForCategory } from "@/lib/category-utils";
import { 
    Search, 
    Filter, 
    Plus, 
    Trash2, 
    MapPin, 
    Star, 
    Loader2, 
    MoreHorizontal,
    Navigation
} from "lucide-react"; // Usamos Lucide para consistencia

// Import dinámico del nuevo mapa
const MiniMap = dynamic(() => import("@/components/MiniMap"), { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded-xl" />
});

// Componente de Estrellas Moderno
const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        <span className="text-xs font-bold text-amber-700">{rating.toFixed(1)}</span>
    </div>
);

const CATEGORIAS = [
    "amusement_park", "bowling_alley", "casino", "movie_theater", "night_club", 
    "stadium", "aquarium", "campground", "park", "zoo", "art_gallery", 
    "library", "museum", "tourist_attraction", "bar", "cafe", "restaurant", 
    "beauty_salon", "spa"
];

const ESTADOS_MEXICO = ["Ciudad de Mexico", "Estado de Mexico", "Querétaro", "Hidalgo", "Morelos"];

export default function LugaresPage() {
    // --- Estados (Lógica Original Intacta) ---
    const [allPlaces, setAllPlaces] = useState<LugarData[]>([]); 
    const [places, setPlaces] = useState<LugarData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedState, setSelectedState] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [placeToDelete, setPlaceToDelete] = useState<LugarData | null>(null);
    const ITEMS_PER_PAGE = 9; // Reduje a 9 para mejor grilla 3x3

    const [formData, setFormData] = useState({
        id_api_place: "", nombre: "", descripcion: "", category: "", mexican_state: "",
        foto_url: "", google_maps_url: "", latitud: 0, longitud: 0, google_score: 0, total_reviews: 0,
    });

    const api = useMemo(() => ItinerariosAPI.getInstance(), []);

    // --- Helpers ---
    const extractCoordinatesFromGoogleMaps = (url: string) => {
        try {
            const pattern1 = /@([-\d.]+),([-\d.]+),/;
            const match1 = url.match(pattern1);
            if (match1) return { lat: parseFloat(match1[1]), lng: parseFloat(match1[2]) };
            const pattern2 = /[?&]q=([-\d.]+),([-\d.]+)/;
            const match2 = url.match(pattern2);
            if (match2) return { lat: parseFloat(match2[1]), lng: parseFloat(match2[2]) };
            const pattern3 = /place\/(.*?)\/([-\d.]+),([-\d.]+)/;
            const match3 = url.match(pattern3);
            if (match3) return { lat: parseFloat(match3[2]), lng: parseFloat(match3[3]) };
            return null;
        } catch { return null; }
    };

    const handleGoogleMapsLink = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setFormData({ ...formData, google_maps_url: url });
        const coords = extractCoordinatesFromGoogleMaps(url);
        if (coords) setFormData(prev => ({ ...prev, latitud: coords.lat, longitud: coords.lng }));
    };

    const loadAllPlaces = async () => {
        setLoading(true);
        try {
            const response = await api.getLugares(1, 10000, selectedState || undefined, selectedCategory || undefined, searchTerm || undefined);
            const lugaresArray = Array.isArray(response) ? response : (response.lugares || []);
            setAllPlaces(lugaresArray);
            paginateClientSide(lugaresArray, 1);
        } catch (error) {
            console.error(error);
            setAllPlaces([]); setPlaces([]);
        } finally {
            setLoading(false);
        }
    };

    const paginateClientSide = (data: LugarData[], page: number) => {
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        setPlaces(data.slice(startIndex, startIndex + ITEMS_PER_PAGE));
        setCurrentPage(page);
    };

    useEffect(() => { loadAllPlaces(); }, [searchTerm, selectedCategory, selectedState]);

    const handlePageChange = (newPage: number) => {
        paginateClientSide(allPlaces, newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const totalPages = Math.ceil(allPlaces.length / ITEMS_PER_PAGE);

    // Acciones de Borrado y Creación (Lógica Original simplificada visualmente)
    const handleDeleteClick = (place: LugarData) => { setPlaceToDelete(place); setDeleteConfirmOpen(true); };
    const handleDeleteConfirm = async () => {
        if (!placeToDelete) return;
        setDeleting(placeToDelete.id_api_place);
        setDeleteConfirmOpen(false);
        try {
            await api.deleteLugar(placeToDelete.id_api_place);
            const updated = allPlaces.filter(p => p.id_api_place !== placeToDelete.id_api_place);
            setAllPlaces(updated);
            paginateClientSide(updated, currentPage);
            toast.success("Lugar eliminado correctamente");
        } catch (error) { toast.error("No se pudo eliminar el lugar"); }
        finally { setDeleting(null); setPlaceToDelete(null); }
    };

    const handleCreatePlace = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = formData.id_api_place || `lugar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (!formData.nombre || !formData.google_maps_url || formData.latitud === 0) {
            toast.error('Verifica los campos obligatorios y coordenadas'); return;
        }
        try {
            const newPlace = await api.createLugar({ ...formData, id_api_place: id });
            setAllPlaces(prev => [newPlace, ...prev]);
            paginateClientSide([newPlace, ...allPlaces], 1);
            setIsModalOpen(false);
            setFormData({ id_api_place: "", nombre: "", descripcion: "", category: "", mexican_state: "", foto_url: "", google_maps_url: "", latitud: 0, longitud: 0, google_score: 0, total_reviews: 0 });
            toast.success("Lugar creado exitosamente");
        } catch { toast.error("Error al crear lugar"); }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
            <Toaster position="top-right" richColors theme="light" />
            
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Directorio de Lugares</h1>
                        <p className="text-gray-500 mt-2 text-sm">Gestiona los puntos de interés mostrados en los mapas de itinerarios.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 hover:shadow-indigo-300 active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" /> Nuevo Lugar
                    </button>
                </div>

                {/* Filters Toolbar */}
                <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar lugares..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm text-gray-900 placeholder:text-gray-400"
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <option value="">Categoría</option>
                                {CATEGORIAS.map(c => <option key={c} value={c}>{getCategoryName(c)}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                value={selectedState}
                                onChange={(e) => setSelectedState(e.target.value)}
                                className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <option value="">Estado</option>
                                {ESTADOS_MEXICO.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                        <p className="text-gray-500 font-medium">Cargando mapa global...</p>
                    </div>
                ) : places.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No se encontraron lugares</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mt-1">Intenta ajustar los filtros de búsqueda o agrega un nuevo lugar al sistema.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {places.map((place) => (
                            <div key={place.id_api_place} className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full hover:border-indigo-100">
                                {/* Header Image & Badges */}
                                <div className="relative h-48 w-full overflow-hidden">
                                    <Image
                                        src={place.foto_url || getDefaultImageForCategory(place.category)}
                                        alt={place.nombre}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-xs font-bold px-2.5 py-1 rounded-full text-gray-800 uppercase tracking-wide">
                                        {getCategoryName(place.category)}
                                    </div>
                                    <div className="absolute bottom-3 left-3 right-3 text-white">
                                        <h3 className="text-lg font-bold leading-tight line-clamp-1">{place.nombre}</h3>
                                        <p className="text-xs text-gray-200 flex items-center mt-1">
                                            <Navigation className="w-3 h-3 mr-1" />
                                            {place.mexican_state}
                                        </p>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-4 flex flex-col flex-grow gap-4">
                                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                        {place.descripcion || "Sin descripción disponible."}
                                    </p>
                                    
                                    <div className="flex items-center justify-between mt-auto">
                                        <StarRating rating={place.google_score} />
                                        <span className="text-xs text-gray-400 font-medium">{place.total_reviews} reseñas</span>
                                    </div>

                                    {/* --- MAPA INTEGRADO Y REFINADO --- */}
                                    <div className="h-40 w-full rounded-xl overflow-hidden border border-gray-100 shadow-inner relative isolate z-0 bg-gray-50">
                                        <MiniMap 
                                            lat={place.latitud} 
                                            lng={place.longitud} 
                                            title={place.nombre} 
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-2 border-t border-gray-100 flex justify-end">
                                        <button
                                            onClick={() => handleDeleteClick(place)}
                                            disabled={deleting === place.id_api_place}
                                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors text-sm font-medium flex items-center"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            {deleting === place.id_api_place ? "Borrando..." : "Eliminar"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex justify-center pt-8 pb-4">
                        <nav className="flex gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-50">Anterior</button>
                            <span className="px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-lg">{currentPage} / {totalPages}</span>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-50">Siguiente</button>
                        </nav>
                    </div>
                )}
            </div>

            {/* Modals (Create & Delete) - Mantenidos funcionales pero con estilo básico */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-6 text-gray-900">Agregar Nuevo Lugar</h2>
                        <form onSubmit={handleCreatePlace} className="space-y-4">
                            {/* Nombre */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Nombre *</label>
                                <input 
                                    required 
                                    className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                                    value={formData.nombre} 
                                    onChange={e => setFormData({...formData, nombre: e.target.value})} 
                                    placeholder="Nombre del lugar"
                                />
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Descripción</label>
                                <textarea 
                                    className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" 
                                    rows={3}
                                    value={formData.descripcion} 
                                    onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                                    placeholder="Descripción del lugar"
                                />
                            </div>

                            {/* Categoría y Estado */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Categoría *</label>
                                    <select 
                                        required
                                        className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                                        value={formData.category} 
                                        onChange={e => setFormData({...formData, category: e.target.value})}
                                    >
                                        <option value="">Seleccionar categoría</option>
                                        {CATEGORIAS.map(c => <option key={c} value={c}>{getCategoryName(c)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Estado *</label>
                                    <select 
                                        required
                                        className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                                        value={formData.mexican_state} 
                                        onChange={e => setFormData({...formData, mexican_state: e.target.value})}
                                    >
                                        <option value="">Seleccionar estado</option>
                                        {ESTADOS_MEXICO.map(e => <option key={e} value={e}>{e}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* URL de Imagen */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">URL de Imagen *</label>
                                <input 
                                    required
                                    type="url"
                                    className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                                    value={formData.foto_url} 
                                    onChange={e => setFormData({...formData, foto_url: e.target.value})} 
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                />
                                {formData.foto_url && (
                                    <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 h-32">
                                        <Image 
                                            src={formData.foto_url} 
                                            alt="Preview" 
                                            width={300} 
                                            height={128}
                                            className="w-full h-full object-cover"
                                            onError={() => toast.error("No se pudo cargar la imagen")}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Google Maps URL */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Google Maps URL *</label>
                                <input 
                                    required
                                    className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                                    value={formData.google_maps_url} 
                                    onChange={handleGoogleMapsLink} 
                                    placeholder="https://maps.google.com/?q=..."
                                />
                                {(formData.latitud !== 0 || formData.longitud !== 0) && (
                                    <p className="text-xs text-green-600 mt-1">✓ Coordenadas extraídas: {formData.latitud.toFixed(4)}, {formData.longitud.toFixed(4)}</p>
                                )}
                            </div>

                            {/* Latitud y Longitud Manual */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Latitud *</label>
                                    <input 
                                        required
                                        type="number"
                                        step="0.0001"
                                        className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                                        value={formData.latitud} 
                                        onChange={e => setFormData({...formData, latitud: parseFloat(e.target.value) || 0})} 
                                        placeholder="0.0000"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Longitud *</label>
                                    <input 
                                        required
                                        type="number"
                                        step="0.0001"
                                        className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                                        value={formData.longitud} 
                                        onChange={e => setFormData({...formData, longitud: parseFloat(e.target.value) || 0})} 
                                        placeholder="0.0000"
                                    />
                                </div>
                            </div>

                            {/* Calificación y Reseñas */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Calificación Google</label>
                                    <input 
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="5"
                                        className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                                        value={formData.google_score} 
                                        onChange={e => setFormData({...formData, google_score: parseFloat(e.target.value) || 0})} 
                                        placeholder="0.0"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Total de Reseñas</label>
                                    <input 
                                        type="number"
                                        min="0"
                                        className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                                        value={formData.total_reviews} 
                                        onChange={e => setFormData({...formData, total_reviews: parseInt(e.target.value) || 0})} 
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* ID Auto-generado */}
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p className="text-xs font-bold text-gray-500 uppercase">ID de la API (Auto-generado)</p>
                                <p className="text-sm text-gray-700 mt-1 font-mono">Se generará automáticamente al guardar</p>
                            </div>

                            {/* Botones */}
                             <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setFormData({ id_api_place: "", nombre: "", descripcion: "", category: "", mexican_state: "", foto_url: "", google_maps_url: "", latitud: 0, longitud: 0, google_score: 0, total_reviews: 0 });
                                    }} 
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm shadow-indigo-200"
                                >
                                    Guardar Lugar
                                </button>
                             </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirmOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600"><Trash2 /></div>
                        <h3 className="text-lg font-bold text-gray-900">¿Eliminar lugar?</h3>
                        <p className="text-gray-500 mt-2 mb-6 text-sm">Esta acción eliminará <strong>{placeToDelete?.nombre}</strong> permanentemente de la base de datos.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirmOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                            <button onClick={handleDeleteConfirm} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 shadow-lg shadow-red-200">Si, eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}