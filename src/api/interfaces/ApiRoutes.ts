export interface RegisterRequest {
  nombre_completo: string;
  correo: string;
  password: string;
  role: string;
  username: string;
  privacity_mode: boolean;
}

export interface RegisterResponse {
  message: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface Usuario {
  username: string;
  nombre_completo: string;
  foto_url: null | string;
  account_status: boolean;
  privacity_mode: boolean;
  role: string;
  correo: string;
  itineraryCount: number | null;
  friendsCount: number | null;
}

export interface ErrorResponse {
  message: string;
}

export interface Actividad {
  fecha: string;
  description: string;
  lugarId: string;
}

export interface CreateItinerarioRequest {
  title: string;
  actividades: Actividad[];

  start_date?: string;
  end_date?: string;
  regions?: string[];
}

export interface CreateItinerarioResponse {
  id: number | string;
  title: string;
  actividades: Actividad[];
  createdAt: string;
  message?: string;
}

export interface ItinerarioData {
  id: number | string;
  title: string;
  actividades: Actividad[];
  createdAt: string;
  updatedAt?: string;

  start_date?: string;
  end_date?: string;
  regions?: string[];
}

export interface ItinerarioListResponse {
  itinerarios: ItinerarioData[];
  total: number;
}

export interface CreateLugarRequest {
  id_api_place: string;
  category: string;
  mexican_state: string;
  nombre: string;
  latitud: number;
  longitud: number;
  foto_url: string;
  google_score: number;
  total_reviews: number;
  descripcion: string;
}

export interface LugarData {
  id_api_place: string;
  category: string;
  mexican_state: string;
  nombre: string;
  latitud: number;
  longitud: number;
  foto_url: string;
  google_score: number;
  total_reviews: number;
  descripcion: string;
}

export interface LugaresListResponse {
  lugares: LugarData[];
  total: number;
}

export interface RecommendationRequest {
  lugarIds?: string[];
  query?: string;
  limit?: number;
}

export interface RecommendedLugar extends LugarData {
  hybridScore: number;
  proximityScore: number;
  preferenceScore: number;
  ratingScore: number;
}

export interface OptimizationRequest {
  lugarIds: string[];
}

export interface UpdateUserRequest {
  username?: string;
  nombre_completo?: string;
  privacity_mode?: boolean;
  foto?: File;
}

export interface UpdatePasswordRequest {
  newPassword: string;
}

export interface VerifyPasswordRequest {
  password: string;
}

export interface SearchUserResponse {
  users: Usuario[];
}

export interface Preferencias {
  id: number;
  usuario: Usuario;
  correo: string;
  lugares_preferidos: string[];
  estados_visitados: string[];
  actividades_preferidas: string[];
}
export interface Amigo {
  id: number;
  status: number;
  receiving_user: Usuario;
  requesting_user: Usuario;
  fecha_amistad: string | null;
}

export interface SendFriend {
  message: string;
  data: Amigo;
}

export interface CancelRequest {
  message: string;
  data: Amigo;
}

export interface RespondFriend {
  message: string;
  data: Amigo;
}
export interface ListRequest {
  message: string;
  data: Amigo[];
}

export type ListFriend = Amigo[];

export type ListRecomen = Array<{
  id: number;
  title: string;
  owner: any;
  actividades: any[];
  score: number;
}>;

export type SearchFriend = Usuario[];

export interface Block {
  message: string;
}

export interface UnBlock {
  message: string;
}

export interface BlockedUser {
  username: string;
  nombre_completo: string;
  correo: string;
  foto_url: string | null;
}

export interface ListBlock {
  message: string;
  data: BlockedUser[];
}

export interface FriendSuggestion {
  username: string;
  nombre_completo: string;
  correo: string;
  foto_url: string | null;
}

export interface FriendSuggestionResponse {
  message: string;
  data: FriendSuggestion[];
}

export interface CreateResenaRequest {
    score: number;
    commentario?: string;
}

export interface UpdateResenaRequest {
    score?: number;
    commentario?: string;
}

export interface Resena {
    id: number;
    score: number;
    commentario: string | null;
    usuario: {
        username: string;
        nombre_completo: string;
        foto_url: string | null;
    };
}

export interface PublicacionConResenas {
    id: number;
    descripcion: string;
    privacity_mode: boolean;
    itinerario: {
        id: number;
        title: string;
    } | null;
    user_shared: {
        username: string;
        nombre_completo: string;
        foto_url: string | null;
        correo: string;
    };
    fotos: Array<{
        id: number;
        foto_url: string;
    }>;
    reseñas: Resena[];
}

export interface ApiRoutes {
  // ===== ADMIN / DASHBOARD =====
  getAdminStats: () => Promise<DashboardStatsResponse>;
  banPublication: (reportId: number) => Promise<{ message: string }>;
  getAdminReportDetail: (reportId: number) => Promise<Reporte>;
  // Auth
  doLogin: (correo: string, password: string) => Promise<Usuario>;
  doRegister: (body: RegisterRequest) => Promise<RegisterResponse>;

