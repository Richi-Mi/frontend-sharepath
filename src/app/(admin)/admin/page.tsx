"use client";

import { useState, useEffect } from "react";
import {
    Users,
    MapPin,
    TrendingUp,
    AlertTriangle,
    Route,
    Calendar,
    ArrowUpRight,
    Star,
    Map,
    Activity,
    Info
} from "lucide-react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    TooltipProps
} from "recharts";
import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import type { DashboardStatsResponse, Reporte } from "@/api/interfaces/ApiRoutes";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// --- Tipos y Datos Mock ---

type LugarCard = {
    id: number | string;
    nombre: string;
    visitas: number;
    calificacion: number;
    imagen: string;
    descripcion: string;
    categoria?: string;
    estado?: string;
    latitud?: number;
    longitud?: number;
};

// Generar datos solo de noviembre a diciembre (inicio del sistema)
const generarDatosNoviembreADiciembre = (totalUsuarios: number) => {
    return [
        { mes: "Nov", usuarios: 0 },
        { mes: "Dic", usuarios: totalUsuarios }
    ];
};

const destinosPopulares: LugarCard[] = [
    {
        id: 1, nombre: "Teotihuacán", visitas: 1250, calificacion: 4.8,
        imagen: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&q=80&w=1000",
        descripcion: "Zona arqueológica con pirámides del Sol y la Luna", categoria: "Arqueológico", estado: "Estado de México",
    },
    {
        id: 2, nombre: "Chapultepec", visitas: 2100, calificacion: 4.6,
        imagen: "https://images.unsplash.com/photo-1585464231875-d9cae93555ce?auto=format&fit=crop&q=80&w=1000",
        descripcion: "Parque urbano más grande de América", categoria: "Parque", estado: "Ciudad de México",
    },
    {
        id: 3, nombre: "Centro Histórico", visitas: 1850, calificacion: 4.9,
        imagen: "https://images.unsplash.com/photo-1565671192534-7db3dfa2f431?auto=format&fit=crop&q=80&w=1000",
        descripcion: "Patrimonio de la Humanidad UNESCO", categoria: "Cultural", estado: "Ciudad de México",
    },
    {
        id: 4, nombre: "Xochimilco", visitas: 980, calificacion: 4.5,
        imagen: "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&q=80&w=1000",
        descripcion: "Canales tradicionales y trajineras", categoria: "Natural", estado: "Ciudad de México",
    },
];

// Componente Custom Tooltip para la gráfica
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
                <p className="text-sm font-bold text-gray-900 mb-1">{label}</p>
                <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                    <Users className="h-3 w-3" />
                    <span>{payload[0].value} Usuarios</span>
                </div>
            </div>
        );
    }
    return null;
};

// --- Componente Principal ---

