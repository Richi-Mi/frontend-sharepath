"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <section
      className={cn(
        "bg-background/70 absolute left-1/2 z-50 w-[min(90%,500px)] -translate-x-1/2 rounded-3xl border backdrop-blur-md transition-all duration-300",
        "top-5 lg:top-10"
      )}
    >
      <div className="flex items-center justify-between gap-4 px-6 py-3">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/sharepath.svg"
            alt="logo"
            width={32}
            height={32}
            className="dark:invert"
          />
          <span className="font-bold tracking-tight">SharePath</span>
        </Link>

        {/* Acciones Derecha */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Botones Escritorio */}
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/sign-in">
              <Button size="sm">
                Ingresar
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button variant="ghost" size="sm">Registrarse</Button>
            </Link>
          </div>

          {/* Botón Menú Móvil (Solo se ve en pantallas muy pequeñas) */}
          <button
            className="text-muted-foreground relative flex size-8 sm:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="sr-only">Abrir menú</span>
            <div className="absolute top-1/2 left-1/2 block w-[18px] -translate-x-1/2 -translate-y-1/2">
              <span
                className={`absolute block h-0.5 w-full rounded-full bg-current transition duration-300 ${
                  isMenuOpen ? "rotate-45" : "-translate-y-1.5"
                }`}
              ></span>
              <span
                className={`absolute block h-0.5 w-full rounded-full bg-current transition duration-300 ${
                  isMenuOpen ? "opacity-0" : ""
                }`}
              ></span>
              <span
                className={`absolute block h-0.5 w-full rounded-full bg-current transition duration-300 ${
                  isMenuOpen ? "-rotate-45" : "translate-y-1.5"
                }`}
              ></span>
            </div>
          </button>
        </div>
      </div>

      {/* Menú Desplegable Móvil */}
      <div
        className={cn(
          "bg-background absolute inset-x-0 top-[calc(100%+0.5rem)] flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-300 ease-in-out sm:hidden",
          isMenuOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-2 opacity-0"
        )}
      >
        <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
          <Button  className="w-full">
            Ingresar
          </Button>
        </Link>
        <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
          <Button variant="outline" className="w-full">
            Registrarse
          </Button>
        </Link>
      </div>
    </section>
  );
};