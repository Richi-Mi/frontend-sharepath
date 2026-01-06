
import { ItinerariosAPI } from "@/api/ItinerariosAPI";
import { LugarData } from "@/api/interfaces/ApiRoutes";
export type StateKey = "cdmx" | "edomex" | "hidalgo" | "morelos" | "queretaro";

export type PlaceCategory =
  | "museo"
  | "parque"
  | "mirador"
  | "gastronomía"
  | "histórico"
  | "arte"
  | "avenida"
  | "pueblo mágico"
  | "viñedo"
  | "religioso"
  | "mercado"
  | "zona arqueológica"
  | "fotopoint"
  | "cafetería"
  | "bar";

export type Place = {
  id_api_place: string;

  state: StateKey;
  nombre: string;
  category: PlaceCategory;
  latitud: number;
  longitud: number;
  google_score: number;
  total_reviews: number;
  foto_url?: string;
  priceLevel?: "free" | "low" | "medium" | "high";
  short_desc?: string;
  tags?: string[];
};

export type ItineraryStyle =
  | "cultural"
  | "familiar"
  | "gastronómico"
  | "romántico"
  | "fotografía";

export type ItineraryDraftSlim = {
  title: string;
  startDate: string;
  days: number; // 1..7
  states: StateKey[];
  style?: ItineraryStyle;
  budget?: "low" | "medium" | "high";
  searchQuery?: string;
};

export const MX_STATES: {
  key: StateKey;
  label: string;
  center: { lat: number; lng: number };
}[] = [
  {
    key: "cdmx",
    label: "Ciudad de México",
    center: { lat: 19.432608, lng: -99.133209 },
  },
  {
    key: "edomex",
    label: "Estado de México",
    center: { lat: 19.325696, lng: -99.666725 },
  },
  {
    key: "hidalgo",
    label: "Hidalgo",
    center: { lat: 20.48829, lng: -98.86157 },
  },
  {
    key: "morelos",
    label: "Morelos",
    center: { lat: 18.6813, lng: -99.10135 },
  },
  {
    key: "queretaro",
    label: "Querétaro",
    center: { lat: 20.58879, lng: -100.38989 },
  },
];

