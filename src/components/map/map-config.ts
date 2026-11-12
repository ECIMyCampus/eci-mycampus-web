import type { PointFilter } from '../../lib/map/map-service';

export type MapView = 'normal' | 'satellite' | '3d';

export const VIEWS: { value: MapView; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'satellite', label: 'Satélite' },
  { value: '3d', label: 'Vista 3D' },
];

export const FILTERS: { value: PointFilter; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'EDIFICIO', label: 'Edificios' },
  { value: 'DEPORTIVO', label: 'Deportes' },
  { value: 'EN_VIVO', label: 'En vivo' },
];
