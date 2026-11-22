import React from 'react';
import { Program } from '../../lib/programs/programs';

/**
 * Tamaño de letra que hace caber la palabra más larga del texto dentro del cuadro (ancho útil de ~78 %), sin partirla.
 * Se expresa en `cqw`, relativo al ancho del propio cuadro, y se limita por arriba para los cuadros grandes.
 * El cuadro que lo use debe tener `container-type: inline-size`.
 */
export const fitFont = (text: string, maxRem: number): string => {
  const longest = Math.max(...text.split(' ').map((word) => word.length));
  return `min(${(78 / (longest * 0.62)).toFixed(1)}cqw, ${maxRem}rem)`;
};

/** El nombre del programa como va en un cuadro: lo que antecede («Ingeniería de») pequeño y lo principal en grande. */
export function ProgramLabel({ program, compact = false }: { program: Program; compact?: boolean }) {
  const [prefix, main] = program.lines;
  return (
    <>
      {prefix && (
        <span className="leading-tight opacity-85" style={{ fontSize: `min(9cqw, ${compact ? 0.6 : 0.8}rem)` }}>
          {prefix}
        </span>
      )}
      <span className="font-display font-extrabold leading-[1.1]" style={{ fontSize: fitFont(main, compact ? 0.8 : 1.05) }}>
        {main}
      </span>
    </>
  );
}