  // Itinerarios
  createItinerario: (
    body: CreateItinerarioRequest
  ) => Promise<CreateItinerarioResponse>;
  getMyItinerarios: () => Promise<ItinerarioListResponse>;
  deleteItinerario: (id: number | string) => Promise<{ message: string }>;

  // Agregados por el equipo (main):
  getItinerarioById: (id: number | string) => Promise<ItinerarioData>;
  updateItinerario: (
    id: number | string,
    body: CreateItinerarioRequest
  ) => Promise<CreateItinerarioResponse>;

  // Lugares
  createLugar: (body: CreateLugarRequest) => Promise<LugarData>;

  getLugares: (
    page: number,
    limit: number,
    state?: string,
    category?: string,
    nombre?: string
  ) => Promise<LugaresListResponse>;

  getLugarById: (id: string) => Promise<LugarData>;
  deleteLugar: (id: string) => Promise<{ message: string }>;

  // Recomendación de lugares
  getRecommendations: (
    body: RecommendationRequest
  ) => Promise<RecommendedLugar[]>;

  // Optimización de ruta
  optimizeRoute: (body: OptimizationRequest) => Promise<LugarData[]>;

  // Usuario
  getUser: () => Promise<Usuario>;
  updateUser: (body: UpdateUserRequest) => Promise<Usuario>;
  updatePassword: (body: UpdatePasswordRequest) => Promise<{ message: string }>;
  verifyPassword: (
    body: VerifyPasswordRequest
  ) => Promise<{ message: boolean }>;
  searchUsers: (query: string) => Promise<SearchUserResponse>;

  // TU AGREGADO (Vital para el perfil):
  getUserProfile: (query: string) => Promise<Usuario>;

  deleteUser: () => Promise<{ message: string }>;

  // Amigo
  sendFriendRequest: (receiving: string) => Promise<SendFriend>;
  cancelFriendRequest: (receiving: string) => Promise<CancelRequest>;
  respondFriendRequest: (id: number, state: number) => Promise<RespondFriend>;
  getRequests: () => Promise<ListRequest>;
  getFriends: () => Promise<ListFriend>;
  searchFriend: (query: string) => Promise<SearchFriend>;
  deleteFriend: (correo: string) => Promise<{ message: string }>;
  block: (user: string) => Promise<Block>;
  unblock: (user: string) => Promise<UnBlock>;
  listblock: () => Promise<ListBlock>;

  //Recomendacion de new user
  getRecomen: () => Promise<ListRecomen>;

  // Sugerencias de amigos
  getFriendSuggestions: () => Promise<FriendSuggestionResponse>;

  getAverageRating: (publicationId: number) => Promise<AverageRatingResponse>;
  shareItinerary: (
    itinerarioId: number,
    body: ShareItineraryRequest
  ) => Promise<Publicacion>;
  getMyPublications: () => Promise<Publicacion[]>;

  getPublicationWithResenas: (publicacionId: number) => Promise<PublicacionConResenas>;
  deletePublication: (publicacionId: number) => Promise<{ message: string }>;
  updatePublication: (publicacionId: number, body: UpdatePublicationRequest) => Promise<Publicacion>;
  
  // Reseñas
  createResena: (publicacionId: number, body: CreateResenaRequest) => Promise<Resena>;
  updateResena: (resenaId: number, body: UpdateResenaRequest) => Promise<Resena>;
  deleteResena: (resenaId: number) => Promise<Resena>;
  getResenasByPublicacion: (publicacionId: number) => Promise<Resena[]>;
  
