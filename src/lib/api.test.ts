import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, api, onUnauthorized } from './api';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('cliente de la API', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('consulta el radar con sus filtros a través del proxy', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, []));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.getRadarEvents({ category: 'ACADEMICO' })).resolves.toEqual([]);

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/events/radar?category=ACADEMICO');
  });

  it('se inscribe sin manejar el token: la sesión viaja en la cookie', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, { id: 'r1' }));
    vi.stubGlobal('fetch', fetchMock);

    await api.registerToEvent('e1');

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/events/e1/register', { method: 'POST' });
  });

  it('cancela la inscripción con DELETE', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { id: 'r1', status: 'CANCELADA' }));
    vi.stubGlobal('fetch', fetchMock);

    await api.cancelRegistration('e1');

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/events/e1/register', { method: 'DELETE' });
  });

  it('envía el login como JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { user: { id: 'u1' } }));
    vi.stubGlobal('fetch', fetchMock);

    await api.login('ana@mail.escuelaing.edu.co', 'Secreto123');

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ana@mail.escuelaing.edu.co', password: 'Secreto123' }),
    });
  });

  it('cerrar sesión acepta la respuesta 204 sin cuerpo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(api.logout()).resolves.toBeUndefined();
  });

  it('usa el campo mensaje del contrato de error del backend y conserva el código y los detalles', async () => {
    const body = { mensaje: 'Cupos agotados', detalles: [{ campo: 'email', mensaje: 'Inválido' }] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(409, body)));

    const error = await api.registerToEvent('e1').catch((e) => e);

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error.message).toBe('Cupos agotados');
    expect(error.status).toBe(409);
    expect(error.details).toEqual([{ campo: 'email', mensaje: 'Inválido' }]);
  });

  it('usa un mensaje de respaldo si la respuesta de error no es JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('fallo', { status: 502 })));

    await expect(api.getBuildings()).rejects.toThrow('Error al consultar edificios');
  });

  it('explica con claridad cuando no hay conexión con el servidor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = await api.getRadarEvents().catch((e) => e);

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error.status).toBe(0);
    expect(error.message).toMatch(/No pudimos conectar con el servidor/);
  });

  it('avisa que la sesión venció solo cuando una acción con sesión recibe 401', async () => {
    const listener = vi.fn();
    const stop = onUnauthorized(listener);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { mensaje: 'Token inválido' })));
    await api.registerToEvent('e1').catch(() => undefined);
    expect(listener).toHaveBeenCalledTimes(1);

    // Un visitante consultando /me, o credenciales erróneas en el login, no es una sesión vencida.
    await api.getMe().catch(() => undefined);
    await api.login('a@mail.escuelaing.edu.co', 'x').catch(() => undefined);
    expect(listener).toHaveBeenCalledTimes(1);

    stop();
    await api.getMyRegistrations().catch(() => undefined);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
