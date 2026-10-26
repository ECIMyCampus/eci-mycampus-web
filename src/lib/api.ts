import { CampusEvent, Building, Faculty } from '../types';

const API_BASE = '/api/v1';

export const api = {
  // Radar y Eventos
  async getRadarEvents(params?: { category?: string; facultyId?: string }): Promise<CampusEvent[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.facultyId) query.set('facultyId', params.facultyId);

    const res = await fetch(`${API_BASE}/events/radar?${query.toString()}`);
    if (!res.ok) throw new Error('Error al consultar eventos del Radar');
    return res.json();
  },

  async registerToEvent(eventId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/events/${eventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al inscribirse al evento');
    }
    return res.json();
  },

  // Campus y Edificios
  async getBuildings(): Promise<Building[]> {
    const res = await fetch(`${API_BASE}/campus/buildings`);
    if (!res.ok) throw new Error('Error al consultar edificios');
    return res.json();
  },

  async getFaculties(): Promise<Faculty[]> {
    const res = await fetch(`${API_BASE}/campus/faculties`);
    if (!res.ok) throw new Error('Error al consultar facultades');
    return res.json();
  },
};
