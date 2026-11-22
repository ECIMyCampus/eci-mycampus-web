import { describe, expect, it } from 'vitest';
import { EventRegistration } from '../../types';
import { canCancel, dayLabel, isOngoing, splitAgenda } from './agenda';

const now = new Date('2026-11-18T15:00:00');

const reg = (id: string, start: string, end: string, status: EventRegistration['status'] = 'CONFIRMADA'): EventRegistration => ({
  id,
  eventId: `e-${id}`,
  userId: 'u1',
  status,
  registeredAt: '2026-11-10T10:00:00',
  cancelledAt: null,
  eventTitle: `Actividad ${id}`,
  startTime: start,
  endTime: end,
});

describe('canCancel', () => {
  it('permite cancelar con más de 2 horas de margen y no después', () => {
    expect(canCancel('2026-11-18T17:30:00', now)).toBe(true);
    expect(canCancel('2026-11-18T16:59:00', now)).toBe(false);
    expect(canCancel('2026-11-18T14:00:00', now)).toBe(false);
  });

  it('deja intentar si la agenda no trae la hora de inicio', () => {
    expect(canCancel(undefined, now)).toBe(true);
  });
});

describe('dayLabel', () => {
  it('dice hoy y mañana, y el día completo para el resto', () => {
    expect(dayLabel('2026-11-18T20:00:00', now)).toBe('Hoy');
    expect(dayLabel('2026-11-19T08:00:00', now)).toBe('Mañana');
    expect(dayLabel('2026-11-21T08:00:00', now)).toMatch(/^Sábado,? 21 de noviembre/);
  });
});

describe('splitAgenda', () => {
  it('agrupa lo que viene por día en orden y manda lo demás al historial', () => {
    const agenda = splitAgenda(
      [
        reg('tarde', '2026-11-19T15:00:00', '2026-11-19T16:00:00'),
        reg('hoy', '2026-11-18T18:00:00', '2026-11-18T19:00:00'),
        reg('manana-temprano', '2026-11-19T08:00:00', '2026-11-19T09:00:00'),
        reg('pasada', '2026-11-17T08:00:00', '2026-11-17T09:00:00'),
        reg('cancelada', '2026-11-20T08:00:00', '2026-11-20T09:00:00', 'CANCELADA'),
        reg('asistio', '2026-11-10T08:00:00', '2026-11-10T09:00:00', 'ASISTIO'),
      ],
      now,
    );

    expect(agenda.upcoming.map((day) => day.label)).toEqual(['Hoy', 'Mañana']);
    expect(agenda.upcoming[1].items.map((item) => item.id)).toEqual(['manana-temprano', 'tarde']);
    expect(agenda.history.map((item) => item.id)).toEqual(['cancelada', 'pasada', 'asistio']);
  });

  it('mantiene como próxima la actividad que está en curso', () => {
    const ongoing = reg('ahora', '2026-11-18T14:00:00', '2026-11-18T16:00:00');
    const agenda = splitAgenda([ongoing], now);

    expect(agenda.upcoming).toHaveLength(1);
    expect(isOngoing(ongoing, now)).toBe(true);
    expect(isOngoing(reg('x', '2026-11-18T18:00:00', '2026-11-18T19:00:00'), now)).toBe(false);
  });
});
