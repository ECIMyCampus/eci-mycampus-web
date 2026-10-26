'use client';

import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, MapPin, X } from 'lucide-react';

interface BuildingInfo {
  code: string;
  name: string;
  description: string;
}

const BUILDINGS_DATA: Record<string, BuildingInfo> = {
  'ECI-BLQ-A': { code: 'BLQ-A', name: 'Bloque A', description: 'Rectoría, Vicerrectoría, Admisiones y Registro Académico.' },
  'ECI-BLQ-B': { code: 'BLQ-B', name: 'Bloque B', description: 'Aulas de clases magistrales y dependencias de Ciencias Básicas.' },
  'ECI-BLQ-C': { code: 'BLQ-C', name: 'Bloque C', description: 'Decanatura de Ingeniería de Sistemas, Electrónica y Salas de Cómputo.' },
  'ECI-BLQ-D': { code: 'BLQ-D', name: 'Bloque D', description: 'Decanatura de Ingeniería Civil, Laboratorios de Suelos e Hidráulica.' },
  'ECI-BLQ-E': { code: 'BLQ-E', name: 'Bloque E', description: 'Ingeniería Industrial, Economía, Administración y Cafetería Central.' },
  'ECI-BLQ-F': { code: 'BLQ-F', name: 'Bloque F', description: 'Centro de Innovación y Desarrollo (I+D+i), Robótica y Posgrados.' },
  'ECI-BIB-LLR': { code: 'BIB-LLR', name: 'Biblioteca Jorge Álvarez Lleras', description: 'Salas de estudio individual y grupal, hemeroteca y auditorio.' },
  'ECI-COL-OTO': { code: 'COL-OTO', name: 'Coliseo El Otoño', description: 'Escenario deportivo cubierto para baloncesto, voleibol y eventos masivos.' },
  'ECI-CAN-FUT': { code: 'CAN-FUT', name: 'Cancha de Fútbol 1', description: 'Campo de fútbol reglamentario para torneos interfacultades y ASCUN.' },
};

export const CampusMapViewer: React.FC = () => {
  const [scale, setScale] = useState<number>(1);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(null);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.75));
  const handleReset = () => {
    setScale(1);
    setSelectedBuilding(null);
  };

  const handleSvgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest('.campus-building');
    if (target && target.id && BUILDINGS_DATA[target.id]) {
      setSelectedBuilding(BUILDINGS_DATA[target.id]);
    }
  };

  return (
    <div className="relative w-full h-[550px] md:h-[650px] overflow-hidden rounded-2xl border border-slate-800 bg-[#0B132B]">
      {/* Controles Flotantes de Zoom */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 rounded-xl bg-slate-900/90 p-1.5 border border-slate-800 shadow-xl backdrop-blur-md">
        <button
          onClick={handleZoomIn}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors min-h-touch min-w-touch"
          aria-label="Acercar mapa"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors min-h-touch min-w-touch"
          aria-label="Alejar mapa"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <button
          onClick={handleReset}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors min-h-touch min-w-touch"
          aria-label="Reiniciar vista"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Visor SVG con Zoom y Clic */}
      <div
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing p-4"
        onClick={handleSvgClick}
      >
        <div
          style={{ transform: `scale(${scale})`, transition: 'transform 0.2s ease-out' }}
          className="w-full h-full flex items-center justify-center"
        >
          <object
            type="image/svg+xml"
            data="/eci-campus-map.svg"
            className="w-full h-full max-w-full max-h-full pointer-events-auto"
            aria-label="Plano cartográfico ilustrado de la Escuela Colombiana de Ingeniería"
          />
        </div>
      </div>

      {/* Panel Inferior Flotante de Edificio Seleccionado */}
      {selectedBuilding && (
        <div className="absolute bottom-4 left-4 right-4 md:left-6 md:max-w-md z-30 rounded-2xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-eci-red-light font-bold text-sm">
              <MapPin className="h-4 w-4" />
              <span>{selectedBuilding.code}</span>
            </div>
            <button
              onClick={() => setSelectedBuilding(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
              aria-label="Cerrar ficha"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <h4 className="mt-1 text-base font-bold text-white">{selectedBuilding.name}</h4>
          <p className="mt-1 text-xs text-slate-300 leading-relaxed">{selectedBuilding.description}</p>
          <div className="mt-3 pt-2 border-t border-slate-800 flex justify-end">
            <button className="text-xs font-semibold text-eci-red-light hover:text-white transition-colors">
              Ver actividades en este bloque →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
