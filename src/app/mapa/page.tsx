import React from 'react';
import { CampusMapViewer } from '../../components/map/CampusMapViewer';
import { MapPin, Info } from 'lucide-react';

export default function MapaPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-sky-400" />
            <h1 className="text-xl font-bold text-white">Mapa Interactivo del Campus ECI</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Toca cualquier edificio para consultar sus laboratorios, decanaturas y eventos programados.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-300">
          <Info className="h-3.5 w-3.5 text-amber-400" />
          <span>Usa dos dedos para zoom en el celular</span>
        </div>
      </div>

      <CampusMapViewer />
    </div>
  );
}
