'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Clock, Layers, MapPin, Trophy, X } from 'lucide-react';
import { CampusPoint, isLiveEvent } from '../../lib/map/map-service';
import { formatEventDate, formatEventTime } from '../../lib/utils';

interface PointCardProps {
  point: CampusPoint;
  onClose: () => void;
}

const MAX_EVENTS = 3;

/** Tarjeta de detalle de un punto del mapa. En celular sale desde abajo. */
export const PointCard: React.FC<PointCardProps> = ({ point, onClose }) => {
  const isBuilding = point.kind === 'EDIFICIO';
  const events = point.events.slice(0, MAX_EVENTS);

  return (
    <aside
      role="dialog"
      aria-label={`Detalle de ${point.name}`}
      className="campus-card absolute inset-x-0 bottom-0 z-30 max-h-[70%] overflow-y-auto rounded-t-2xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md md:inset-x-auto md:bottom-auto md:left-3 md:top-14 md:max-h-[calc(100%-11.5rem)] md:w-80 md:rounded-2xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex items-center gap-2 text-xs font-bold ${isBuilding ? 'text-eci-red-light' : 'text-amber-400'}`}>
          {isBuilding ? <Building2 className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
          <span>{point.code}</span>
          <span className="font-medium text-slate-400">· {isBuilding ? 'Edificio' : 'Escenario deportivo'}</span>
        </div>
        <button
          onClick={onClose}
          className="-mr-1 -mt-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Cerrar ficha"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <h3 className="mt-1 text-base font-bold text-white">{point.name}</h3>
      {point.description && <p className="mt-1 text-xs leading-relaxed text-slate-300">{point.description}</p>}

      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-300">
        {isBuilding && point.floorsCount !== undefined && point.floorsCount > 1 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5">
            <Layers className="h-3 w-3" /> {point.floorsCount} pisos
          </span>
        )}
        {point.sportTypes.map((sport) => (
          <span key={sport} className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-300">
            {sport}
          </span>
        ))}
        {point.services.map((service) => (
          <span key={service.id} className="rounded-full bg-slate-800 px-2 py-0.5" title={service.operatingHours ?? undefined}>
            {service.name}
          </span>
        ))}
      </div>

      <div className="mt-3 border-t border-slate-800 pt-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Actividades aquí</h4>
        {events.length === 0 ? (
          <p className="mt-1.5 text-xs text-slate-500">No hay actividades programadas en este lugar.</p>
        ) : (
          <ul className="mt-1.5 space-y-2">
            {events.map((event) => (
              <li key={event.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                <div className="flex items-center gap-2 text-[11px]">
                  {isLiveEvent(event) ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> EN VIVO
                    </span>
                  ) : (
                    <span className="text-slate-400">{formatEventDate(event.startTime)}</span>
                  )}
                  <span className="inline-flex items-center gap-1 text-amber-400">
                    <Clock className="h-3 w-3" /> {formatEventTime(event.startTime)}
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-100 line-clamp-2">{event.title}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                  <MapPin className="h-3 w-3 flex-shrink-0 text-sky-400" /> {event.specificLocation}
                </p>
              </li>
            ))}
          </ul>
        )}
        {point.events.length > MAX_EVENTS && (
          <p className="mt-1.5 text-[11px] text-slate-500">y {point.events.length - MAX_EVENTS} más</p>
        )}
      </div>

      <div className="mt-3 flex justify-end">
        <Link href="/" className="text-xs font-semibold text-eci-red-light hover:text-white transition-colors">
          Ver el radar de actividades →
        </Link>
      </div>
    </aside>
  );
};
