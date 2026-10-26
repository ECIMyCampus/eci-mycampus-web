'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Clock, Users, ArrowRight } from 'lucide-react';
import { CampusEvent } from '../../types';
import { formatEventTime, formatEventDate } from '../../lib/utils';

interface EventCardProps {
  event: CampusEvent;
  onRegister?: (eventId: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onRegister }) => {
  const isLive = event.isLive || event.temporalStatus === 'EN_CURSO';
  const hasCapacity = event.availableCapacity !== null && event.availableCapacity !== undefined;
  const isFull = hasCapacity && event.availableCapacity === 0;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-eci-red/5">
      {/* Badge Superior: Estado Temporal y Categoría */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              EN VIVO
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
              {formatEventDate(event.startTime)}
            </span>
          )}
          <span className="inline-flex items-center rounded-full bg-eci-red/10 px-2.5 py-0.5 text-xs font-medium text-eci-red-light border border-eci-red/20">
            {event.category}
          </span>
        </div>

        {/* Precio o Gratuito */}
        <span className="text-xs font-semibold text-slate-300">
          {Number(event.price) > 0 ? `$${Number(event.price).toLocaleString('es-CO')}` : 'Gratis'}
        </span>
      </div>

      {/* Título y Resumen */}
      <h3 className="text-base font-bold text-slate-100 group-hover:text-white transition-colors line-clamp-2">
        {event.title}
      </h3>
      <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
        {event.description}
      </p>

      {/* Datos Espacio-Temporales */}
      <div className="mt-3 flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 text-sky-400">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="font-medium text-slate-300">{event.buildingId}</span>
          <span className="text-slate-500">• {event.specificLocation}</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400">
          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{formatEventTime(event.startTime)} - {formatEventTime(event.endTime)}</span>
        </div>
      </div>

      {/* Barra de Cupos y Acción */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
        {hasCapacity ? (
          <div className="flex items-center gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span className={isFull ? 'font-semibold text-rose-400' : 'text-slate-300'}>
              {isFull ? 'Aforo Lleno' : `${event.availableCapacity} cupos libres`}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Acceso libre</span>
        )}

        <div className="flex items-center gap-2">
          {event.requiresRegistration && onRegister && !isFull && (
            <button
              onClick={() => onRegister(event.id)}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-eci-red px-3 text-xs font-semibold text-white hover:bg-eci-red-light transition-all min-h-touch min-w-touch"
            >
              Inscribirme
            </button>
          )}
          <Link
            href={`/eventos/${event.id}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all min-h-touch min-w-touch"
            aria-label="Ver detalles del evento"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
};
