import { api } from '../api';
import { Building, CampusEvent, EventCategory, SportsFacility } from '../../types';
import { DEMO_BUILDINGS, DEMO_SPORTS, createDemoEvents } from '../map/demo-data';
import { isLiveEvent } from '../map/map-service';

export type RadarFilter = 'TODOS' | 'EN_VIVO' | EventCategory;

export interface RadarPlace {
  code: string;
  name: string;
}

/** Lugares del campus indexados por id y por código: un evento puede traer cualquiera de los dos. */
export type PlaceIndex = Record<string, RadarPlace>;

export interface RadarData {
  events: CampusEvent[];
  places: PlaceIndex;
  /** 'api' si los datos vienen del backend; 'demo' si se usaron los datos de ejemplo. */
  source: 'api' | 'demo';
}

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  ACADEMICO: 'Académico',
  DEPORTIVO: 'Deportivo',
  CULTURAL: 'Cultural',
  ESTUDIANTIL: 'Estudiantil',
  INSTITUCIONAL: 'Institucional',
  BIENESTAR: 'Bienestar',
};

export const RADAR_FILTERS: { value: RadarFilter; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'EN_VIVO', label: 'En vivo' },
  ...(Object.keys(CATEGORY_LABELS) as EventCategory[]).map((value) => ({ value, label: CATEGORY_LABELS[value] })),
];

export function buildPlaceIndex(buildings: Building[], sports: SportsFacility[]): PlaceIndex {
  const index: PlaceIndex = {};
  for (const place of [...buildings, ...sports]) {
    const entry = { code: place.code, name: place.name };
    index[place.id] = entry;
    index[place.code] = entry;
  }
  return index;
}

/** Nombre legible del lugar de un evento; si no se conoce, el identificador tal cual. */
export function placeName(event: CampusEvent, places: PlaceIndex): string {
  return places[event.buildingId]?.name ?? event.buildingId;
}

/** Filtra por categoría (o "en vivo") y, si se indica, por lugar (id o código). */
export function filterEvents(
  events: CampusEvent[],
  places: PlaceIndex,
  options: { filter?: RadarFilter; place?: string | null } = {},
): CampusEvent[] {
  const { filter = 'TODOS', place = null } = options;
  const placeCode = place ? (places[place]?.code ?? place) : null;

  return events.filter((event) => {
    if (placeCode) {
      const eventCode = places[event.buildingId]?.code ?? event.buildingId;
      if (eventCode !== placeCode) return false;
    }
    if (filter === 'TODOS') return true;
    if (filter === 'EN_VIVO') return isLiveEvent(event);
    return event.category === filter;
  });
}

/** Primero lo que está pasando ahora; luego por hora de inicio. */
export function sortEvents(events: CampusEvent[]): CampusEvent[] {
  return [...events].sort(
    (a, b) => Number(isLiveEvent(b)) - Number(isLiveEvent(a)) || a.startTime.localeCompare(b.startTime),
  );
}

export function capacityLabel(available: number): string {
  if (available <= 0) return 'Aforo lleno';
  return available === 1 ? '1 cupo libre' : `${available.toLocaleString('es-CO')} cupos libres`;
}

export function priceLabel(price: string | number): string {
  const value = Number(price);
  if (!Number.isFinite(value) || value <= 0) return 'Gratis';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

export function countLabel(count: number): string {
  return count === 1 ? '1 actividad' : `${count.toLocaleString('es-CO')} actividades`;
}

/**
 * Carga el radar desde el backend. Si el backend no responde usa los datos de ejemplo,
 * para que el inicio nunca quede vacío por un fallo de red.
 */
export async function loadRadar(): Promise<RadarData> {
  try {
    const events = await api.getRadarEvents();
    // Los nombres de los lugares son un complemento: si fallan, el radar se muestra igual.
    const [buildings, sports] = await Promise.all([
      api.getBuildings().catch(() => [] as Building[]),
      api.getSportsFacilities().catch(() => [] as SportsFacility[]),
    ]);
    return { events: sortEvents(events), places: buildPlaceIndex(buildings, sports), source: 'api' };
  } catch {
    return {
      events: sortEvents(createDemoEvents()),
      places: buildPlaceIndex(DEMO_BUILDINGS, DEMO_SPORTS),
      source: 'demo',
    };
  }
}
