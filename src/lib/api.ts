import {
  ApiError as ApiErrorBody,
  AuthUser,
  Building,
  CampusEvent,
  EventRegistration,
  Faculty,
  MyRegistration,
  RegisterInput,
  SportsFacility,
} from '../types';

const API_BASE = '/api/v1';

/** Error de una llamada a la API, con el mensaje ya listo para mostrar a la persona. */
export class ApiRequestError extends Error {
  /** Código HTTP. `0` si ni siquiera hubo respuesta (sin conexión). */
  readonly status: number;
  /** Errores por campo que devuelve el backend en `detalles`. */
  readonly details: { campo: string; mensaje: string }[];

  constructor(message: string, status: number, details: { campo: string; mensaje: string }[] = []) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.details = details;
  }
}

const NETWORK_ERROR = 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';

type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();

/**
 * Avisa cuando una acción que exige sesión recibe 401: la sesión venció o se cerró en otra pestaña.
 * Devuelve la función para dejar de escuchar.
 */
export function onUnauthorized(listener: Listener): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  /** Mensaje si el backend no explica el error. */
  fallback: string;
  /** La acción exige sesión: un 401 significa que venció, y se avisa a quien escucha. */
  authed?: boolean;
}

/** Hace la llamada y traduce el contrato de error del backend (`{ mensaje, detalles }`) a `ApiRequestError`. */
async function request<T>(path: string, { method, body, fallback, authed = false }: RequestOptions): Promise<T> {
  const init: RequestInit | undefined =
    method || body !== undefined
      ? {
          method: method ?? 'POST',
          ...(body !== undefined && { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
        }
      : undefined;

  let res: Response;
  try {
    res = init ? await fetch(`${API_BASE}${path}`, init) : await fetch(`${API_BASE}${path}`);
  } catch {
    throw new ApiRequestError(NETWORK_ERROR, 0);
  }

  if (!res.ok) {
    if (res.status === 401 && authed) unauthorizedListeners.forEach((listener) => listener());
    const errorData: Partial<ApiErrorBody> = await res.json().catch(() => ({}));
    throw new ApiRequestError(errorData.mensaje || fallback, res.status, errorData.detalles ?? []);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Cuenta y sesión (la sesión viaja en una cookie HttpOnly: el JavaScript nunca ve el token)
  login(email: string, password: string): Promise<{ user: AuthUser }> {
    return request('/auth/login', { body: { email, password }, fallback: 'No pudimos iniciar sesión' });
  },

  register(input: RegisterInput): Promise<{ message: string }> {
    return request('/auth/register', { body: input, fallback: 'No pudimos crear tu cuenta' });
  },

  /** `401` aquí es lo normal para un visitante: no se trata como sesión vencida. */
  getMe(): Promise<AuthUser> {
    return request('/auth/me', { fallback: 'No pudimos consultar tu perfil' });
  },

  logout(): Promise<void> {
    return request('/auth/logout', { method: 'POST', fallback: 'No pudimos cerrar la sesión' });
  },

  // Radar y eventos
  async getRadarEvents(params?: { category?: string; facultyId?: string }): Promise<CampusEvent[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.facultyId) query.set('facultyId', params.facultyId);

    return request(`/events/radar?${query.toString()}`, { fallback: 'Error al consultar eventos del Radar' });
  },

  getEvent(eventId: string): Promise<CampusEvent> {
    return request(`/events/${encodeURIComponent(eventId)}`, { fallback: 'No pudimos cargar la actividad' });
  },

  /** Requiere sesión. */
  registerToEvent(eventId: string): Promise<EventRegistration> {
    return request(`/events/${encodeURIComponent(eventId)}/register`, {
      method: 'POST',
      fallback: 'Error al inscribirse al evento',
      authed: true,
    });
  },

  /** Requiere sesión. Devuelve el cupo al evento. */
  cancelRegistration(eventId: string): Promise<EventRegistration> {
    return request(`/events/${encodeURIComponent(eventId)}/register`, {
      method: 'DELETE',
      fallback: 'No pudimos cancelar tu inscripción',
      authed: true,
    });
  },

  /** Requiere sesión. Mis inscripciones vigentes, de la más próxima a la más lejana. */
  getMyRegistrations(): Promise<MyRegistration[]> {
    return request('/events/mine/registrations', { fallback: 'No pudimos cargar tu agenda', authed: true });
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
