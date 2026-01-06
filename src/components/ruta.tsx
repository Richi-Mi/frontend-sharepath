"use client"

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet'

import * as L from 'leaflet';

import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// import { lugar } from "@/app/(dashboard)/dashboard/reportes/page"
import { lugar } from '@/app/(viajero)/viajero/vermapa/page';

interface RutaProps{
    destinos: lugar[],
}

export default function Ruta({ destinos }: RutaProps)
{
    const map = useMap();

    const refRuteo = useRef<L.Routing.Control | null>(null);

    useEffect(() =>
    {
        const destinosLeaflet = destinos.map((lugar) =>
            L.latLng(lugar.lat, lugar.lng)
        );

        if ( destinosLeaflet.length < 2 ) //No dibujar la ruta si hay menos de dos puntos
        {
            if( refRuteo.current )
            {
                map.removeControl(refRuteo.current);
                refRuteo.current = null;
            }
            return;
        }

        if (refRuteo.current) //Si ya habia una ruta y se agregan mas destinos, actualiza el mapa con los nuevos destinos
        {
            refRuteo.current.setWaypoints(destinosLeaflet);
        }
        else
        {
            //Si no hay ruta, genera una nueva
            refRuteo.current = L.Routing.control({
                waypoints: destinosLeaflet,
                routeWhileDragging: false,
                addWaypoints: false, //Evita que el usuario agregue puntos arrastrando
                draggableWaypoints: false,
                show: false //Oculta las intrucciones de como llegar
            } as any).addTo(map);
        }
    }, [map, destinos]); //Se ejecuta cada que el mapa o los destinos cambian

    useEffect(() => {
        return () => {
            if(refRuteo.current)
            {
                map.removeControl(refRuteo.current);
            }
        };
    }, [map]); 

    return null;
}