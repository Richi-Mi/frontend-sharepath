"use client"
import { LatLngExpression } from "leaflet";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

import "leaflet/dist/leaflet.css"
import "leaflet-defaulticon-compatibility"
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css"

import BusquedaMapa from "./busquedaMapa"
import Ruta from "./ruta"
// import { lugar } from "@/app/(dashboard)/dashboard/reportes/page"
import { lugar } from "@/app/(viajero)/viajero/vermapa/page";

interface MapProps{
  posicion: LatLngExpression,
  zoom: number,
  itinerario: lugar[],
  onAddLugar: (lugar: lugar) => void,
}

export default function Mapa(props: MapProps) {
  const { posicion, zoom, itinerario, onAddLugar } = props;

  return (
    <MapContainer center={posicion} zoom={zoom} scrollWheelZoom={true} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}">OpenStreetMap</a> contributors'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        // url="https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.jpg"
      />

      <Ruta destinos={itinerario} />
      <BusquedaMapa onAddLugar={onAddLugar} />

      {/* <Marker position={posicion}>
        <Popup>
          ESCOM <br /> Escula Superior de Computo
        </Popup>
      </Marker> */}
    </MapContainer>
  );
}