import {
  ApiRoutes,
  ErrorResponse,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  Usuario,
  CreateItinerarioRequest,
  CreateItinerarioResponse,
  ItinerarioListResponse,
  RecommendationRequest,
  RecommendedLugar,
  OptimizationRequest,
  CreateLugarRequest,
  LugarData,
  LugaresListResponse,
  UpdateUserRequest,
  UpdatePasswordRequest,
  VerifyPasswordRequest,
  SearchUserResponse,
  SendFriend,
  CountFriendsResponse, 
  CancelRequest,
  RespondFriend,
  ListRequest,
  ListFriend,
  Amigo,
  RawNotification,
  MarkAsReadResponse,
  FriendSuggestionResponse,
  ShareItineraryRequest,
  Publicacion,
  AverageRatingResponse,
  SearchFriend,
  ListRecomen,
  Block,
  UnBlock,
  ListBlock,
  CreateResenaRequest,
  UpdateResenaRequest,
  Resena,
  PublicacionConResenas,
  CreateReportResponse,
  Reporte,
  ItinerarioData,
  DashboardStatsResponse,
  UserInfoResponse,
  AdminReportPreview, 
  DeleteUserResponse,  
  UpdatePublicationRequest
} from "./interfaces/ApiRoutes";

export class ItinerariosAPI implements ApiRoutes {
  private static instance: ItinerariosAPI;

  private HOST = "https://harol-lovers.up.railway.app";
  // private HOST = "https://harol-lovers.up.railway.app"

  private constructor() {}

  static getInstance(): ItinerariosAPI {
    if (!ItinerariosAPI.instance) this.instance = new ItinerariosAPI();
    return this.instance;
  }

  // ===== PETICIONES GENÉRICAS =====

