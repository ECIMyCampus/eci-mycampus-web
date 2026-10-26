'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, MapPin, Calendar, User } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-eci-red text-white font-bold text-lg shadow-lg shadow-eci-red/20">
            ECI
          </div>
          <div>
            <span className="block font-bold text-slate-100 leading-tight">MyCampus</span>
            <span className="block text-[10px] text-slate-400">Escuela Colombiana de Ingeniería</span>
          </div>
        </Link>

        {/* Enlaces para Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            <Compass className="h-4 w-4 text-eci-red-light" />
            Radar en Vivo
          </Link>
          <Link
            href="/mapa"
            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            <MapPin className="h-4 w-4 text-sky-400" />
            Mapa del Campus
          </Link>
          <Link
            href="/mis-eventos"
            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            <Calendar className="h-4 w-4 text-amber-400" />
            Mi Agenda
          </Link>
        </nav>

        {/* Botón de Acceso */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-800 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 min-h-touch min-w-touch"
          >
            <User className="mr-2 h-4 w-4" />
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </header>
  );
};