    // Reportes.
    createReport: (publicationId: number, reason: string) => Promise<CreateReportResponse>;
    getReports: () => Promise<Reporte[]>;
    getReportById: (reportId: number) => Promise<Reporte>;
    deleteReport: (reportId: number) => Promise<void>; // Manda error si no se puede eliminar

  // Notificaciones
  getNotifications: () => Promise<RawNotification[]>;


}

export interface MarkAsReadResponse {
  msg: string;
}

export interface RawNotification {
  id: string | number;
  type: "FRIEND_REQUEST" | "POST" | "LIKE" | "COMMENT" | "DEFAULT";
  previewText: string;
  createdAt: string;
  isRead: boolean;
  resourceId?: string | number;
  emisor: Usuario;
}

export interface UserInfoResponse {
  correo:          string;
  username:        string;
  nombre_completo: string;
  foto_url:        string;
  privacity_mode:  boolean;
  role:            string;
  publicaciones:   Publicacione[];
}

export interface Publicacione {
  id:             number;
  descripcion:    string;
  privacity_mode: boolean;
  fotos:          Foto[];
  itinerario:     Itinerario;
}

export interface Foto {
  id:       number;
  foto_url: string;
}

export interface Itinerario {
  id:     number;
  nombre: string;
}

export interface CreateReportResponse {
    description:      string;
    publicacion:      Publicacion;
    usuario_emitente: UsuarioEmitente;
    id:               number;
}
export interface Reporte {
    id:               number;
    description:      string;
    usuario_emitente: UsuarioEmitente;
    historial:        Historial[];
}

export interface Historial {
    id:                 number;
    action_description: string;
}

export interface UsuarioEmitente {
    correo:          string;
    username:        string;
    password:        string;
    nombre_completo: string;
    foto_url:        string;
    role:            string;
    account_status:  boolean;
    privacity_mode:  boolean;
}


export interface UsuarioEmitente {
    correo: string;
}

export interface ShareItineraryRequest {
  descripcion: string;
  privacity_mode: boolean;
  fotos: File[];
}

export interface Foto {
  id: number;
  foto_url: string;
}

export interface Publicacion {
  id: number;
  descripcion?: string | null;
  privacity_mode: boolean;
  itinerario: { id: number; nombre?: string; title?: string } | null;
  fotos?: Foto[];
  resenas?: Resena[];
  user_shared?: Usuario;
  [key: string]: any;
}

export interface UpdatePublicationRequest {
  descripcion?: string;
  privacity_mode?: boolean;
}

export interface AverageRatingResponse {
  publicationId: number;
  averageRating: number;
  reviewCount: number;
}

export interface Actividad {
  fecha: string;
  description: string;
  lugarId: string;
  // Campos extendidos para tu UI moderna
  start_time?: string | null;
  end_time?: string | null;
}

export interface CreateItinerarioRequest {
  title: string;
  actividades: Actividad[];
  // Campos extendidos del BuilderMeta
  start_date?: string;
  end_date?: string;
  regions?: string[];
  visibility?: string;
}

export interface DashboardStatsResponse {
  usuarios: {
    total: number;
    nuevosEsteMes: number; 
    crecimiento: string;   
  };
  metricasGenerales: {
    totalLugares: number;
    totalItinerarios: number;
    reportesPendientes: number;
  };
  timestamp: string;
}


// ==========================================
// NUEVAS INTERFACES ADMIN (Reportes y Usuarios)
// ==========================================

export interface AdminReportPreview {
  reporte_id: number;
  motivo_reporte: string;
  estatus?: string; // "Publicación eliminada previamente" si aplica
  data: {
    publicacion_id: number;
    descripcion: string;
    fotos: string[]; // Array de URLs de las fotos
    itinerario_id: number | null;
    itinerario_titulo: string;
  } | null;
}

export interface DeleteUserResponse {
  message: string;
  deletedUser: string;
}

// Actualizamos la interfaz principal ApiRoutes con las 2 nuevas funciones
export interface ApiRoutes {
  // ... (Todo lo que ya tenías) ...

  // [NUEVO] Vista previa de reportes (con fotos y todo junto)
  getAdminReportsPreview: () => Promise<AdminReportPreview[]>;

  // [NUEVO] Eliminar usuario por username (más fácil que por ID)
  deleteUserByUsername: (username: string) => Promise<DeleteUserResponse>;
}