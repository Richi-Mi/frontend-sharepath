"use client";

import { useEffect, useMemo } from "react";
import { useMap } from "react-leaflet";
import * as GeoSearch from "leaflet-geosearch";

// --- Tus importaciones Reales ---
import { ApiSearchProvider } from "@/api/ApiSearchProvider"; 
import { LugarData } from "@/api/interfaces/ApiRoutes";
// import { lugar } from "@/app/(dashboard)/dashboard/vermapa/page";
import { lugar } from "@/app/(viajero)/viajero/vermapa/page";

// --- Estilos ---
import "leaflet-geosearch/dist/geosearch.css";
import "./estilosBusqueda.css";

interface BusquedaProps {
  onAddLugar: (lugar: lugar) => void;
}

export default function BusquedaMapa({ onAddLugar }: BusquedaProps) {
  const map = useMap();
  
  // 1. FIX IMPORTANTE: Usamos useMemo
  // Esto evita que se cree un 'new ApiSearchProvider()' en cada render,
  // lo cual "reseteaba" el buscador constantemente.
  const provider = useMemo(() => new ApiSearchProvider(), []);

  useEffect(() => {
    const search = GeoSearch.GeoSearchControl({
      searchLabel: "Buscar en mi base de datos",
      notFoundMessage: "No se encontró el lugar",
      provider: provider, 
      style: "bar",
      autoClose: true,
      keepResult: true,
      updateMap: true, // Mueve el mapa al resultado
    });

    map.addControl(search);

    const onResult = (e: any) => {
      // Validamos que exista 'raw' para evitar crashes
      if (!e.location || !e.location.raw) return;

      const lugarDeLaDB: LugarData = e.location.raw; 

      const lugarParaElMapa: lugar = {
        id: Number("lugarDeLaDB.id_api_place") || Date.now(), // Fallback ID
        nombre: lugarDeLaDB.nombre,
        lat: lugarDeLaDB.latitud,   
        lng: lugarDeLaDB.longitud,
        categoria: lugarDeLaDB.category,  
      };

      onAddLugar(lugarParaElMapa);
    };

    // Escuchamos el evento de selección
    map.on("geosearch/showlocation", onResult);

    return () => {
      map.removeControl(search);
      map.off("geosearch/showlocation", onResult);
    };
  }, [map, onAddLugar, provider]); 

  return null;
}