  private async post<T>(
    route: string,
    auth: boolean,
    body: object
  ): Promise<T> {
    const token = auth ? localStorage.getItem("authToken") : undefined;
    const request = await fetch(`${this.HOST}${route}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...(token && { token }),
      },
    });

    const data = await request.json();

    if (!request.ok) {
      const { message } = data as ErrorResponse;
      throw new Error(message);
    }

    return data as T;
  }

  private async put<T>(route: string, auth: boolean, body: object): Promise<T> {
    const token = auth ? localStorage.getItem("authToken") : undefined;
    const request = await fetch(`${this.HOST}${route}`, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...(token && { token }),
      },
    });
    console.log("Hice la petición");
    console.log(request);

    const data = await request.json();

    console.log("Parsee los datos a JSON, " + request.status);
    console.log(data);

    if (!request.ok) {
      const { message } = data as ErrorResponse;
      throw new Error(message);
    }

    return data as T;
  }

  private async putFormData<T>(route: string, formData: FormData): Promise<T> {
    const token = localStorage.getItem("authToken") || "";
    const request = await fetch(`${this.HOST}${route}`, {
      method: "PUT",
      body: formData,
      headers: {
        ...(token && { token }),
      },
    });

    const data = await request.json();

    if (!request.ok) {
      const { message } = data as ErrorResponse;
      throw new Error(message);
    }

    return data as T;
  }

  private async patch<T>(
    route: string,
    auth: boolean,
    body: object = {}
  ): Promise<T> {
    const token = auth ? localStorage.getItem("authToken") : undefined;
    const request = await fetch(`${this.HOST}${route}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...(token && { token }),
      },
    });

    const data = await request.json();

    if (!request.ok) {
      const { message } = data as ErrorResponse;
      throw new Error(message);
    }

    return data as T;
  }

  private async patchEmpty(
    route: string,
    auth: boolean,
    body: object = {}
  ): Promise<void> {
    const token = auth ? localStorage.getItem("authToken") : undefined;
    const request = await fetch(`${this.HOST}${route}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...(token && { token }),
      },
    });

    if (!request.ok) {
      // Si hay error, intentamos leer el mensaje
      const data = (await request.json().catch(() => ({}))) as ErrorResponse;
      throw new Error(data.message || `Error ${request.status}`);
    }
  }

  private async get<T>(route: string, auth: boolean = true): Promise<T> {
    const token = auth ? localStorage.getItem("authToken") : undefined;
    const request = await fetch(`${this.HOST}${route}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { token }),
      },
    });

    let data: any;
    try {
      data = await request.json();
    } catch (parseError) {
      console.warn(`No se pudo parsear JSON de ${route}:`, parseError);
      data = {};
    }

    if (!request.ok) {
      const errorData = data as ErrorResponse;
      const errorMessage =
        errorData?.message || `Error ${request.status}: ${request.statusText}`;
      console.warn(`[${request.status}] ${route}: ${errorMessage}`);
      const err: any = new Error(errorMessage);
      err.status = request.status;
      err.route = route;
      throw err;
    }

    return data as T;
  }

  private async delete<T>(route: string): Promise<T> {
    const token = localStorage.getItem("authToken") || "";
    console.log('DELETE request to:', `${this.HOST}${route}`);
    const request = await fetch(`${this.HOST}${route}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        token,
      },
    });

    // Verificar si la respuesta tiene contenido antes de intentar parsear JSON
    const text = await request.text();
    let data;
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      // Si el parsing falla y la respuesta fue exitosa, asumir que no hay body
      if (request.ok) {
        return {} as T;
      }
      throw new Error("Respuesta inválida del servidor");
    }

    if (!request.ok) {
      console.error('DELETE failed. Status:', request.status);
      console.error('Response data:', data);
      const { message } = data as ErrorResponse;
      throw new Error(message);
    }

    return data as T;
  }

  // ===== AUTH =====
  async doLogin(correo: string, password: string): Promise<Usuario> {
    const { token, usuario } = await this.put<LoginResponse>("/auth", false, {
      correo,
      password,
    });

    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(usuario));
    window.dispatchEvent(new Event("storage")); //Para que se muestren los mensajes de la otra cuenta

    return usuario;
  }
  async doRegister(body: RegisterRequest): Promise<RegisterResponse> {
    const resp = await this.post<RegisterResponse>(
      "/auth/register",
      false,
      body
    );
    return resp;
  }

  // ===== ITINERARIOS =====
  async createItinerario(
    body: CreateItinerarioRequest
  ): Promise<CreateItinerarioResponse> {
    return await this.post<CreateItinerarioResponse>(
      "/itinerario/registro",
      true,
      body
    );
  }

  async getMyItinerarios(): Promise<ItinerarioListResponse> {
    return await this.get<ItinerarioListResponse>("/itinerario", true);
  }

  async deleteItinerario(id: number | string): Promise<{ message: string }> {
    return await this.delete<{ message: string }>(`/itinerario/${id}`);
  }

  async getItinerarioById(id: number | string): Promise<ItinerarioData> {
    return await this.get<ItinerarioData>(`/itinerario/${id}`, true);
  }

  async updateItinerario(
    id: number | string,
    body: CreateItinerarioRequest
  ): Promise<CreateItinerarioResponse> {
    return await this.put<CreateItinerarioResponse>(
      `/itinerario/${id}`,
      true,
      body
    );
  }

  // ===== RECOMENDACIÓN Y OPTIMIZACIÓN =====
  async getRecommendations(
    body: RecommendationRequest
  ): Promise<RecommendedLugar[]> {
    return await this.post<RecommendedLugar[]>(
      "/itinerario/recommendation",
      true,
      body
    );
  }

  async optimizeRoute(body: OptimizationRequest): Promise<LugarData[]> {
    return await this.post<LugarData[]>("/itinerario/optimization", true, body);
  }

  // ===== LUGARES =====
  async createLugar(body: CreateLugarRequest): Promise<LugarData> {
    return await this.post<LugarData>("/lugar/registro", true, body);
  }

  async getLugares(
    page: number = 1,
    limit: number = 10,
    state?: string,
    category?: string,
    nombre?: string
  ): Promise<LugaresListResponse> {
    let query = `/lugar?page=${page}&limit=${limit}`;

    if (state) query += `&mexican_state=${encodeURIComponent(state)}`;
    if (category) query += `&category=${encodeURIComponent(category)}`;
    if (nombre) query += `&nombre=${encodeURIComponent(nombre)}`;

    console.log("URL de la petición:", `${this.HOST}${query}`);
    return await this.get<LugaresListResponse>(query, true);
  }

  async getLugarById(id: string): Promise<LugarData> {
    return await this.get<LugarData>(`/lugar/${id}`, true);
  }

  async deleteLugar(id: string): Promise<{ message: string }> {
    console.log(`Enviando DELETE a: ${this.HOST}/lugar/${id}`);
    const result = await this.delete<{ message: string }>(`/lugar/${id}`);
    console.log("Resultado de deleteLugar:", result);
    return result;
  }

  // ===== USUARIO =====
  async getUser(): Promise<Usuario> {
    return await this.get<Usuario>("/user", true);
  }

  async getUserProfile(query: string): Promise<Usuario> {
    return await this.get<Usuario>(
      `/user/profile?q=${encodeURIComponent(query)}`,
      true
    );
  }

  async updateUser(body: UpdateUserRequest): Promise<Usuario> {
    // Si hay archivo (foto), usar FormData
    console.log(body);

    const formData = new FormData();

    if (body.username) formData.append("username", body.username);
    if (body.nombre_completo)
      formData.append("nombre_completo", body.nombre_completo);
    if (body.privacity_mode !== undefined)
      formData.append("privacity_mode", String(body.privacity_mode));
    if (body.foto) formData.append("foto", body.foto);

    return await this.putFormData<Usuario>("/user/update", formData);
  }

  async updatePassword(
    body: UpdatePasswordRequest
  ): Promise<{ message: string }> {
    return await this.put<{ message: string }>(
      "/user/update-password",
      true,
      body
    );
  }

  async verifyPassword(
    body: VerifyPasswordRequest
  ): Promise<{ message: boolean }> {
    return await this.post<{ message: boolean }>(
      "/user/verify-password",
      true,
      body
    );
  }

  async searchUsers(query: string): Promise<SearchUserResponse> {
    return await this.get<SearchUserResponse>(
      `/user/search?q=${encodeURIComponent(query)}`,
      true
    );
  }

  async getAllUsers(): Promise<SearchUserResponse> {
    try {
      return await this.get<SearchUserResponse>("/user/all", true);
    } catch (error) {
      const response = await this.searchUsers("");
      if (Array.isArray(response)) {
        return { users: response };
      }
      return response;
    }
  }

  async deleteUser(): Promise<{ message: string }> {
    return await this.delete<{ message: string }>("/user");
  }

  // ===== AMIGOS =====
  async sendFriendRequest(receiving: string): Promise<SendFriend> {
    return await this.post<SendFriend>("/amigo/solicitud", true, { receiving });
  }

  async cancelFriendRequest(receiving: string): Promise<CancelRequest> {
    return await this.post<CancelRequest>("/amigo/cancelar", true, { receiving });
  }
  async countFriends(correo: string): Promise<CountFriendsResponse> {
  return await this.get<CountFriendsResponse>(`/amigo/cont/${correo}`, true);
}

  async respondFriendRequest(
    id: number,
    state: number
  ): Promise<RespondFriend> {
    return await this.put<RespondFriend>("/amigo/respond", true, {
      Id: id,
      state: state,
    });
  }

  async getRequests(): Promise<ListRequest> {
    return await this.get<ListRequest>("/amigo/pendiente", true);
  }

  async getFriends(): Promise<ListFriend> {
    return await this.get<ListFriend>("/amigo", true);
  }

  async searchFriend(query: string): Promise<SearchFriend> {
    return await this.get<SearchFriend>(
      `/amigo/search?q=${encodeURIComponent(query)}`,
      true
    );
  }

  async deleteFriend(correo: string): Promise<{ message: string }> {
    return await this.delete<{ message: string }>(`/amigo/${correo}`);
  }

  async block(user: string): Promise<Block> {
    return await this.post<Block>("/amigo/block", true, { user });
  }

  async unblock(user: string): Promise<UnBlock> {
    return await this.post<UnBlock>("/amigo/unblock", true, { user });
  }

  async listblock(): Promise<ListBlock> {
    return await this.get<ListBlock>("/amigo/listblock", true);
  }

  // ===== RECOMENDACIONES =====
  async getRecomen(): Promise<ListRecomen> {
    return await this.get<ListRecomen>("/recomendacion", true);
  }
  // ===== SUGERENCIAS DE AMIGOS =====
  async getFriendSuggestions(): Promise<FriendSuggestionResponse> {
    return await this.get<FriendSuggestionResponse>("/amigo/sugerencias", true);
  }

  // ===== PUBLICACIONES =====

  async getAverageRating(
    publicationId: number
  ): Promise<AverageRatingResponse> {
    return await this.get<AverageRatingResponse>(
      `/publicacion/${publicationId}/promedio`,
      false
    );
  }

  async shareItinerary(
    itinerarioId: number,
    body: ShareItineraryRequest
  ): Promise<Publicacion> {
    const token = localStorage.getItem("authToken") || "";

    // Crear FormData para enviar archivos
    const formData = new FormData();

    formData.append("descripcion", body.descripcion);
    formData.append("privacity_mode", String(body.privacity_mode));

    // Añadir todas las fotos al FormData
    if (body.fotos && body.fotos.length > 0) {
      body.fotos.forEach((foto, index) => {
        formData.append("fotos", foto);
      });
    }

    const request = await fetch(
      `${this.HOST}/publicacion/share/${itinerarioId}`,
      {
        method: "POST",
        body: formData,
        headers: {
          ...(token && { token }),
        },
      }
    );

    const data = await request.json();

    if (!request.ok) {
      const { message } = data as ErrorResponse;
      throw new Error(message);
    }

    return data as Publicacion;
  }

  async getMyPublications(): Promise<Publicacion[]> {
    return await this.get<Publicacion[]>("/publicacion/", true);
  }

  async getPublicationWithResenas(
    publicacionId: number
  ): Promise<PublicacionConResenas> {
    return await this.get<PublicacionConResenas>(
      `/publicacion/${publicacionId}`,
      true
    );

  }

  async updatePublication(
    publicacionId: number,
    body: UpdatePublicationRequest
  ): Promise<Publicacion> {
    return await this.put<Publicacion>(
      `/publicacion/${publicacionId}`,
      true,
      body
    );
  }

  async deletePublication(publicacionId: number): Promise<{ message: string }> {
    return await this.delete<{ message: string }>(
      `/publicacion/${publicacionId}`
    );
  }

  // ===== NOTIFICACIONES =====
  async markNotificationAsRead(notificationId: string | number): Promise<void> {
    return await this.patchEmpty(`/notificacion/read/${notificationId}`, true);
  }

  async getNotifications(): Promise<RawNotification[]> {
    return await this.get<RawNotification[]>("/notificacion", true);
  }

  // ===== REPORTES =====
  async createReport(
    publicationId: number,
    reason: string
  ): Promise<CreateReportResponse> {
    return await this.post<CreateReportResponse>("/reports", true, {
      entity_id: publicationId,
      description: reason,
    });
  }

  async getReports(): Promise<Reporte[]> {
    try {
      return await this.get<Reporte[]>("/reports", true);
    } catch (error) {
      console.warn("Endpoint /reports no disponible, intentando /Reportes...");
      try {
        return await this.get<Reporte[]>("/Reportes", true);
      } catch (fallbackError) {
        console.error(
          "Ambos endpoints fallaron. Retornando array vacío.",
          fallbackError
        );
        return [];
      }
    }
  }

  async getReportById(reportId: number): Promise<Reporte> {
    try {
      return await this.get<Reporte>(`/reports/${reportId}`, true);
    } catch (error) {
      console.warn(
        `Endpoint /reports/${reportId} no disponible, intentando /Reportes/${reportId}...`
      );
      return await this.get<Reporte>(`/Reportes/${reportId}`, true);
    }
  }

  async deleteReport(reportId: number): Promise<void> {
    await this.delete<{ message: string }>(`/reports/${reportId}`);
  }

  // ===== RESEÑAS =====

  async createResena(
    publicacionId: number,
    body: CreateResenaRequest
  ): Promise<Resena> {
    return await this.post<Resena>(
      `/resena/publicacion/${publicacionId}`,
      true,
      body
    );
  }

  async updateResena(
    resenaId: number,
    body: UpdateResenaRequest
  ): Promise<Resena> {
    return await this.put<Resena>(`/resena/${resenaId}`, true, body);
  }

  async deleteResena(resenaId: number): Promise<Resena> {
    return await this.delete<Resena>(`/resena/${resenaId}`);
  }

  async getResenasByPublicacion(publicacionId: number): Promise<Resena[]> {
    return await this.get<Resena[]>(
      `/resena/publicacion/${publicacionId}`,
      true
    );
  }

  async getOtherUserInfo(username: string): Promise<UserInfoResponse> {
    return await this.get<UserInfoResponse>(
      `/user/profile/${encodeURIComponent(username)}`,
      true
    );
  }

  /**
   * Obtiene las estadísticas para el dashboard de administrador.
   * Ruta Back: GET /admin/dashboard/stats
   */
  async getAdminStats(): Promise<DashboardStatsResponse> {
    return await this.get<DashboardStatsResponse>(
      "/admin/dashboard/stats",
      true
    );
  }

  /**
   * Ejecuta la acción de Baneo basada en un reporte.

   * Nota: el id es el del reporte
   */
  async banPublication(reportId: number): Promise<{ message: string }> {
    return await this.post<{ message: string }>(
      `/reports/admin/ban/${reportId}`,
      true,
      {}
    );
  }

    /**
     * Trae todos los reportes con la info de la publicación ya "poblada"
     * (fotos, titulo itinerario, descripcion) para armar la card rápido.
     * Ruta Back: GET /reporte/admin/preview
     */
    async getAdminReportsPreview(): Promise<AdminReportPreview[]> {
        return await this.get<AdminReportPreview[]>("/reports/", true);
    }

    async deleteUserByUsername(username: string): Promise<DeleteUserResponse> {
        return await this.delete<DeleteUserResponse>(`/user/admin/delete/${encodeURIComponent(username)}`);
    }

  /**
   * Obtiene el detalle extendido de un reporte para el admin.
   * Ruta Back: GET /reports/id
   * Nota: el id es el del reporte
   */
  async getAdminReportDetail(reportId: number): Promise<Reporte> {
    return await this.get<Reporte>(`/reports/${reportId}`, true);
  }

  /**
   * Obtiene los detalles de una publicación.
   * Ruta Back: GET /publicacion/id
   */
  async getPublicacion(publicacionId: number): Promise<Publicacion> {
    return await this.get<Publicacion>(`/publicacion/${publicacionId}`, true);
  }
}
