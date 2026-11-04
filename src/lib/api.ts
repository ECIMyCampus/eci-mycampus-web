import { ApiError, CampusEvent, Building, EventRegistration, Faculty } from '../types';

const API_BASE = '/api/v1';

/** Extrae el mensaje del ErrorResponseDTO estándar del backend. */
async function toApiError(res: Response, fallback: string): Promise<Error> {
  const errorData: Partial<ApiError> = await res.json().catch(() => ({}));
  return new Error(errorData.mensaje || fallback);
}

export const api = {
  // Radar y Eventos
  async getRadarEvents(params?: { category?: string; facultyId?: string }): Promise<CampusEvent[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.facultyId) query.set('facultyId', params.facultyId);

    const res = await fetch(`${API_BASE}/events/radar?${query.toString()}`);
    if (!res.ok) throw await toApiError(res, 'Error al consultar eventos del Radar');
    return res.json();
  },

  /** Requiere sesión: el events-service responde 401 sin token Bearer. */
  async registerToEvent(eventId: string, token: string): Promise<EventRegistration> {
    const res = await fetch(`${API_BASE}/events/${eventId}/register`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw await toApiError(res, 'Error al inscribirse al evento');
    return res.json();
  },

  // Campus y Edificios
  async getBuildings(): Promise<Building[]> {
    const res = await fetch(`${API_BASE}/campus/buildings`);
    if (!res.ok) throw await toApiError(res, 'Error al consultar edificios');
    return res.json();
  },

  async getFaculties(): Promise<Faculty[]> {
    const res = await fetch(`${API_BASE}/campus/faculties`);
    if (!res.ok) throw await toApiError(res, 'Error al consultar facultades');
    return res.json();
  },
};
