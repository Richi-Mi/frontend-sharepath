import React from "react";
import ItineraryReadView from "./components/ItineraryReadView";

interface PageProps {
  params: Promise <{
    itineraryId: string;
  }>;
}

export const metadata = {
  title: "Ver Itinerario | Harol Lovers",
  description: "Detalles y mapa de tu itinerario de viaje.",
};

export default async function VerItinerarioPage({ params }: PageProps) {
  const { itineraryId } = await params;

  return (
    <div className="w-full h-full">
      <ItineraryReadView id={itineraryId} />
    </div>
  );
}
