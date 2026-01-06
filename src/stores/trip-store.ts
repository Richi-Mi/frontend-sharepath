"use client";
import { create } from "zustand";

export type Place = {
  id: string;
  name: string;
  city: string;
  tag: string;
  img: string;
  lat?: number;
  lng?: number;
  // extra opcionales para el panel de detalle
  about?: string;
  tips?: string[];
  reviews?: string[];
  photos?: string[];
  description?: string;
};

type Day = { key: string; date: Date };

type TripState = {
  days: Day[];
  activeDayKey: string;
  byDay: Record<string, Place[]>;
  selectedPlace: Place | null;

  setActiveDay: (key: string) => void;
  addPlace: (dayKey: string, p: Place) => void;
  removePlace: (dayKey: string, idx: number) => void;
  movePlace: (dayKey: string, from: number, to: number) => void;
  selectPlace: (p: Place | null) => void;
};

export const useTrip = create<TripState>((set, get) => ({
  days: [0, 1, 2, 3].map((off) => ({
    key: `d${off + 1}`,
    date: new Date(2025, 10, 1 + off),
  })),
  activeDayKey: "d1",
  byDay: {},
  selectedPlace: null,

  setActiveDay: (key) => set({ activeDayKey: key }),
  addPlace: (dayKey, p) =>
    set(({ byDay }) => ({
      byDay: { ...byDay, [dayKey]: [...(byDay[dayKey] ?? []), p] },
    })),
  removePlace: (dayKey, idx) =>
    set(({ byDay }) => {
      const arr = [...(byDay[dayKey] ?? [])];
      arr.splice(idx, 1);
      return { byDay: { ...byDay, [dayKey]: arr } };
    }),
  movePlace: (dayKey, from, to) =>
    set(({ byDay }) => {
      const arr = [...(byDay[dayKey] ?? [])];
      if (to < 0 || to >= arr.length) return { byDay };
      const [it] = arr.splice(from, 1);
      arr.splice(to, 0, it);
      return { byDay: { ...byDay, [dayKey]: arr } };
    }),
  selectPlace: (p) => set({ selectedPlace: p }),
}));
