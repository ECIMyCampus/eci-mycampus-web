import React from 'react';
import Link from 'next/link';
import { Compass, MapPin, Sparkles, Filter, X } from 'lucide-react';
import { EventCard } from '../components/radar/EventCard';
import { CampusMap } from '../components/map/CampusMap';
import { DEMO_BUILDINGS, DEMO_SPORTS, createDemoEvents } from '../lib/map/demo-data';

// Eventos de demostración para el piloto inicial
const DEMO_EVENTS = createDemoEvents();

interface HomePageProps {
  searchParams?: Promise<{ edificio?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const buildingFilter = params.edificio?.trim() || null;
  const matchedPlace = buildingFilter
    ? [...DEMO_BUILDINGS, ...DEMO_SPORTS].find((p) => p.code === buildingFilter || p.id === buildingFilter)
    : null;
  const visibleEvents = buildingFilter
    ? DEMO_EVENTS.filter((e) => e.buildingId === buildingFilter)
    : DEMO_EVENTS;

  const categories = ['Todos', 'En Vivo', 'Académico', 'Deportivo', 'Cultural', 'Semilleros'];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Banner de Bienvenida Mobile-First */}
      <section className="mb-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-eci-red/10 p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-eci-red/30 bg-eci-red/10 px-3 py-1 text-xs font-semibold text-eci-red-light mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Campus Universitario ECI en Tiempo Real
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl text-white">
          ¿Qué está pasando <span className="text-eci-red-light">ahora mismo</span> en la Escuela?
        </h1>
        <p className="mt-2 text-sm text-slate-300 max-w-xl leading-relaxed">
          Descubre eventos en vivo, reserva cupos en laboratorios y ubica cualquier salón en el mapa interactivo del campus.
        </p>

        {/* Acceso rápido a Mapa y Publicación */}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/mapa"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-eci-red px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-eci-red/20 hover:bg-eci-red-light transition-all min-h-touch min-w-touch"
          >
            <MapPin className="h-4 w-4" />
            Explorar Mapa del Campus
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all min-h-touch min-w-touch"
          >
            Publicar Actividad
          </Link>
        </div>
      </section>

      {/* El campus en el mapa */}
      <section className="mb-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white">El campus en el mapa</h2>
          </div>
          <Link href="/mapa" className="text-xs font-semibold text-eci-red-light hover:text-white transition-colors">
            Abrir mapa completo →
          </Link>
        </div>
        <CampusMap variant="preview" />
      </section>

      {/* Filtros Rápidos de Categoría (Scroll Horizontal en Móviles) */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-slate-400 border border-slate-800 flex-shrink-0">
          <Filter className="h-4 w-4" />
        </div>
        {categories.map((cat, idx) => (
          <button
            key={cat}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all min-h-touch ${
              idx === 0
                ? 'bg-eci-red text-white shadow-md shadow-eci-red/20'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Feed del Radar de Eventos */}
      <section id="radar" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Compass className="h-5 w-5 text-eci-red-light" />
            <h2 className="text-lg font-bold text-white">Radar de Actividades</h2>
            {buildingFilter && (
              <Link
                href="/#radar"
                className="inline-flex items-center gap-1.5 rounded-full border border-eci-red/40 bg-eci-red/15 px-3 py-1 text-xs font-semibold text-slate-100 hover:bg-eci-red/25"
                aria-label="Quitar filtro de edificio"
              >
                <span>{matchedPlace ? `${matchedPlace.name} (${buildingFilter})` : buildingFilter}</span>
                <X className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
          <span className="text-xs text-slate-400">
            {visibleEvents.length} {visibleEvents.length === 1 ? 'evento encontrado' : 'eventos encontrados'}
          </span>
        </div>

        {visibleEvents.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-300">
            No hay actividades programadas en este lugar por ahora.{' '}
            <Link href="/#radar" className="font-semibold text-eci-red-light hover:text-white">
              Ver todas las actividades →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
