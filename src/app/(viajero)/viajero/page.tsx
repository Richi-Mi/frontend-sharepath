"use client";

import { useState, useEffect, useCallback } from "react";
import PublicacionItem from "@/components/viajero/PublicacionItem";
import { Button } from "@/components/ui/button";
import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import type { Publicacion } from "@/api/interfaces/ApiRoutes";
import { Loader2, MapPin, Compass, SearchX, RefreshCw, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ViajeroLanding() {
  const [query, setQuery] = useState("");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("todos");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [todasLasPublicaciones, setTodasLasPublicaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Transformar publicación con información de reseñas
  const transformarPublicacion = async (pub: Publicacion): Promise<any> => {
    try {
      const api = ItinerariosAPI.getInstance();
      let calificacionPromedio = 0;
      let totalResenas = 0;
      
      // Obtener reseñas para calcular calificación
      try {
        const resenas = await api.getResenasByPublicacion(pub.id);
        if (resenas && resenas.length > 0) {
          const sumaCalificaciones = resenas.reduce((sum, resena) => sum + resena.score, 0);
          calificacionPromedio = parseFloat((sumaCalificaciones / resenas.length).toFixed(1));
          totalResenas = resenas.length;
        }
      } catch (err) {
        console.log("No se pudieron cargar las reseñas, usando valor por defecto");
      }

      // Extraer ubicación del itinerario o usar placeholder
      let ubicacion = "México";
      if (pub.itinerario && pub.itinerario.ubicacion) {
        ubicacion = pub.itinerario.ubicacion;
      } else if (pub.descripcion) {
        // Intentar extraer ubicación de la descripción
        const ubicacionesMexico = [
          "Ciudad de México", "CDMX", "Guadalajara", "Monterrey", "Cancún", 
          "Playa del Carmen", "Tulum", "Oaxaca", "Puebla", "Querétaro",
          "Mérida", "Los Cabos", "Puerto Vallarta", "San Miguel de Allende"
        ];
        
        for (const loc of ubicacionesMexico) {
          if (pub.descripcion.toLowerCase().includes(loc.toLowerCase())) {
            ubicacion = loc;
            break;
          }
        }
      }

      // Extraer categorías/tags del título o descripción
      const tags = [] as any;
      const categorias = ["playa", "montaña", "ciudad", "aventura", "cultural", "gastronómico", "romántico"];
      
      categorias.forEach(cat => {
        if (pub.itinerario && pub.itinerario.title &&
          pub.itinerario.title.toLowerCase().includes(cat) ||
          (pub.descripcion && pub.descripcion.toLowerCase().includes(cat))
        ) {
          tags.push(cat.charAt(0).toUpperCase() + cat.slice(1));
        }
      });

      return {
        id: pub.id,
        titulo: pub.itinerario?.title,
        calificacion: calificacionPromedio || 0,
        totalResenas,
        usuario: {
          nombre: pub.user_shared?.username || "Viajero Anónimo",
          fotoPerfil: pub.user_shared?.foto_url || "",
          nombre_completo: pub.user_shared?.nombre_completo,
        },
        descripcion: pub.descripcion,
        itinerarioId: pub.itinerario?.id,
        itinerario: pub.fotos
          ? pub.fotos.map((foto) => ({
              id: foto.id,
              url: foto.foto_url,
              alt: `Imagen del itinerario ${pub.itinerario?.title}`,
            }))
          : [],
        fecha: new Date(pub.created_at || Date.now()).toLocaleDateString(),
        ubicacion,
        tags: tags.length > 0 ? tags : ["Aventura", "Viaje"],
        categoria: tags[0]?.toLowerCase() || "aventura",
      };
    } catch (err) {
      console.error("Error transformando publicación:", err);
      return null;
    }
  };

  // Función para mezclar array aleatoriamente (Fisher-Yates shuffle)
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const cargarPublicaciones = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setCargando(true);
      }
      
      setError(null);
      const api = ItinerariosAPI.getInstance();
      
      // Llamar a la API sin parámetros de paginación
      const data = await api.getMyPublications();

      if (data && Array.isArray(data)) {
        // Transformar cada publicación con reseñas
        const transformPromises = data.map(transformarPublicacion);
        let publicacionesTransformadas = (await Promise.all(transformPromises)).filter(p => p !== null);
        
        // Mezclar las publicaciones para mostrar diferentes cada vez
        publicacionesTransformadas = shuffleArray(publicacionesTransformadas);
        
        // Si estamos refrescando, limitar a 12 para no sobrecargar
        if (refresh && publicacionesTransformadas.length > 12) {
          publicacionesTransformadas = publicacionesTransformadas.slice(0, 12);
        }
        
        setPublicaciones(publicacionesTransformadas);
        setTodasLasPublicaciones(publicacionesTransformadas);
      } else {
        setPublicaciones([]);
        setTodasLasPublicaciones([]);
      }
    } catch (err) {
      console.error(err);
      setError("No pudimos conectar con el servidor de viajes.");
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarPublicaciones(false);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleEstadoChange = (value: string) => {
    setEstadoSeleccionado(value);
  };

  const handleCategoriaChange = (value: string) => {
    setCategoriaSeleccionada(value);
  };

  const handleRefresh = () => {
    cargarPublicaciones(true);
  };

  // Aplicar todos los filtros
  const publicacionesFiltradas = todasLasPublicaciones.filter((publicacion) => {
    if (!publicacion) return false;
    
    // Filtro por búsqueda de texto
    const coincideTexto =
      query === "" ||
      publicacion.usuario.nombre.toLowerCase().includes(query.toLowerCase()) ||
      publicacion.titulo.toLowerCase().includes(query.toLowerCase()) ||
      publicacion.descripcion?.toLowerCase().includes(query.toLowerCase()) ||
      publicacion.tags?.some((tag: string) => 
        tag.toLowerCase().includes(query.toLowerCase())
      ) ||
      false;

    // Filtro por estado/ubicación
    const coincideEstado =
      estadoSeleccionado === "todos" || 
      publicacion.ubicacion?.toLowerCase().includes(estadoSeleccionado.toLowerCase());

    // Filtro por categoría
    const coincideCategoria =
      categoriaSeleccionada === "todas" || 
      publicacion.categoria === categoriaSeleccionada;

    return coincideTexto && coincideEstado && coincideCategoria;
  });

  const resultadosCount = publicacionesFiltradas.length;
  const hayFiltrosActivos = query !== "" || estadoSeleccionado !== "todos" || categoriaSeleccionada !== "todas";

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/5 to-background pb-20">
      {/* --- HERO SECTION --- */}
      <div className="relative bg-background border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 opacity-60" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20 text-center md:text-left">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-6 backdrop-blur-sm">
              <Compass className="mr-2 h-4 w-4" /> Comunidad de Viajeros
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground mb-4">
              Inspírate con <span className="text-primary">rutas reales</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Descubre itinerarios creados por expertos locales y viajeros apasionados. 
              Encuentra tu próxima aventura entre {todasLasPublicaciones.length} publicaciones.
            </p>
            
            {/* Botón de refresh */}
            <Button 
              onClick={handleRefresh} 
              variant="default" 
              className="rounded-full px-8"
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Descubrir nuevas rutas
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-10">
        {/* --- BARRA DE BÚSQUEDA Y FILTROS --- */}
        <div className="mb-8 bg-background rounded-2xl border border-border/50 shadow-lg p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar por destino, usuario o palabra clave..."
                  value={query}
                  onChange={handleSearchChange}
                  className="pl-10 h-12 rounded-xl"
                />
                <SearchX className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Contador y filtros activos */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {hayFiltrosActivos ? (
                  <>
                    <span className="font-medium text-foreground">{resultadosCount}</span>{" "}
                    resultado{resultadosCount !== 1 ? "s" : ""} de{" "}
                    <span className="font-medium text-foreground">{todasLasPublicaciones.length}</span>{" "}
                    publicaciones
                  </>
                ) : (
                  <>
                    <span className="font-medium text-foreground">{todasLasPublicaciones.length}</span>{" "}
                    publicaciones disponibles
                  </>
                )}
              </span>
            </div>

            {hayFiltrosActivos && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setEstadoSeleccionado("todos");
                  setCategoriaSeleccionada("todas");
                }}
                className="h-8"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>

        {/* --- GRID DE CONTENIDO --- */}
        {error ? (
          <ErrorState 
            message={error} 
            onRetry={() => cargarPublicaciones(false)} 
          />
        ) : cargando ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : resultadosCount > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8 auto-rows-fr">
              {publicacionesFiltradas.map((p, index) => (
                <PublicacionItem 
                  key={`${p.id}-${p.fecha}-${index}`} 
                  publicacion={p} 
                />
              ))}
            </div>
            
            {/* Sugerencia para ver más */}
            {publicacionesFiltradas.length < todasLasPublicaciones.length && (
              <div className="mt-12 text-center">
                <p className="text-muted-foreground mb-4">
                  ¿Quieres ver más publicaciones? Intenta con otros filtros o limpia la búsqueda.
                </p>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Mezclar publicaciones
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            hasFilters={hayFiltrosActivos}
            onReset={() => {
              setQuery("");
              setEstadoSeleccionado("todos");
              setCategoriaSeleccionada("todas");
            }}
            onRetry={() => cargarPublicaciones(false)}
            totalPublicaciones={todasLasPublicaciones.length}
          />
        )}
      </div>
    </div>
  );
}

