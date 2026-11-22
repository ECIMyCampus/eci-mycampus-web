import { CampusEvent } from '../../types';
import { isLiveEvent } from '../map/map-service';
import { dayKey, dayLabel } from '../registrations/agenda';

export interface RadarGroup {
  key: string;
  label: string;
  /** El grupo de lo que está pasando ahora mismo. */
  live: boolean;
  events: CampusEvent[];
}

/**
 * Ordena el radar en grupos: primero lo que está en vivo y luego cada día («Hoy», «Mañana», «Sábado 21 de noviembre»),
 * en el orden de inicio que ya traen los eventos. Un grupo sin eventos no existe.
 */
export function groupRadarEvents(events: CampusEvent[], now: Date = new Date()): RadarGroup[] {
  const groups: RadarGroup[] = [];
  const live = events.filter(isLiveEvent);
  if (live.length > 0) groups.push({ key: 'en-vivo', label: 'En vivo ahora', live: true, events: live });

  for (const event of events) {
    if (isLiveEvent(event)) continue;
    const key = dayKey(event.startTime);
    const last = groups[groups.length - 1];
    if (last && !last.live && last.key === key) last.events.push(event);
    else groups.push({ key, label: dayLabel(event.startTime, now), live: false, events: [event] });
  }
  return groups;
}

/**
 * Cuánto falta para que empiece, solo cuando es pronto («Empieza en 35 min», «Empieza en 2 h»). Más allá de 6 horas, o
 * si ya empezó, devuelve `null`: el grupo del día y la hora de la tarjeta ya lo dicen.
 */
export function startsInLabel(startTime: string, now: Date = new Date()): string | null {
  const minutes = Math.round((new Date(startTime).getTime() - now.getTime()) / 60_000);
  if (minutes <= 0 || minutes > 6 * 60) return null;
  if (minutes < 60) return `Empieza en ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest >= 15 && hours < 3 ? `Empieza en ${hours} h ${rest} min` : `Empieza en ${hours} h`;
}
