import {
  ApiError as ApiErrorBody,
  AuthUser,
  Building,
  CampusEvent,
  EventRegistration,
  Faculty,
  RadarPage,
  SportsFacility,
} from '../types';
import { getAccessToken, setAccessToken } from './session/token-store';

const API_BASE = '/api/v1';

/** Error de una llamada a la API, con el mensaje ya listo para mostrar a la persona. */
export class ApiRequestError extends Error {
  /** Código HTTP. `0` si ni siquiera hubo respuesta (sin conexión). */
  readonly status: number;
  /** Errores por campo que devuelve el backend en `detalles`. */
  readonly details: { campo: string; mensaje: string }[];
  /** Con un 429: segundos que indica el servidor (`Retry-After`) antes de volver a intentar. */
  readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    status: number,
    details: { campo: string; mensaje: string }[] = [],
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.details = details;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const NETWORK_ERROR = 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';

type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();

/**
 * Avisa cuando la sesión terminó sin que la persona lo pidiera: una acción con sesión recibió 401
 * y el refresco tampoco pudo renovarla. Devuelve la función para dejar de escuchar.
 */
export function onUnauthorized(listener: Listener): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Mensaje si el backend no explica el error. */
  fallback: string;
  /** La acción exige sesión: se envía el token y un 401 intenta renovarla una vez. */
  authed?: boolean;
}

const JSON_HEADERS = { 'content-type': 'application/json' };

/**
 * Renueva el token de acceso con la cookie de refresco (HttpOnly: el JavaScript no la ve).
 * El refresco rota: si dos llamadas lo piden a la vez comparten una sola petición, porque la
 * segunda usaría una cookie ya invalidada.
 */
let refreshing: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST', headers: JSON_HEADERS, body: '{}' });
        if (!res.ok) {
          setAccessToken(null);
          return false;
        }
        const { token } = (await res.json()) as { token: string };
        setAccessToken(token);
        return true;
      } catch {
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

async function send(path: string, { method, body, authed }: RequestOptions): Promise<Response> {
  const token = authed ? getAccessToken() : null;
  const hasInit = method || body !== undefined || token;
  if (!hasInit) return fetch(`${API_BASE}${path}`);

  return fetch(`${API_BASE}${path}`, {
    method: method ?? (body !== undefined ? 'POST' : 'GET'),
    ...((body !== undefined || token) && {
      headers: {
        ...(body !== undefined && JSON_HEADERS),
        ...(token && { authorization: `Bearer ${token}` }),
      },
    }),
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
}

/** Hace la llamada y traduce el contrato de error del backend (`{ mensaje, detalles }`) a `ApiRequestError`. */
async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const { fallback, authed = false } = options;

  let res: Response;
  try {
    res = await send(path, options);
    if (res.status === 401 && authed) {
      // El token de 15 minutos venció: se renueva una vez y se reintenta.
      if (await refreshSession()) {
        res = await send(path, options);
      }
      if (res.status === 401) {
        setAccessToken(null);
        unauthorizedListeners.forEach((listener) => listener());
      }
    }
  } catch {
    throw new ApiRequestError(NETWORK_ERROR, 0);
  }

  if (!res.ok) {
    const errorData: Partial<ApiErrorBody> = await res.json().catch(() => ({}));
    const retryAfter = Number(res.headers.get('retry-after'));
    throw new ApiRequestError(
      errorData.mensaje || fallback,
      res.status,
      errorData.detalles ?? [],
      res.status === 429 && Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Filtros de `GET /radar/`. Los que no se envían no filtran. */
export interface RadarQuery {
  page?: number;
  limit?: number;
  category?: string;
  facultyId?: string;
  buildingId?: string;
  modality?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  accessType?: string;
  isFree?: boolean;
  featuredOnly?: boolean;
  activeOnly?: boolean;
}

export const api = {
  // Cuenta y sesión. El token de acceso se guarda en memoria; el de refresco viaja en una cookie HttpOnly.
  async login(email: string, password: string): Promise<{ user: AuthUser }> {
    const result = await request<{ token: string; user: AuthUser }>('/auth/login', {
      body: { email, password },
      fallback: 'No pudimos iniciar sesión',
    });
    setAccessToken(result.token);
    return { user: result.user };
  },

  /** Perfil de la sesión actual. */
  getMe(): Promise<AuthUser> {
    return request('/auth/me', { fallback: 'No pudimos consultar tu perfil', authed: true });
  },

  /**
   * Recupera la sesión al abrir la aplicación: renueva el token con la cookie y pide el perfil.
   * `null` significa visitante (no hay sesión o ya venció), que es lo normal.
   */
  async restoreSession(): Promise<AuthUser | null> {
    if (!(await refreshSession())) return null;
    return this.getMe().catch(() => null);
  },

  /** Cierra la sesión en el servidor; el token local se descarta aunque la llamada falle. */
  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST', body: {}, fallback: 'No pudimos cerrar la sesión' });
    } finally {
      setAccessToken(null);
    }
  },

  // Radar y eventos
  getRadar(query: RadarQuery = {}): Promise<RadarPage> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '' && value !== false) params.set(key, String(value));
    }
    const qs = params.toString();
    return request(`/radar/${qs ? `?${qs}` : ''}`, { fallback: 'No pudimos cargar el radar' });
  },

  getEvent(eventId: string): Promise<CampusEvent> {
    return request(`/events/${encodeURIComponent(eventId)}`, { fallback: 'No pudimos cargar la actividad', authed: true });
  },

  // Inscripciones (requieren sesión)
  registerToEvent(eventId: string): Promise<EventRegistration> {
    return request(`/registrations/events/${encodeURIComponent(eventId)}`, {
      method: 'POST',
      fallback: 'No pudimos inscribirte a la actividad',
      authed: true,
    });
  },

  /** Devuelve el cupo al evento. El backend solo lo permite hasta 2 horas antes. */
  cancelRegistration(eventId: string): Promise<EventRegistration> {
    return request(`/registrations/events/${encodeURIComponent(eventId)}`, {
      method: 'DELETE',
      fallback: 'No pudimos cancelar tu inscripción',
      authed: true,
    });
  },

  /** Mis inscripciones, con los datos del evento. */
  getItinerary(): Promise<EventRegistration[]> {
    return request('/registrations/itinerary', { fallback: 'No pudimos cargar tu agenda', authed: true });
  },

  // Campus y edificios
  getBuildings(): Promise<Building[]> {
    return request('/campus/buildings', { fallback: 'Error al consultar edificios' });
  },

  getSportsFacilities(): Promise<SportsFacility[]> {
    return request('/campus/sports', { fallback: 'Error al consultar escenarios deportivos' });
  },

  getFaculties(): Promise<Faculty[]> {
    return request('/campus/faculties', { fallback: 'Error al consultar facultades' });
  },
};