// Subcomponentes actualizados
function CardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 animate-pulse">
      <div className="h-[250px] w-full rounded-xl bg-muted" />
      <div className="space-y-2 px-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="h-4 w-1/2 bg-muted rounded" />
      </div>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onReset,
  onRetry,
  totalPublicaciones,
}: {
  hasFilters: boolean;
  onReset: () => void;
  onRetry: () => void;
  totalPublicaciones: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-muted rounded-3xl bg-muted/10">
      <div className="bg-background p-6 rounded-full shadow-sm mb-6">
        <Compass className="h-16 w-16 text-muted-foreground" />
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-2">
        {hasFilters ? "No hay coincidencias" : "No hay publicaciones aún"}
      </h3>
      <p className="text-muted-foreground max-w-md mb-6">
        {hasFilters
          ? "No encontramos publicaciones con esos filtros. Intenta con otros términos."
          : totalPublicaciones === 0 
            ? "Aún no hay publicaciones disponibles. Intenta recargar más tarde."
            : "¡Excelente! Has visto todas las publicaciones disponibles."}
      </p>
      <div className="flex gap-3">
        {hasFilters ? (
          <Button onClick={onReset} variant="default" className="rounded-full">
            Limpiar filtros
          </Button>
        ) : (
          <Button onClick={onRetry} variant="default" className="rounded-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Buscar nuevas publicaciones
          </Button>
        )}
      </div>
    </div>
  );
}

function ErrorState({ 
  message, 
  onRetry 
}: { 
  message: string; 
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-800">
      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-4">
        <MapPin className="h-10 w-10" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">Error de conexión</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      <div className="flex gap-3">
        <Button onClick={onRetry} variant="default">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
        >
          Recargar página
        </Button>
      </div>
    </div>
  );
}
