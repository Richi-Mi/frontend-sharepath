"use client";
import * as React from "react";
import { useTrip } from "@/stores/trip-store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function DetailPanel() {
  const { selectedPlace } = useTrip();
  if (!selectedPlace) {
    return (
      <div className="h-full grid place-items-center text-sm text-muted-foreground">
        Selecciona un lugar para ver detalles.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <h3 className="font-semibold leading-tight">{selectedPlace.name}</h3>
        <p className="text-xs text-muted-foreground">
          {selectedPlace.city} • {selectedPlace.tag}
        </p>
      </div>

      <div className="p-0 flex-1 overflow-y-auto">
        <img
          src={selectedPlace.img}
          alt={selectedPlace.name}
          className="w-full h-40 object-cover border-b"
        />
        <Tabs defaultValue="about" className="p-3">
          <TabsList className="mb-2">
            <TabsTrigger value="about">Acerca de</TabsTrigger>
            <TabsTrigger value="reviews">Reseñas</TabsTrigger>
            <TabsTrigger value="photos">Fotos</TabsTrigger>
            <TabsTrigger value="mentions">Menciones</TabsTrigger>
          </TabsList>

          <TabsContent
            value="about"
            className="space-y-3 text-sm leading-relaxed"
          >
            <p>
              Descripción corta del lugar. Puedes inyectar la de tu API o
              scrapper.
            </p>
            <ul className="list-disc pl-5">
              <li>Por qué deberías ir: arquitectura, cultura, vistas.</li>
              <li>Saber antes de ir: horarios, filas, entradas.</li>
            </ul>
          </TabsContent>

          <TabsContent
            value="reviews"
            className="text-sm text-muted-foreground"
          >
            Reseñas destacadas…
          </TabsContent>
          <TabsContent value="photos">Galería…</TabsContent>
          <TabsContent
            value="mentions"
            className="text-sm text-muted-foreground"
          >
            Blogs y menciones…
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
