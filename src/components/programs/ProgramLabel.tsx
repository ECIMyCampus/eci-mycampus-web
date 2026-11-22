import React from 'react';
import { Program } from '../../lib/programs/programs';

/**
 * Tamaño de letra que hace caber la palabra más larga del texto dentro del cuadro (ancho útil de ~80 %), sin partirla.
 * Se expresa en `cqw`, relativo al ancho del propio cuadro, y se limita por arriba para los cuadros grandes.
 * El cuadro que lo use debe tener `container-type: inline-size`.
 */
export const fitFont = (text: string, maxRem: number): string => {
  const longest = Math.max(...text.split(' ').map((word) => word.length));
  return `min(${(80 / (longest * 0.6)).toFixed(1)}cqw, ${maxRem}rem)`;
};

/**
 * El nombre del programa como va en un cuadro: lo que antecede («Ingeniería de») en cursiva pequeña y lo principal
 * grande, en la serif editorial. Va por encima de la luz y del grano del cuadro.
 */
export function ProgramLabel({ program, compact = false, maxRem = 2.6 }: { program: Program; compact?: boolean; maxRem?: number }) {
  const [prefix, main] = program.lines;
  return (
    <span className="relative z-[1] flex flex-col">
      {prefix && (
        <span className="font-program italic leading-tight opacity-90" style={{ fontSize: `min(10cqw, ${compact ? 0.7 : 1}rem)` }}>
          {prefix}
        </span>
      )}
      <span className="font-program font-bold leading-[0.98] tracking-[-0.02em]" style={{ fontSize: fitFont(main, compact ? Math.min(maxRem, 1.5) : maxRem) }}>
        {main}
      </span>
    </span>
  );
}
