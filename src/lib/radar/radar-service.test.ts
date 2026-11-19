import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEMO_BUILDINGS, DEMO_SPORTS, createDemoEvents } from '../map/demo-data';
import {
  buildPlaceIndex,
  capacityLabel,
  countLabel,
  filterEvents,
  loadRadar,
  placeName,
  priceLabel,
  sortEvents,
} from './radar-service';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const places = buildPlaceIndex(
  DEMO_BUILDINGS.map((b) => (b.code === 'BLQ-F' ? { ...b, id: 'uuid-f' } : b)),
  DEMO_SPORTS,
);

describe('radar de actividades', () => {
  it('muestra el nombre del lugar aunque el evento traiga el id del backend', () => {
    const [, drones] = createDemoEvents();

    expect(placeName({ ...drones, buildingId: 'uuid-f' }, places)).toBe('Bloque F');
    expect(placeName({ ...drones, buildingId: 'BLQ-F' }, places)).toBe('Bloque F');
    expect(placeName({ ...drones, buildingId: 'desconocido' }, places)).toBe('desconocido');
  });

  it('filtra por categoría y por lo que está en vivo', () => {
    const events = createDemoEvents();

    expect(filterEvents(events, places, { filter: 'TODOS' })).toHaveLength(3);
    expect(filterEvents(events, places, { filter: 'EN_VIVO' }).map((e) => e.id)).toEqual(['evt-1']);
    expect(filterEvents(events, places, { filter: 'CULTURAL' }).map((e) => e.id)).toEqual(['evt-3']);
    expect(filterEvents(events, places, { filter: 'BIENESTAR' })).toEqual([]);
  });

  it('filtra por lugar con el código aunque el evento use el id', () => {
    const events = createDemoEvents().map((e) => (e.buildingId === 'BLQ-F' ? { ...e, buildingId: 'uuid-f' } : e));

    expect(filterEvents(events, places, { place: 'BLQ-F' }).map((e) => e.id)).toEqual(['evt-2']);
    expect(filterEvents(events, places, { place: 'uuid-f' }).map((e) => e.id)).toEqual(['evt-2']);
    expect(filterEvents(events, places, { place: 'BLQ-A' })).toEqual([]);
  });

  it('ordena con lo que está en vivo primero', () => {
    const [live, soon, later] = createDemoEvents();

    expect(sortEvents([later, soon, live]).map((e) => e.id)).toEqual(['evt-1', 'evt-2', 'evt-3']);
  });

  it('escribe cupos, precios y conteos en singular y plural', () => {
    expect(capacityLabel(0)).toBe('Aforo lleno');
    expect(capacityLabel(1)).toBe('1 cupo libre');
    expect(capacityLabel(18)).toBe('18 cupos libres');
    expect(priceLabel(0)).toBe('Gratis');
    expect(priceLabel('no-es-numero')).toBe('Gratis');
    expect(priceLabel('15000').replace(/\s/g, ' ')).toMatch(/^\$\s?15\.000$/);
    expect(countLabel(1)).toBe('1 actividad');
    expect(countLabel(3)).toBe('3 actividades');
  });
});

describe('carga del radar', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('usa el backend cuando responde, incluso sin eventos', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/radar/')) return jsonResponse(200, { data: [] });
        if (url.includes('/campus/buildings')) return jsonResponse(200, DEMO_BUILDINGS);
        return jsonResponse(200, DEMO_SPORTS);
      }),
    );

    const data = await loadRadar();

    expect(data.source).toBe('api');
    expect(data.events).toEqual([]);
    expect(data.places['COL-OTO'].name).toBe('Coliseo El Otoño');
  });

  it('muestra los eventos aunque falle el catálogo de lugares', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/radar/')) return jsonResponse(200, { data: createDemoEvents() });
        return jsonResponse(500, { mensaje: 'fallo' });
      }),
    );

    const data = await loadRadar();

    expect(data.source).toBe('api');
    expect(data.events).toHaveLength(3);
    expect(data.places).toEqual({});
  });

  it('recurre a los datos de ejemplo si el backend no responde', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin conexión')));

    const data = await loadRadar();

    expect(data.source).toBe('demo');
    expect(data.events).toHaveLength(3);
  });
});
