import { afterEach, describe, expect, it, vi } from 'vitest';
import { CampusEvent } from '../../types';
import { DEMO_BUILDINGS, DEMO_SPORTS, POINT_COORDINATES, createDemoEvents } from './demo-data';
import { buildPoints, filterPoints, loadCampusMapData, resolvePosition, sortByActivity } from './map-service';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const demoPoints = () => buildPoints(DEMO_BUILDINGS, DEMO_SPORTS, createDemoEvents());

describe('puntos del mapa', () => {
  it('ubica todos los edificios y escenarios de ejemplo', () => {
    const points = demoPoints();
    expect(points).toHaveLength(Object.keys(POINT_COORDINATES).length);
    expect(points.filter((p) => p.kind === 'DEPORTIVO').map((p) => p.code)).toEqual(['COL-OTO', 'CAN-FUT']);
  });

  it('asocia los eventos por id o por código y cuenta los que están en vivo', () => {
    const events = createDemoEvents();
    const byUuid = { ...DEMO_BUILDINGS.find((b) => b.code === 'BLQ-F')!, id: 'uuid-f' };
    const points = buildPoints([byUuid], DEMO_SPORTS, [...events, { ...events[1], id: 'evt-x', buildingId: 'uuid-f' }]);

    expect(points.find((p) => p.code === 'BLQ-F')?.events.map((e) => e.id)).toEqual(['evt-2', 'evt-x']);
    expect(points.find((p) => p.code === 'COL-OTO')?.liveCount).toBe(1);
  });

  it('pone primero los eventos en curso y descarta los finalizados', () => {
    const [live, next] = createDemoEvents();
    const events: CampusEvent[] = [
      { ...next, id: 'proximo', buildingId: 'BLQ-A' },
      { ...next, id: 'pasado', buildingId: 'BLQ-A', temporalStatus: 'FINALIZADO' },
      { ...live, id: 'vivo', buildingId: 'BLQ-A' },
    ];
    const [blockA] = buildPoints([DEMO_BUILDINGS[0]], [], events);
    expect(blockA.events.map((e) => e.id)).toEqual(['vivo', 'proximo']);
  });

  it('omite los puntos sin coordenadas o inactivos', () => {
    const points = buildPoints(
      [{ ...DEMO_BUILDINGS[0], code: 'SIN-UBICAR' }, { ...DEMO_BUILDINGS[1], isActive: false }],
      [],
      [],
    );
    expect(points).toEqual([]);
  });

  it('prefiere la ubicación del backend sobre la tabla local', () => {
    const fromApi = { ...DEMO_BUILDINGS[0], latitude: 4.5, longitude: -74.5 };
    expect(resolvePosition(fromApi)).toEqual([-74.5, 4.5]);
    expect(buildPoints([fromApi], [], [])[0].coordinates).toEqual([-74.5, 4.5]);
  });

  it('usa la tabla local si el backend no trae ubicación', () => {
    expect(resolvePosition({ code: 'BLQ-A', latitude: null, longitude: null })).toEqual(POINT_COORDINATES['BLQ-A']);
    expect(resolvePosition({ code: 'SIN-UBICAR' })).toBeNull();
  });

  it('ubica un lugar nuevo del backend aunque no esté en la tabla local', () => {
    const nuevo = { ...DEMO_BUILDINGS[0], id: 'uuid-n', code: 'BLQ-NUEVO', latitude: 4.78, longitude: -74.04 };
    expect(buildPoints([nuevo], [], []).map((p) => p.code)).toEqual(['BLQ-NUEVO']);
  });

  it('filtra por tipo y por actividad en vivo', () => {
    const points = demoPoints();
    expect(filterPoints(points, 'TODOS')).toHaveLength(points.length);
    expect(filterPoints(points, 'EDIFICIO').every((p) => p.kind === 'EDIFICIO')).toBe(true);
    expect(filterPoints(points, 'EN_VIVO').map((p) => p.code)).toEqual(['COL-OTO']);
  });

  it('ordena la lista con la actividad en vivo primero', () => {
    expect(sortByActivity(demoPoints()).slice(0, 3).map((p) => p.code)).toEqual(['COL-OTO', 'BIB-LLR', 'BLQ-F']);
  });
});

describe('carga de datos del mapa', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('usa el backend cuando responde', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/campus/buildings')) return jsonResponse(200, [{ ...DEMO_BUILDINGS[2], id: 'uuid-c' }]);
      if (url.includes('/campus/sports')) return jsonResponse(200, []);
      return jsonResponse(200, { data: [{ ...createDemoEvents()[0], buildingId: 'uuid-c' }] });
    });
    vi.stubGlobal('fetch', fetchMock);

    const data = await loadCampusMapData();

    expect(data.source).toBe('api');
    expect(data.points).toHaveLength(1);
    expect(data.points[0]).toMatchObject({ code: 'BLQ-C', liveCount: 1 });
  });

  it('muestra los puntos sin eventos si solo falla el radar', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/campus/buildings')) return jsonResponse(200, DEMO_BUILDINGS);
      if (url.includes('/campus/sports')) return jsonResponse(200, DEMO_SPORTS);
      return jsonResponse(500, { mensaje: 'fallo' });
    });
    vi.stubGlobal('fetch', fetchMock);

    const data = await loadCampusMapData();

    expect(data.source).toBe('api');
    expect(data.points.every((p) => p.events.length === 0)).toBe(true);
  });

  it('recurre a los datos de ejemplo si el backend no responde', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin conexión')));

    const data = await loadCampusMapData();

    expect(data.source).toBe('demo');
    expect(data.points).toHaveLength(Object.keys(POINT_COORDINATES).length);
  });
});