/* ------------------------------ Lugares base ----------------------------- */
export const PLACES: Place[] = [
  // CDMX
  {
    id_api_place: "cdmx_mna_01",
    state: "cdmx",
    nombre: "Museo Nacional de Antropología",
    category: "museo",
    latitud: 19.426,
    longitud: -99.186,
    google_score: 4.8,
    total_reviews: 98000,
    foto_url:
      "https://images.unsplash.com/photo-1698864606551-46c6fb92a96f?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=776",
    priceLevel: "low",
    short_desc: "El museo más icónico del país, ideal para rutas culturales.",
    tags: ["museos", "cultura", "historia"],
  },
  {
    id_api_place: "cdmx_chapultepec_park",
    state: "cdmx",
    nombre: "Bosque de Chapultepec",
    category: "parque",
    latitud: 19.4205,
    longitud: -99.1919,
    google_score: 4.8,
    total_reviews: 150000,
    foto_url:
      "https://images.unsplash.com/photo-1737001520593-5bb1c00e9075?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1740",
    priceLevel: "free",
    short_desc:
      "Áreas verdes, lagos, museos y castillo; perfecto para familias.",
    tags: ["aire libre", "familia", "fotografía"],
  },
  {
    id_api_place: "cdmx_centro_hist_01",
    state: "cdmx",
    nombre: "Centro Histórico / Zócalo",
    category: "histórico",
    latitud: 19.4326,
    longitud: -99.1332,
    google_score: 4.7,
    total_reviews: 210000,
    foto_url:
      "https://images.unsplash.com/photo-1713997084278-f613f3d5b158?q=80&w=1975&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    priceLevel: "free",
    short_desc: "Arquitectura, catedrales, murales y gastronomía cercana.",
    tags: ["historia", "arquitectura", "fotografía"],
  },
  {
    id_api_place: "cdmx_frida_casa_azul",
    state: "cdmx",
    nombre: "Museo Frida Kahlo (Casa Azul)",
    category: "arte",
    latitud: 19.3553,
    longitud: -99.1625,
    google_score: 4.6,
    total_reviews: 89000,
    foto_url:
      "https://images.unsplash.com/photo-1620147657422-4179e42bb21f?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    priceLevel: "medium",
    short_desc: "Icono del arte mexicano; conviene reservar.",
    tags: ["arte", "cultura", "fotografía"],
  },
  {
    id_api_place: "cdmx_soumaya_plaza",
    state: "cdmx",
    nombre: "Museo Soumaya Plaza Carso",
    category: "museo",
    latitud: 19.4405,
    longitud: -99.2042,
    google_score: 4.7,
    total_reviews: 135000,
    foto_url:
      "https://images.unsplash.com/photo-1550935224-41caaa78d61a?q=80&w=1365&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    short_desc: "Arquitectura distintiva y colección diversa.",
    tags: ["arte", "arquitectura"],
  },
  {
    id_api_place: "cdmx_califa_tacos",
    state: "cdmx",
    nombre: "Taquería El Califa",
    category: "gastronomía",
    latitud: 19.4202,
    longitud: -99.1736,
    google_score: 4.5,
    total_reviews: 12000,
    foto_url:
      "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    short_desc: "Clásico para cerrar un día de museos con tacos.",
    tags: ["tacos", "antojitos"],
  },
  {
    id_api_place: "cdmx_paseo_reforma",
    state: "cdmx",
    nombre: "Paseo de la Reforma (fotopoints)",
    category: "avenida",
    latitud: 19.427,
    longitud: -99.167,
    google_score: 4.7,
    total_reviews: 190000,
    foto_url:
      "https://images.unsplash.com/photo-1683502227232-fe80b098151d?q=80&w=1315&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    short_desc: "Ángeles, Diana, edificios; gran boulevard para fotos.",
    tags: ["fotopoint", "avenida"],
  },
  {
    id_api_place: "cdmx_cafeb_roma",
    state: "cdmx",
    nombre: "Cafetería de autor – Roma",
    category: "cafetería",
    latitud: 19.4175,
    longitud: -99.1629,
    google_score: 4.6,
    total_reviews: 6500,
    foto_url:
      "https://images.unsplash.com/photo-1599067821475-c47c29093bf7?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    short_desc: "Espresso y brunch para descansar la ruta.",
    tags: ["coffee", "brunch"],
  },
  {
    id_api_place: "cdmx_bar_rooftop",
    state: "cdmx",
    nombre: "Rooftop bar con vista al Centro",
    category: "bar",
    latitud: 19.43,
    longitud: -99.14,
    google_score: 4.5,
    total_reviews: 4800,
    foto_url:
      "https://images.unsplash.com/photo-1719628348211-0334e4ad3c0b?q=80&w=927&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    short_desc: "Atardecer y skyline del centro histórico.",
    tags: ["noche", "vista"],
  },

  // Estado de México
  {
    id_api_place: "edomex_teotihuacan",
    state: "edomex",
    nombre: "Zona Arqueológica de Teotihuacán",
    category: "zona arqueológica",
    latitud: 19.6925,
    longitud: -98.8433,
    google_score: 4.8,
    total_reviews: 260000,
    foto_url:
      "https://images.unsplash.com/photo-1643177159923-94f0917f3dbd?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    short_desc: "Pirámides del Sol y la Luna; amanecer impresionante.",
    tags: ["arqueología", "fotografía"],
  },
  {
    id_api_place: "edomex_nevado_toluca",
    state: "edomex",
    nombre: "Nevado de Toluca (Xinantécatl)",
    category: "parque",
    latitud: 19.1085,
    longitud: -99.7585,
    google_score: 4.7,
    total_reviews: 87000,
    foto_url:
      "https://images.unsplash.com/photo-1575341669392-f4d37e9b9090?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    short_desc: "Lagunas del Sol y la Luna; senderismo de altura.",
    tags: ["senderismo", "naturaleza"],
  },
  {
    id_api_place: "edomex_cosmovitral",
    state: "edomex",
    nombre: "Cosmovitral Jardín Botánico",
    category: "arte",
    latitud: 19.2896,
    longitud: -99.6557,
    google_score: 4.7,
    total_reviews: 52000,
    foto_url:
      "https://images.unsplash.com/photo-1563714193017-5a5fb60bc02b?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    short_desc: "Vitrales espectaculares en Toluca.",
    tags: ["arte", "jardín"],
  },
  {
    id_api_place: "edomex_valle_bravo",
    state: "edomex",
    nombre: "Valle de Bravo – Lago y Malecón",
    category: "pueblo mágico",
    latitud: 19.1952,
    longitud: -100.1316,
    google_score: 4.6,
    total_reviews: 76000,
    foto_url:
      "https://images.unsplash.com/photo-1555988402-6d65bb5e5461?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    short_desc: "Velerismo, parapente y vistas al lago.",
    tags: ["aventura", "romántico"],
  },

  // Hidalgo
  {
    id_api_place: "hgo_prismas_basalticos",
    state: "hidalgo",
    nombre: "Prismas Basálticos",
    category: "parque",
    latitud: 20.2062,
    longitud: -98.5755,
    google_score: 4.6,
    total_reviews: 43000,
    foto_url:
      "https://images.unsplash.com/photo-1565746088991-b45229ba4981?q=80&w=1289&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    short_desc: "Formaciones geológicas únicas con cascadas.",
    tags: ["fotografía", "naturaleza"],
  },
  {
    id_api_place: "hgo_real_monte",
    state: "hidalgo",
    nombre: "Real del Monte – Centro",
    category: "pueblo mágico",
    latitud: 20.1353,
    longitud: -98.6727,
    google_score: 4.6,
    total_reviews: 38000,
    foto_url:
      "https://images.unsplash.com/photo-1703425113760-3dafe9a0415b?q=80&w=1950&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    short_desc: "Pastes, minas y arquitectura inglesa.",
    tags: ["histórico", "gastronomía"],
  },
  {
    id_api_place: "hgo_tula_atlantes",
    state: "hidalgo",
    nombre: "Zona Arqueológica de Tula – Atlantes",
    category: "zona arqueológica",
    latitud: 20.0576,
    longitud: -99.341,
    google_score: 4.6,
    total_reviews: 52000,
    foto_url:
      "https://images.unsplash.com/photo-1551346391-e38927e930fb?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    short_desc: "Caballeros toltecas sobre la pirámide B.",
    tags: ["arqueología", "historia"],
  },
  {
    id_api_place: "hgo_tolantongo",
    state: "hidalgo",
    nombre: "Grutas de Tolantongo",
    category: "parque",
    latitud: 20.6513,
    longitud: -98.9968,
    google_score: 4.7,
    total_reviews: 95000,
    foto_url:
      "https://images.unsplash.com/photo-1635429645141-36964dd772b9?q=80&w=927&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    short_desc: "Río termal, pozas azules y túneles.",
    tags: ["relax", "fotografía"],
  },

  // Morelos
  {
    id_api_place: "mor_jardin_borda",
    state: "morelos",
    nombre: "Jardín Borda",
    category: "parque",
    latitud: 18.9212,
    longitud: -99.2407,
    google_score: 4.6,
    total_reviews: 18000,
    foto_url:
      "https://upload.wikimedia.org/wikipedia/commons/f/fe/Jardin_Borda_Cuernavaca.jpg",
    short_desc: "Historia y jardines en Cuernavaca.",
    tags: ["histórico", "relax"],
  },
  {
    id_api_place: "mor_xochicalco",
    state: "morelos",
    nombre: "Zona Arqueológica de Xochicalco",
    category: "zona arqueológica",
    latitud: 18.8049,
    longitud: -99.2828,
    google_score: 4.7,
    total_reviews: 38000,
    foto_url:
      "https://upload.wikimedia.org/wikipedia/commons/b/b5/Xochicalco_Pyramid_of_the_Plumed_Serpent.jpg",
    short_desc: "Pirámides y observatorio solar.",
    tags: ["arqueología", "fotografía"],
  },
  {
    id_api_place: "mor_tepoztlan",
    state: "morelos",
    nombre: "Tepoztlán – Centro y Tepozteco",
    category: "pueblo mágico",
    latitud: 18.9851,
    longitud: -99.093,
    google_score: 4.6,
    total_reviews: 68000,
    foto_url:
      "https://upload.wikimedia.org/wikipedia/commons/9/91/Tepoztl%C3%A1n_Panor%C3%A1mica.JPG",
    short_desc: "Subida al Tepozteco y nieves artesanales.",
    tags: ["senderismo", "místico"],
  },
  {
    id_api_place: "mor_las_estacas",
    state: "morelos",
    nombre: "Parque Las Estacas",
    category: "parque",
    latitud: 18.6989,
    longitud: -99.195,
    google_score: 4.6,
    total_reviews: 27000,
    foto_url:
      "https://images.unsplash.com/photo-1632371911252-a3070d1d6e1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    short_desc: "Río cristalino para snorkel y nado.",
    tags: ["familia", "agua"],
  },

  // Querétaro
  {
    id_api_place: "qro_bernall",
    state: "queretaro",
    nombre: "Peña de Bernal",
    category: "mirador",
    latitud: 20.7475,
    longitud: -99.9496,
    google_score: 4.7,
    total_reviews: 82000,
    foto_url:
      "https://images.unsplash.com/photo-1636300958042-64356873ffcc?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    short_desc: "Uno de los monolitos más grandes del mundo.",
    tags: ["aventura", "fotografía"],
  },
  {
    id_api_place: "qro_vinedos_freixenet",
    state: "queretaro",
    nombre: "Viñedos – Freixenet MX",
    category: "viñedo",
    latitud: 20.7117,
    longitud: -99.8988,
    google_score: 4.6,
    total_reviews: 46000,
    foto_url:
      "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?q=80&w=1742&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    short_desc: "Cavas, tours y degustaciones.",
    tags: ["vino", "romántico", "gastronomía"],
  },
  {
    id_api_place: "qro_centro_hist",
    state: "queretaro",
    nombre: "Centro Histórico de Querétaro",
    category: "histórico",
    latitud: 20.5888,
    longitud: -100.3899,
    google_score: 4.8,
    total_reviews: 140000,
    foto_url:
      "https://images.unsplash.com/photo-1679157381710-42b20b9eb032?q=80&w=1733&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    short_desc: "Andadores, plazas y templos barrocos.",
    tags: ["historia", "arquitectura"],
  },
  {
    id_api_place: "qro_mision_conca",
    state: "queretaro",
    nombre: "Misión de Concá (Sierra Gorda)",
    category: "religioso",
    latitud: 21.2511,
    longitud: -99.496,
    google_score: 4.7,
    total_reviews: 12000,
    foto_url:
      "https://images.unsplash.com/photo-1598535989263-cb097f8ac3f0?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    short_desc: "Ruta de misiones franciscanas.",
    tags: ["cultural", "fotografía"],
  },
];

