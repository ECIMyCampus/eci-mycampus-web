import { api } from '../api';
import { Building, CampusEvent, CampusServiceInfo, SportsFacility } from '../../types';
import { DEMO_BUILDINGS, DEMO_SPORTS, POINT_COORDINATES, createDemoEvents } from './demo-data';

export type PointKind = 'EDIFICIO' | 'DEPORTIVO';
export type PointFilter = 'TODOS' | PointKind | 'EN_VIVO';

/** Un punto del mapa: un edificio o un escenario deportivo con lo que pasa en él. */
export interface CampusPoint {
  id: string;
  code: string;
  name: string;
  kind: PointKind;
  description: string | null;
  imageUrl?: string | null;
  /** [longitud, latitud] */
  coordinates: [number, number];
  floorsCount?: number;
  sportTypes: string[];
  services: CampusServiceInfo[];
  /** Eventos vigentes del punto: primero los que están en curso, luego por hora de inicio. */
  events: CampusEvent[];
  liveCount: number;
}

export interface CampusMapData {
  points: CampusPoint[];
  /** 'api' si los datos vienen del backend; 'demo' si se usaron los datos de ejemplo. */
  source: 'api' | 'demo';
}

export const isLiveEvent = (event: CampusEvent): boolean =>
  Boolean(event.isLive) || event.temporalStatus === 'EN_CURSO';

function eventsAt(place: { id: string; code: string }, events: CampusEvent[]): CampusEvent[] {
  return events
    .filter((e) => e.buildingId === place.id || e.buildingId === place.code)
    .filter((e) => e.temporalStatus !== 'FINALIZADO')
    .sort(
      (a, b) =>
        Number(isLiveEvent(b)) - Number(isLiveEvent(a)) || a.startTime.localeCompare(b.startTime),
    );
}

/**
 * Ubicación de un lugar: manda la que entrega el backend; si aún no la tiene,
 * se usa la tabla local por código. Devuelve null si no hay ninguna.
 */
export function resolvePosition(
  place: { code: string; latitude?: number | null; longitude?: number | null },
  fallback: Record<string, [number, number]> = POINT_COORDINATES,
): [number, number] | null {
  if (typeof place.latitude === 'number' && typeof place.longitude === 'number') {
    return [place.longitude, place.latitude];
  }
  return fallback[place.code] ?? null;
}

/** Une edificios, escenarios y eventos en puntos del mapa. Omite los que no tienen coordenadas. */
export function buildPoints(
  buildings: Building[],
  sports: SportsFacility[],
  events: CampusEvent[],
  coordinates: Record<string, [number, number]> = POINT_COORDINATES,
): CampusPoint[] {
  const points: CampusPoint[] = [];

  for (const b of buildings) {
    const position = resolvePosition(b, coordinates);
    if (!position || !b.isActive) continue;
    const placed = eventsAt(b, events);
    const defaultImage = DEMO_BUILDINGS.find((d) => d.code === b.code)?.imageUrl ?? null;
    points.push({
      id: b.id,
      code: b.code,
      name: b.name,
      kind: 'EDIFICIO',
      description: b.description ?? null,
      imageUrl: b.imageUrl ?? defaultImage,
      coordinates: position,
      floorsCount: b.floorsCount,
      sportTypes: [],
      services: b.services ?? [],
      events: placed,
      liveCount: placed.filter(isLiveEvent).length,
    });
  }

  for (const s of sports) {
    const position = resolvePosition(s, coordinates);
    if (!position || !s.isActive) continue;
    const placed = eventsAt(s, events);
    points.push({
      id: s.id,
      code: s.code,
      name: s.name,
      kind: 'DEPORTIVO',
      description: null,
      imageUrl: null,
      coordinates: position,
      sportTypes: s.sportTypes,
      services: [],
      events: placed,
      liveCount: placed.filter(isLiveEvent).length,
    });
  }

  return points;
}

export function filterPoints(points: CampusPoint[], filter: PointFilter): CampusPoint[] {
  if (filter === 'TODOS') return points;
  if (filter === 'EN_VIVO') return points.filter((p) => p.liveCount > 0);
  return points.filter((p) => p.kind === filter);
}

/** Puntos con actividad en curso primero, luego los que tienen eventos próximos. */
export function sortByActivity(points: CampusPoint[]): CampusPoint[] {
  return [...points].sort(
    (a, b) => b.liveCount - a.liveCount || b.events.length - a.events.length || a.name.localeCompare(b.name),
  );
}

/**
 * Carga los puntos del mapa desde el backend. Si el backend no responde (o no devuelve
 * ningún punto ubicable) usa los datos de ejemplo, para que el mapa nunca quede vacío.
 */
export async function loadCampusMapData(): Promise<CampusMapData> {
  try {
    const [buildings, sports] = await Promise.all([api.getBuildings(), api.getSportsFacilities()]);
    // Si solo falla el radar, el mapa se muestra igual, sin eventos.
    const events = await api.getRadar({ limit: 50 }).then((page) => page.data).catch(() => [] as CampusEvent[]);
    const points = buildPoints(buildings, sports, events);
    if (points.length === 0) throw new Error('El backend no devolvió puntos ubicables');
    return { points, source: 'api' };
  } catch {
    return { points: buildPoints(DEMO_BUILDINGS, DEMO_SPORTS, createDemoEvents()), source: 'demo' };
  }
}
