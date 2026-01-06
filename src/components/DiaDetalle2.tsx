import React from "react";
import { Card, CardContent, CardDescription, CardTitle } from "./ui/card";
import { GripVertical, Trash2 } from "lucide-react";
import Image from "next/image";
import { Input } from "./ui/input";
import type { Actividad } from "@/api/interfaces/ApiRoutes";

import { getDefaultImageForCategory } from "@/lib/category-utils";
interface DiaDetalleProps {
  lugar: Actividad;
  onActivityChange: (
    id: string | number,
    field: keyof Actividad,
    value: any
  ) => void;
  onDelete: (id: string | number) => void;
  dragListeners?: any; // Prop para los listeners de dnd-kit
}
export default function DiaDetalle({
  lugar,
  onActivityChange,
  onDelete,
  dragListeners,
}: DiaDetalleProps) {
  // const imageUrl = lugar.foto_url || getDefaultImageForCategory(lugar.category);

  return (
    <div>
      <Card className="p-2 m-3">
        <CardContent className="flex gap-4 items-center">
          <GripVertical
            {...dragListeners}
            className="text-gray-400 w-5 h-5 cursor-grab"
          />

          <div className="w-1/3">
            <div className="relative w-full aspect-video rounded-md bg-muted overflow-hidden">
              {/* <Image
                // Usa la foto del lugar si existe, si no, una por categoría
                src={imageUrl}
                alt={lugar.nombre}
                fill
                className="object-cover"
              /> */}
            </div>
          </div>

          {/* Texto: 2/3 */}
          <div className="w-2/3 flex flex-col justify-center">
            <CardTitle className="text-xl font-semibold flex gap-2 justify-between">
              {/* {lugar.nombre} */}
              <Trash2
                className="text-red-500 cursor-pointer flex-shrink-0"
                // onClick={() => onDelete(lugar.id)}
              ></Trash2>
            </CardTitle>
             <CardDescription> 
              Aqui debe ir la descripción de cada lugar.
              </CardDescription>
            {/* <Input
              type="text"
              placeholder="Añadir una descripción (Opcional)"
              className="border-0 m-0 p-0 mt-2 text-sm text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={lugar.description || ""}
              onChange={(e) =>
                onActivityChange(lugar.id, "description", e.target.value)
              }
              onMouseDown={(e) => e.stopPropagation()}
            /> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