/* ------------------------- Actividades y plantillas ---------------------- */
export const POPULAR_ACTIVITIES: Record<StateKey, string[]> = {
  cdmx: [
    "Museos en Chapultepec",
    "Paseo por Centro Histórico",
    "Tarde de tacos",
    "Ruta de murales",
    "Coyoacán bohemio",
    "Selfies en Soumaya",
  ],
  edomex: [
    "Amanecer en Teotihuacán",
    "Senderismo Nevado de Toluca",
    "Cosmovitral y centro Toluca",
    "Velero en Valle de Bravo",
    "Mariposa monarca (temporada)",
  ],
  hidalgo: [
    "Caminata Prismas Basálticos",
    "Ruta Real del Monte",
    "Tolantongo Relax",
    "Atlantes de Tula",
  ],
  morelos: [
    "Subida al Tepozteco",
    "Xochicalco arqueológico",
    "Día de alberca en Las Estacas",
    "Centro de Cuernavaca",
  ],
  queretaro: [
    "Viñedos y degustación",
    "Centro histórico de noche",
    "Bernal y gorditas",
    "Misiones Sierra Gorda",
  ],
};

export const ROUTE_TEMPLATES = [
  {
    id: "tpl_cdmx_cultural_3",
    title: "CDMX cultural en 3 días",
    states: ["cdmx"] as StateKey[],
    days: 3,
    style: "cultural" as ItineraryStyle,
    anchorPlaces: ["cdmx_mna_01", "cdmx_soumaya_plaza", "cdmx_centro_hist_01"],
  },
  {
    id: "tpl_teoti_cdmx_2",
    title: "CDMX + Teotihuacán express",
    states: ["cdmx", "edomex"] as StateKey[],
    days: 2,
    style: "fotografía" as ItineraryStyle,
    anchorPlaces: ["edomex_teotihuacan", "cdmx_centro_hist_01"],
  },
  {
    id: "tpl_qro_vino_2",
    title: "Querétaro entre viñedos",
    states: ["queretaro"] as StateKey[],
    days: 2,
    style: "romántico" as ItineraryStyle,
    anchorPlaces: ["qro_vinedos_freixenet", "qro_centro_hist"],
  },
];

