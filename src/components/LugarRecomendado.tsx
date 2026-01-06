import React from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardTitle } from "./ui/card";
import { Lightbulb, CirclePlus } from "lucide-react";
import {Button} from "./ui/button";

export default function LugarRecomendado() {
  return (
    <div>
      <Card className="p-2 m-3 border-secondary/50 shadow-lg">
        <CardContent className="flex gap-4">
          {/* Imagen: 1/3 */}
          <div className="w-1/3 flex items-center">
            <Image
              // className="h-auto"
              src="/img/bellas_artes.jpg"
              alt="Bellas Artes"
              width={400}
              height={200}
              className="rounded-md w-full h-auto object-cover"
            />
          </div>

          {/* Texto: 2/3 */}
          <div className="w-2/3 flex flex-col justify-center">
            <CardTitle className="text-xl font-semibold">
            <p className="flex items-center text-primary gap-2">
              <Lightbulb className="w-5 h-5 "/>Sugerencia de lugar</p>
              Palacio de Bellas Artes
            </CardTitle>
            <CardDescription className="text-sm mt-2">
              Uno de los recintos culturales más emblemáticos de México, ubicado
              en el corazón de la CDMX.
              <Button
                variant="outline"
                className="mt-1 p-2 flex items-center gap-2 ml-auto"
              >
                <CirclePlus className="text-primary"></CirclePlus>Añadir
              </Button>
            </CardDescription>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
