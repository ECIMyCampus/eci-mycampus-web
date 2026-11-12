'use client';

import React, { useState } from 'react';
import { Check, Copy, Move } from 'lucide-react';
import type { CampusPoint } from '../../lib/map/map-service';
import { Button } from '../ui/Button';

/** Tabla de coordenadas lista para pegar en demo-data.ts. */
export function formatCoordinates(points: CampusPoint[]): string {
  const rows = points.map((p) => `  '${p.code}': [${p.coordinates[0]}, ${p.coordinates[1]}],`);
  return ['export const POINT_COORDINATES: Record<string, [number, number]> = {', ...rows, '};'].join('\n');
}

interface CalibrationPanelProps {
  points: CampusPoint[];
  movedCount: number;
}

/** Herramienta de desarrollo (/mapa?calibrar): entrega las coordenadas de los pines arrastrados. */
export function CalibrationPanel({ points, movedCount }: CalibrationPanelProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(formatCoordinates(points)).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="rounded-card border border-line-strong bg-surface p-4" aria-label="Calibración de coordenadas">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Move className="h-4 w-4" aria-hidden="true" /> Modo calibración
        </h3>
        <Button size="sm" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? 'Copiado' : 'Copiar coordenadas'}
        </Button>
      </div>
      <p className="mt-1 text-xs text-ink-muted">
        Arrastra cada pin hasta su edificio. Cuando termines, copia la tabla y pégala en
        <code className="mx-1 rounded bg-surface-raised px-1">src/lib/map/demo-data.ts</code>
        en lugar de POINT_COORDINATES. Movidos: {movedCount} de {points.length}.
      </p>
      <pre className="mt-3 overflow-x-auto rounded-control bg-canvas p-3 text-xs leading-relaxed text-ink">{formatCoordinates(points)}</pre>
    </section>
  );
}