export const TITLE_SEEDS = [
  "Ruta cultural CDMX en 3 días",
  "Romance entre viñedos (QRO) – 2 días",
  "Aventura Nevado + Cosmovitral – 2 días",
  "Fotografía en Teotihuacán al amanecer",
  "Chapultepec + tacos y museos",
  "Tolantongo relax & Real del Monte",
  "Bernal + centro histórico QRO",
];

export const TRAVEL_MATRIX_MINUTES: Record<
  StateKey,
  Record<StateKey, number>
> = {
  cdmx: { cdmx: 25, edomex: 60, hidalgo: 100, morelos: 90, queretaro: 180 },
  edomex: { cdmx: 60, edomex: 25, hidalgo: 120, morelos: 120, queretaro: 150 },
  hidalgo: {
    cdmx: 100,
    edomex: 120,
    hidalgo: 25,
    morelos: 180,
    queretaro: 200,
  },
  morelos: { cdmx: 90, edomex: 120, hidalgo: 180, morelos: 25, queretaro: 210 },
  queretaro: {
    cdmx: 180,
    edomex: 150,
    hidalgo: 200,
    morelos: 210,
    queretaro: 25,
  },
};

export const SYSTEM_TAGS = [
  "museos",
  "historia",
  "arte",
  "arquitectura",
  "vino",
  "tacos",
  "mercados",
  "senderismo",
  "familia",
  "romántico",
  "fotografía",
  "multidestino",
  "free spots",
  "fine dining",
  "rutas cortas",
  "rutas largas",
];

