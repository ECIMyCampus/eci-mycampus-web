import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';

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

  it('envía el token Bearer al inscribirse', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, { id: 'r1' }));
    vi.stubGlobal('fetch', fetchMock);

    await api.registerToEvent('e1', 'token-1');

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/events/e1/register', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-1' },
    });
  });

  it('usa el campo mensaje del contrato de error del backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(409, { mensaje: 'Cupos agotados' })));

    await expect(api.registerToEvent('e1', 't')).rejects.toThrow('Cupos agotados');
  });

  it('usa un mensaje de respaldo si la respuesta de error no es JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('fallo', { status: 502 })));

    await expect(api.getBuildings()).rejects.toThrow('Error al consultar edificios');
  });
});
