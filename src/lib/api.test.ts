import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, api, onUnauthorized } from './api';
import { getAccessToken, setAccessToken } from './session/token-store';

const jsonResponse = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

const authHeader = (init?: RequestInit) => (init?.headers as Record<string, string> | undefined)?.authorization;

describe('cliente de la API', () => {
  beforeEach(() => setAccessToken(null));
  afterEach(() => vi.unstubAllGlobals());

  describe('radar y eventos', () => {
    it('consulta el radar con sus filtros y descarta los vacíos', async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: [] }));
      vi.stubGlobal('fetch', fetchMock);

      await api.getRadar({ page: 2, limit: 10, category: 'ACADEMICO', search: '', isFree: true, featuredOnly: false });

      expect(fetchMock).toHaveBeenCalledWith('/api/v1/radar/?page=2&limit=10&category=ACADEMICO&isFree=true');
    });

    it('sin filtros pide el radar a secas', async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: [] }));
      vi.stubGlobal('fetch', fetchMock);

      await api.getRadar();

      expect(fetchMock).toHaveBeenCalledWith('/api/v1/radar/');
    });

    it('usa las rutas de inscripciones del backend', async () => {
      const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => jsonResponse(200, { id: 'r1' }));
      vi.stubGlobal('fetch', fetchMock);

      await api.registerToEvent('e1');
      await api.cancelRegistration('e1');
      await api.getItinerary();

      expect(fetchMock.mock.calls.map(([url, init]) => `${init?.method ?? 'GET'} ${url}`)).toEqual([
        'POST /api/v1/registrations/events/e1',
        'DELETE /api/v1/registrations/events/e1',
        'GET /api/v1/registrations/itinerary',
      ]);
    });
  });

  describe('sesión', () => {
    it('al iniciar sesión guarda el token en memoria y no lo devuelve a quien llama', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { token: 'tk1', refreshToken: 'no-usar', user: { id: 'u1' } })));

      const result = await api.login('ana@mail.escuelaing.edu.co', 'Secreto123');

      expect(result).toEqual({ user: { id: 'u1' } });
      expect(getAccessToken()).toBe('tk1');
    });

    it('envía el token como Bearer solo en las llamadas con sesión', async () => {
      setAccessToken('tk1');
      const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => jsonResponse(200, []));
      vi.stubGlobal('fetch', fetchMock);

      await api.getItinerary();
      await api.getBuildings();

      expect(authHeader(fetchMock.mock.calls[0][1])).toBe('Bearer tk1');
      expect(fetchMock.mock.calls[1]).toHaveLength(1);
    });

    it('si el token venció lo renueva una vez y repite la llamada', async () => {
      setAccessToken('viejo');
      const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
        if (url.endsWith('/auth/refresh')) return jsonResponse(200, { token: 'nuevo' });
        return authHeader(init) === 'Bearer nuevo' ? jsonResponse(200, [{ id: 'r1' }]) : jsonResponse(401, { mensaje: 'Token vencido' });
      });
      vi.stubGlobal('fetch', fetchMock);

      await expect(api.getItinerary()).resolves.toEqual([{ id: 'r1' }]);

      expect(getAccessToken()).toBe('nuevo');
      expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
        '/api/v1/registrations/itinerary',
        '/api/v1/auth/refresh',
        '/api/v1/registrations/itinerary',
      ]);
    });

    it('varias llamadas que vencen a la vez comparten un único refresco', async () => {
      setAccessToken('viejo');
      const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
        if (url.endsWith('/auth/refresh')) return jsonResponse(200, { token: 'nuevo' });
        return authHeader(init) === 'Bearer nuevo' ? jsonResponse(200, []) : jsonResponse(401, { mensaje: 'Vencido' });
      });
      vi.stubGlobal('fetch', fetchMock);

      await Promise.all([api.getItinerary(), api.getMe(), api.getEvent('e1')]);

      const refreshes = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/auth/refresh'));
      expect(refreshes).toHaveLength(1);
    });

    it('si el refresco falla cierra la sesión y avisa a quien escucha', async () => {
      setAccessToken('viejo');
      const listener = vi.fn();
      const stop = onUnauthorized(listener);
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string) =>
          url.endsWith('/auth/refresh') ? jsonResponse(401, { mensaje: 'Refresh inválido' }) : jsonResponse(401, { mensaje: 'Vencido' }),
        ),
      );

      const error = await api.registerToEvent('e1').catch((e) => e);

      expect(error).toBeInstanceOf(ApiRequestError);
      expect(error.status).toBe(401);
      expect(getAccessToken()).toBeNull();
      expect(listener).toHaveBeenCalledTimes(1);
      stop();
    });

    it('credenciales erróneas en el login no se tratan como sesión vencida', async () => {
      const listener = vi.fn();
      const stop = onUnauthorized(listener);
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401, { mensaje: 'Credenciales inválidas' }));
      vi.stubGlobal('fetch', fetchMock);

      await api.login('a@mail.escuelaing.edu.co', 'x').catch(() => undefined);

      expect(listener).not.toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      stop();
    });

    it('restaura la sesión al abrir: refresca y pide el perfil; sin cookie es visitante', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string) => (url.endsWith('/auth/refresh') ? jsonResponse(200, { token: 'tk' }) : jsonResponse(200, { id: 'u1' }))),
      );
      await expect(api.restoreSession()).resolves.toEqual({ id: 'u1' });

      setAccessToken(null);
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { mensaje: 'Sin sesión' })));
      await expect(api.restoreSession()).resolves.toBeNull();
    });

    it('cerrar sesión descarta el token aunque el servidor falle', async () => {
      setAccessToken('tk1');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(500, { mensaje: 'Error' })));

      await api.logout().catch(() => undefined);

      expect(getAccessToken()).toBeNull();
    });
  });

  describe('errores', () => {
    it('usa el campo mensaje del backend y conserva el código y los detalles', async () => {
      const body = { mensaje: 'Cupos agotados', detalles: [{ campo: 'email', mensaje: 'Inválido' }] };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(409, body)));

      const error = await api.registerToEvent('e1').catch((e) => e);

      expect(error.message).toBe('Cupos agotados');
      expect(error.status).toBe(409);
      expect(error.details).toEqual([{ campo: 'email', mensaje: 'Inválido' }]);
    });

    it('en un 429 conserva los segundos de espera del servidor', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse(429, { mensaje: 'Demasiados intentos. Vuelve a intentarlo en 42 segundos.' }, { 'retry-after': '42' })),
      );

      const error = await api.login('a@mail.escuelaing.edu.co', 'x').catch((e) => e);

      expect(error.status).toBe(429);
      expect(error.retryAfterSeconds).toBe(42);
    });

    it('usa un mensaje de respaldo si la respuesta de error no es JSON', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('fallo', { status: 502 })));

      await expect(api.getBuildings()).rejects.toThrow('Error al consultar edificios');
    });

    it('explica con claridad cuando no hay conexión con el servidor', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

      const error = await api.getRadar().catch((e) => e);

      expect(error).toBeInstanceOf(ApiRequestError);
      expect(error.status).toBe(0);
      expect(error.message).toMatch(/No pudimos conectar con el servidor/);
    });
  });
});