export const MAX_DAYS = 7;
export const VISIBILITY_CHOICES = ["public", "private"] as const;
export type VisibilityChoice = (typeof VISIBILITY_CHOICES)[number];

/* ------------------------------- Helpers -------------------------------- */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sLat1 = (a.lat * Math.PI) / 180,
    sLat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(sLat1) * Math.cos(sLat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export function centerForStates(states: StateKey[]) {
  const subset = MX_STATES.filter((s) => states.includes(s.key));
  const base = subset.length ? subset : [MX_STATES[0]];
  const lat = base.reduce((a, b) => a + b.center.lat, 0) / base.length;
  const lng = base.reduce((a, b) => a + b.center.lng, 0) / base.length;
  return { lat, lng };
}
export function suggestTags(draft: ItineraryDraftSlim) {
  const out = new Set<string>();
  if (draft.style === "cultural") out.add("museos").add("centro histórico");
  if (draft.style === "gastronómico")
    out.add("tacos").add("mercados").add("antojitos");
  if (draft.style === "fotografía") out.add("spots fotogénicos");
  if (draft.days >= 3) out.add("ruta de 3 días");
  if (draft.days >= 5) out.add("ruta de 5 días");
  if (draft.states.length > 1) out.add("multidestino");
  if (draft.states.includes("queretaro")) out.add("viñedos");
  if (draft.states.includes("cdmx")) out.add("chapultepec");
  if (draft.budget === "low") out.add("free spots");
  if (draft.budget === "high") out.add("fine dining");
  SYSTEM_TAGS.slice(0, 3).forEach((t) => out.add(t));
  return Array.from(out).slice(0, 8);
}
export async function suggestPlacesByRadius(

  states: StateKey[],
  kmRadius: number,
  q?: string,
  category?: PlaceCategory

) {
  const c = centerForStates(states);
  const ql = (q ?? "").toLowerCase();
  return PLACES.filter((p) => {
    if (!states.includes(p.state)) return false;
    if (category && p.category !== category) return false;
    if (
      ql &&
      !`${p.nombre} ${p.short_desc ?? ""} ${(p.tags ?? []).join(" ")}`
        .toLowerCase()
        .includes(ql)
    )
      return false;
    return haversineKm(c, { lat: p.latitud, lng: p.longitud }) <= kmRadius;
  }).sort((a, b) => b.total_reviews - a.total_reviews);
}
export function suggestPopularByState(states: StateKey[], top = 3): Place[] {
  return PLACES.filter((p) => states.includes(p.state))
    .sort((a, b) => b.total_reviews - a.total_reviews)
    .slice(0, Math.max(top, 1));
}
export function osmEmbedForStates(states: StateKey[], zoom = 11) {
  const c = centerForStates(states),
    pad = 0.15;
  const bbox = `${c.lng - pad}%2C${c.lat - pad}%2C${c.lng + pad}%2C${
    c.lat + pad
  }`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${c.lat}%2C${c.lng}`;
}
export function popularActivitiesFor(states: StateKey[]) {
  const s = new Set<string>();
  states.forEach((k) =>
    (POPULAR_ACTIVITIES as any)[k]?.forEach((t: string) => s.add(t))
  );
  return Array.from(s);
}
export const ALL_STATES_WARNING =
  "Moverse por CDMX, Estado de México, Hidalgo, Morelos y Querétaro en un solo itinerario incrementa notablemente " +
  "los tiempos de traslado. Sugerimos comenzar con 1–2 estados y limitar traslados diarios a ≤ 2 h.";

export type Activity = { id: string; name: string };

export const ACTIVITIES: Activity[] = [
  { id: "museos", name: "Museos" },
  { id: "parques", name: "Parques" },
  { id: "miradores", name: "Miradores" },
  { id: "gastronomia", name: "Gastronomía" },
  { id: "historia", name: "Historia" },
  { id: "arte", name: "Arte" },
  { id: "pueblos", name: "Pueblos mágicos" },
  { id: "vino", name: "Viñedos" },
  { id: "religioso", name: "Religioso" },
  { id: "mercados", name: "Mercados" },
  { id: "arqueologia", name: "Zona arqueológica" },
  { id: "foto", name: "Fotografía" },
];
