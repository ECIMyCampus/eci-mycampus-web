import { describe, expect, it } from 'vitest';
import { CampusEvent } from '../../types';
import { groupRadarEvents, startsInLabel } from './schedule';

const now = new Date('2026-11-18T15:00:00');

const event = (id: string, start: string, live = false): CampusEvent =>
  ({
    id,
    title: id,
    description: '',
    category: 'ACADEMICO',
    organizerId: 'o',
    organizerName: 'o',
    buildingId: 'b',
    specificLocation: '',
    startTime: start,
    endTime: start,
    originalEndTime: start,
    status: 'PUBLICADO',
    isLive: live,
    isPublic: true,
    requiresRegistration: false,
    price: 0,
  }) as CampusEvent;

describe('groupRadarEvents', () => {
  it('pone primero lo que está en vivo y luego agrupa por día en orden', () => {
    const groups = groupRadarEvents(
      [
        event('ahora', '2026-11-18T14:00:00', true),
        event('tarde', '2026-11-18T18:00:00'),
        event('noche', '2026-11-18T20:00:00'),
        event('manana', '2026-11-19T09:00:00'),
        event('sabado', '2026-11-21T09:00:00'),
      ],
      now,
    );

    expect(groups.map((g) => g.label)).toEqual(['En vivo ahora', 'Hoy', 'Mañana', expect.stringMatching(/^Sábado/)]);
    expect(groups[0].live).toBe(true);
    expect(groups[1].events.map((e) => e.id)).toEqual(['tarde', 'noche']);
  });

  it('no crea grupos vacíos', () => {
    expect(groupRadarEvents([], now)).toEqual([]);
    expect(groupRadarEvents([event('x', '2026-11-19T09:00:00')], now).map((g) => g.label)).toEqual(['Mañana']);
  });
});

describe('startsInLabel', () => {
  it('dice cuánto falta solo cuando es pronto', () => {
    expect(startsInLabel('2026-11-18T15:35:00', now)).toBe('Empieza en 35 min');
    expect(startsInLabel('2026-11-18T17:00:00', now)).toBe('Empieza en 2 h');
    expect(startsInLabel('2026-11-18T16:30:00', now)).toBe('Empieza en 1 h 30 min');
  });

  it('no dice nada si falta mucho o si ya empezó', () => {
    expect(startsInLabel('2026-11-18T22:00:00', now)).toBeNull();
    expect(startsInLabel('2026-11-18T14:00:00', now)).toBeNull();
  });
});