export default function DashboardAdmin() {
    const [destinoSeleccionado, setDestinoSeleccionado] = useState<null | LugarCard>(null);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [statsData, setStatsData] = useState<DashboardStatsResponse | null>(null);
    const [reportes, setReportes] = useState<Reporte[]>([]);
    const [lugares, setLugares] = useState<LugarCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [saludo, setSaludo] = useState("");
    const [datosGrafica, setDatosGrafica] = useState<{mes: string, usuarios: number}[]>([]);

    const api = ItinerariosAPI.getInstance();

    useEffect(() => {
        // Determinar saludo según la hora
        const hour = new Date().getHours();
        if (hour < 12) setSaludo("Buenos días");
        else if (hour < 18) setSaludo("Buenas tardes");
        else setSaludo("Buenas noches");

        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Cargar estadísticas
                try {
                    const stats = await api.getAdminStats();
                    setStatsData(stats);
                    // Generar datos de la gráfica: nov (0) -> dic (total real)
                    const datosMensuales = generarDatosNoviembreADiciembre(stats.usuarios.total);
                    setDatosGrafica(datosMensuales);
                } catch (e) { 
                    console.warn("Error stats", e);
                    // Si falla, usar datos por defecto
                    setDatosGrafica(generarDatosNoviembreADiciembre(27));
                }
            
                // Cargar reportes
                try {
                    const reportesData = await api.getReports();
                    setReportes(reportesData);
                } catch (e) { console.warn("Error reportes", e); }

                // Cargar lugares recomendados
                try {
                    const recs = await api.getRecommendations({ limit: 8 });
                    const lugaresData = Array.isArray(recs) ? recs : [];
                    const mejoresLugares = [...lugaresData]
                        .sort((a: any, b: any) => (parseFloat(b.google_score) || 0) - (parseFloat(a.google_score) || 0))
                        .slice(0, 4);

                    const lugaresFormateados: LugarCard[] = mejoresLugares.map((lugar: any) => ({
                        id: lugar.id_api_place || Math.random(),
                        nombre: lugar.nombre,
                        visitas: lugar.total_reviews || 0,
                        calificacion: parseFloat(lugar.google_score) || 4.5,
                        imagen: lugar.foto_url,
                        descripcion: lugar.descripcion || lugar.category || "Destino turístico",
                        categoria: lugar.category,
                        estado: lugar.mexican_state,
                        latitud: lugar.latitud,
                        longitud: lugar.longitud,
                    }));
                    setLugares(lugaresFormateados.length > 0 ? lugaresFormateados : destinosPopulares);
                } catch (e) {
                     console.warn("Error lugares", e);
                     setLugares(destinosPopulares);
                }
            } catch (error) {
                console.error("Error general dashboard", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const usuariosActuales = statsData?.usuarios.total || 0;
    const crecimientoMensual = statsData?.usuarios.crecimiento || "0%";

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                     <div className="h-12 w-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                     <p className="text-gray-500 font-medium">Cargando tu panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                
                {/* 1. Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            {saludo}, Administrador
                        </h1>
                        <p className="text-gray-500 mt-2 flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4" />
                            {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex gap-3">
                         <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 text-sm font-medium text-gray-600">
                             <span className="relative flex h-2.5 w-2.5 mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                            Sistema Operativo
                         </div>
                    </div>
                </div>

                {/* 2. KPI Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Usuarios */}
                    <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Total Usuarios</CardTitle>
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Users className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{usuariosActuales}</div>
                            <div className="flex items-center text-xs mt-1 text-green-600 font-medium">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                +{crecimientoMensual} vs mes anterior
                            </div>
                        </CardContent>
                    </Card>

                    {/* Itinerarios */}
                    <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Itinerarios Activos</CardTitle>
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                <Route className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{statsData?.metricasGenerales.totalItinerarios ?? 0}</div>
                            <p className="text-xs text-gray-500 mt-1">Rutas compartidas por usuarios</p>
                        </CardContent>
                    </Card>

                    {/* Lugares */}
                    <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Destinos</CardTitle>
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                <MapPin className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{statsData?.metricasGenerales.totalLugares ?? 0}</div>
                            <p className="text-xs text-gray-500 mt-1">Puntos de interés registrados</p>
                        </CardContent>
                    </Card>

                    {/* Reportes (Alerta) */}
                    <Card className="border-orange-200 bg-orange-50/30 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-orange-700">Reportes Pendientes</CardTitle>
                            <div className="p-2 bg-white rounded-lg text-orange-600 shadow-sm border border-orange-100">
                                <AlertTriangle className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-700">{statsData?.metricasGenerales.reportesPendientes ?? 0}</div>
                            <p className="text-xs text-orange-600/80 mt-1 font-medium">Requieren atención inmediata</p>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. Main Chart & Secondary Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Columna Izquierda: Gráfica (Ocupa 2/3) */}
                    <Card className="lg:col-span-2 border-gray-200 shadow-sm">
                        <CardHeader className="border-b border-gray-50 bg-gray-50/30 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-indigo-500" />
                                        Crecimiento de Usuarios
                                    </CardTitle>
                                    <CardDescription>
                                        Desde el lanzamiento del sistema (Noviembre 2025)
                                    </CardDescription>
                                </div>
                                <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                                    +{crecimientoMensual}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 pl-0">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={datosGrafica} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorU" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis 
                                            dataKey="mes" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#6b7280', fontSize: 12 }} 
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#6b7280', fontSize: 12 }} 
                                        />
                                        <CartesianGrid vertical={false} stroke="#f3f4f6" />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                        <Area 
                                            type="monotone" 
                                            dataKey="usuarios" 
                                            stroke="#4f46e5" 
                                            strokeWidth={3} 
                                            fillOpacity={1} 
                                            fill="url(#colorU)" 
                                            activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Columna Derecha: Resumen Rápido */}
                    <div className="space-y-6">
                        <Card className="border-gray-200 shadow-sm h-full flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-gray-900">Estado del Sistema</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-gray-600">Servidor API</span>
                                        <span className="text-green-600">En línea</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-[98%] rounded-full"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-gray-600">Base de Datos</span>
                                        <span className="text-green-600">Estable</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-[100%] rounded-full"></div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-100">
                                    <h4 className="text-sm font-bold text-gray-900 mb-3">Última Actividad</h4>
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex gap-3 items-start">
                                                <div className="h-2 w-2 mt-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                                                <p className="text-xs text-gray-500">
                                                    Nuevo usuario registrado desde Ciudad de México <span className="text-gray-300 mx-1">•</span> Hace {i * 5} min
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* 4. Destinos Populares Grid */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                         <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-rose-500" />
                            Destinos en Tendencia
                         </h2>
                         <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                            Ver todos los lugares <ArrowUpRight className="ml-1 h-4 w-4" />
                         </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {(lugares.length > 0 ? lugares : destinosPopulares).map((destino) => (
                            <div 
                                key={destino.id}
                                onClick={() => { setDestinoSeleccionado(destino); setModalAbierto(true); }}
                                className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden h-[300px] flex flex-col"
                            >
                                <div className="h-[180px] w-full relative overflow-hidden">
                                    <div className="absolute top-3 left-3 z-10">
                                        <Badge className="bg-white/90 text-gray-900 hover:bg-white backdrop-blur-sm shadow-sm border-0 font-bold">
                                            {destino.calificacion} ★
                                        </Badge>
                                    </div>
                                    <img
                                        src={destino.imagen}
                                        alt={destino.nombre}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x225?text=Sin+Imagen"; }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                                </div>
                                
                                <div className="p-4 flex flex-col flex-1 justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                            {destino.nombre}
                                        </h3>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 mb-2">
                                            <MapPin className="h-3 w-3" />
                                            {destino.estado || "México"}
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                            {destino.descripcion}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. Modal Detalle Destino */}
                {modalAbierto && destinoSeleccionado && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { setModalAbierto(false); setDestinoSeleccionado(null); }}}>
                        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
                        
                        <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            
                            {/* Imagen Header */}
                            <div className="relative h-56 w-full">
                                <img
                                    src={destinoSeleccionado.imagen}
                                    alt={destinoSeleccionado.nombre}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                <Button 
                                    size="icon" 
                                    variant="secondary" 
                                    className="absolute top-4 right-4 rounded-full bg-white/20 hover:bg-white/40 text-white border-0 backdrop-blur-md"
                                    onClick={() => { setModalAbierto(false); setDestinoSeleccionado(null); }}
                                >
                                    <span className="sr-only">Cerrar</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </Button>
                                <div className="absolute bottom-4 left-6 text-white">
                                    <Badge className="bg-indigo-500 hover:bg-indigo-600 border-0 mb-2">{destinoSeleccionado.categoria || "Turismo"}</Badge>
                                    <h2 className="text-2xl font-bold">{destinoSeleccionado.nombre}</h2>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Stats Row */}
                                <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex flex-col items-center flex-1 border-r border-gray-200 last:border-0">
                                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Calificación</span>
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="text-xl font-bold text-gray-900">{destinoSeleccionado.calificacion}</span>
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center flex-1">
                                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Popularidad</span>
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="text-xl font-bold text-gray-900">{destinoSeleccionado.visitas.toLocaleString()}</span>
                                            <Users className="h-4 w-4 text-indigo-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <Info className="h-4 w-4 text-gray-400" /> 
                                        Acerca del lugar
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {destinoSeleccionado.descripcion}
                                    </p>
                                </div>

                                {/* Ubicación */}
                                <div className="space-y-2">
                                     <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <Map className="h-4 w-4 text-gray-400" /> 
                                        Ubicación
                                    </h4>
                                    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                                        <span className="text-sm font-medium text-gray-700">{destinoSeleccionado.estado || "Ubicación general"}</span>
                                        {destinoSeleccionado.latitud && (
                                            <Badge variant="outline" className="text-xs font-mono text-gray-500 bg-white">
                                                {destinoSeleccionado.latitud.toFixed(4)}, {destinoSeleccionado.longitud?.toFixed(4)}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}