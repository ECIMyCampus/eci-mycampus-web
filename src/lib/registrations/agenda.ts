import { EventRegistration } from '../../types';

/** El backend solo deja cancelar hasta 2 horas antes del inicio. */
export const CANCEL_LIMIT_MS = 2 * 60 * 60 * 1000;

/** ¿Todavía se puede devolver el cupo? Sin hora de inicio se deja intentar: el backend decide. */
export function canCancel(startTime: string | undefined, now: Date = new Date()): boolean {
  if (!startTime) return true;
  return new Date(startTime).getTime() - now.getTime() > CANCEL_LIMIT_MS;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Día local de una fecha (aaaa-mm-dd), para agrupar la agenda por día. */
export const dayKey = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** «Hoy», «Mañana» o el día completo («jueves 20 de noviembre»). */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const target = new Date(iso);
  const diffDays = Math.round((startOfDay(target) - startOfDay(now)) / 86_400_000);
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Mañana';
  const label = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(target);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export interface AgendaDay {
  key: string;
  label: string;
  items: EventRegistration[];
}

export interface Agenda {
  /** Reservas vigentes que aún no terminan, agrupadas por día y en orden de inicio. */
  upcoming: AgendaDay[];
  /** Lo demás: actividades que ya pasaron, a las que asistió o canceladas; la más reciente primero. */
  history: EventRegistration[];
}

const endOf = (item: EventRegistration) => item.endTime ?? item.startTime;

/** Separa la agenda entre lo que viene y el historial. */
export function splitAgenda(items: EventRegistration[], now: Date = new Date()): Agenda {
  const isUpcoming = (item: EventRegistration) => {
    if (item.status !== 'CONFIRMADA') return false;
    const end = endOf(item);
    return !end || new Date(end).getTime() >= now.getTime();
  };
  const byStart = (a: EventRegistration, b: EventRegistration) => (a.startTime ?? '').localeCompare(b.startTime ?? '');

  const upcoming = items.filter(isUpcoming).sort(byStart);
  const history = items.filter((item) => !isUpcoming(item)).sort((a, b) => byStart(b, a));

  const days: AgendaDay[] = [];
  for (const item of upcoming) {
    const key = item.startTime ? dayKey(item.startTime) : 'sin-fecha';
    const last = days[days.length - 1];
    if (last && last.key === key) {
      last.items.push(item);
    } else {
      days.push({ key, label: item.startTime ? dayLabel(item.startTime, now) : 'Sin fecha', items: [item] });
    }
  }
  return { upcoming: days, history };
}

/** ¿La actividad está ocurriendo ahora mismo? */
export function isOngoing(item: EventRegistration, now: Date = new Date()): boolean {
  if (item.status !== 'CONFIRMADA' || !item.startTime || !item.endTime) return false;
  return new Date(item.startTime).getTime() <= now.getTime() && now.getTime() <= new Date(item.endTime).getTime();
}
