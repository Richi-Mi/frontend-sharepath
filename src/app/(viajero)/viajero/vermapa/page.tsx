'use client';

// Importamos useState, useMemo. Ya no necesitamos useEffect aquí.
import { useState, useMemo } from 'react';
import { CirclePlus } from 'lucide-react';
// 1. Volvemos a las importaciones locales de NPM
// Esto funcionará DESPUÉS de que ejecutes: npm install leaflet react-leaflet leaflet-defaulticon-compatibility
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import {Button} from '@/components/ui/button';

// 2. Actualizamos la interfaz para incluir la categoría
export interface lugar {
  id: number;
  nombre: string;
  lat: number;
  // foto_url: string;
  lng: number;
  categoria: string; // Añadimos el campo categoría
}

// 2. Creamos una lista de lugares más completa con categorías
const lugaresEjemplo: lugar[] = [
  { id: 1, nombre: 'Museo Frida Kahlo', lat: 19.3552, lng: -99.1620, categoria: 'Museos' },
  { id: 2, nombre: 'Coyoacán Centro', lat: 19.3486, lng: -99.1619, categoria: 'Barrios' },
  { id: 3, nombre: 'Parque Hundido', lat: 19.3752, lng: -99.1826, categoria: 'Parques' },
  { id: 4, nombre: 'Museo Soumaya', lat: 19.4401, lng: -99.2042, categoria: 'Museos' },
  { id: 5, nombre: 'Xochimilco Embarcadero', lat: 19.2676, lng: -99.1062, categoria: 'Atracciones' },
  { id: 6, nombre: 'Castillo de Chapultepec', lat: 19.4204, lng: -99.1818, categoria: 'Museos' },
  { id: 7, nombre: 'Parque México', lat: 19.4098, lng: -99.1729, categoria: 'Parques' },
  { id: 8, nombre: 'Palacio de Bellas Artes', lat: 19.4352, lng: -99.1412, categoria: 'Museos' },
  { id: 9, nombre: 'Angel de la Independencia', lat: 19.4270, lng: -99.1677, categoria: 'Monumentos' },
];

export default function Mapa() {
  const posicionInicial: [number, number] = [19.375, -99.160];
  const zoomInicial = 12;
  
  // 3. Añadimos un estado para saber qué categoría está seleccionada
  // Empezamos con 'Todos' para mostrarlos todos al inicio
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todos');

  // 4. Obtenemos la lista de categorías únicas usando useMemo
  // Esto evita que se recalcule en cada render
  const categorias = useMemo(() => {
    // Usamos un Set para obtener valores únicos
    const cats = new Set(lugaresEjemplo.map(l => l.categoria));
    // Convertimos el Set a un Array y añadimos 'Todos' al principio
    return ['Todos', ...Array.from(cats)];
  }, []); // El array vacío [] significa que esto solo se calcula una vez

  // 5. Filtramos los lugares que se van a mostrar
  // Usamos useMemo para que solo se recalcule si la categoría seleccionada cambia
  const lugaresFiltrados = useMemo(() => {
    // Si la categoría es 'Todos', devolvemos la lista completa
    if (categoriaSeleccionada === 'Todos') {
      return lugaresEjemplo;
    }
    // Si no, filtramos la lista por la categoría
    return lugaresEjemplo.filter(lugar => lugar.categoria === categoriaSeleccionada);
  }, [categoriaSeleccionada]); // Esta función se vuelve a ejecutar si 'categoriaSeleccionada' cambia


  return (
    <div className="relative w-full h-screen">
        
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 z-5 p-2 rounded-lg shadow-lg">
    {categorias.map((categoria) => (
      <Button
        key={categoria}
        onClick={() => setCategoriaSeleccionada(categoria)}
        variant={categoriaSeleccionada === categoria ? "default" : "outline"}
        className={`text-sm font-medium px-3 py-1 ${
          categoriaSeleccionada === categoria
            ? "bg-[var(--palette-blue)] text-white hover:bg-[var(--palette-blue)]"
            : "text-gray-700 border-gray-300 hover:bg-gray-100"
        }`}
      >
        {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
      </Button>
    ))}
  </div>

      <MapContainer center={posicionInicial} zoom={zoomInicial} scrollWheelZoom={true} className="w-full h-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 7. Renderizamos solo los marcadores filtrados */}
        {lugaresFiltrados.map((lugar) => (
          <Marker key={lugar.id} position={[lugar.lat, lugar.lng]}>
            <Popup>
              <strong>{lugar.nombre}</strong> <br />
              Categoría: {lugar.categoria}
              <Button
              variant="ghost" size="icon">
                <CirclePlus />
              </Button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}