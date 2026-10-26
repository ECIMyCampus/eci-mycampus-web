import React from 'react';
import Link from 'next/link';
import { Compass, MapPin, Sparkles, Filter } from 'lucide-react';
import { EventCard } from '../components/radar/EventCard';
import { CampusEvent } from '../types';

// Eventos de demostración para el piloto inicial
const DEMO_EVENTS: CampusEvent[] = [
  {
    id: 'evt-1',
    title: 'Torneo Interfacultades de Futsal: Sistemas vs. Civil',
    description: 'Fase de cuartos de final del torneo universitario. Asiste y apoya a tu facultad en las canchas múltiples.',
    category: 'DEPORTIVO',
    buildingId: 'COL-OTO',
    specificLocation: 'Coliseo El Otoño - Cancha Principal',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 7200000).toISOString(),
    originalEndTime: new Date(Date.now() + 7200000).toISOString(),
    status: 'PUBLICADO',
    temporalStatus: 'EN_CURSO',
    isLive: true,
    isPublic: true,
    requiresRegistration: false,
    price: 0,
    organizerId: 'org-1',
    organizerName: 'Bienestar Universitario',
  },
  {
    id: 'evt-2',
    title: 'Taller de Drones Autónomos y Robótica con ROS2',
    description: 'Semillero de innovación. Aprende algoritmos de navegación para drones en ambientes cerrados. Cupos limitados a capacidad de laboratorio.',
    category: 'ACADEMICO',
    buildingId: 'BLQ-F',
    specificLocation: 'Bloque F - Laboratorio F-201',
    startTime: new Date(Date.now() + 10800000).toISOString(),
    endTime: new Date(Date.now() + 18000000).toISOString(),
    originalEndTime: new Date(Date.now() + 18000000).toISOString(),
    status: 'PUBLICADO',
    temporalStatus: 'PROXIMO',
    isLive: false,
    isPublic: true,
    requiresRegistration: true,
    totalCapacity: 20,
    availableCapacity: 6,
    price: 0,
    organizerId: 'org-2',
    organizerName: 'Semillero I+D+i',
  },
  {
    id: 'evt-3',
    title: 'Club de Debate: Inteligencia Artificial y Ética Profesional',
    description: 'Espacio de discusión abierta sobre el impacto de los modelos fundacionales en la práctica de la ingeniería colombiana.',
    category: 'CULTURAL',
    buildingId: 'BIB-LLR',
    specificLocation: 'Biblioteca Jorge Álvarez Lleras - Auditorio',
    startTime: new Date(Date.now() + 86400000).toISOString(),
    endTime: new Date(Date.now() + 93600000).toISOString(),
    originalEndTime: new Date(Date.now() + 93600000).toISOString(),
    status: 'PUBLICADO',
    temporalStatus: 'PROXIMO',
    isLive: false,
    isPublic: true,
    requiresRegistration: true,
    totalCapacity: 40,
    availableCapacity: 18,
    price: 0,
    organizerId: 'org-3',
    organizerName: 'Humanidades ECI',
  },
];

export default function HomePage() {
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
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-eci-red-light" />
            <h2 className="text-lg font-bold text-white">Radar de Actividades</h2>
          </div>
          <span className="text-xs text-slate-400">3 eventos encontrados</span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {DEMO_EVENTS.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    </div>
  );
}
