'use client';

import React from 'react';
import RawLetterGlitch from './LetterGlitch';

interface LetterGlitchProps {
  glitchColors?: string[];
  baseColor?: string;
  characters?: string;
  fontSize?: number;
  spacing?: number;
  density?: number;
  baseOpacity?: number;
  glitchAmount?: number;
  speed?: number;
  interactive?: boolean;
  cursorRadius?: number;
  clickEffect?: 'tear' | 'burst' | 'none';
  flow?: number;
  edgeFade?: number;
}

/** La pieza de React Bits es JavaScript sin tipos: aquí se le da la forma de sus propiedades. */
const LetterGlitch = RawLetterGlitch as unknown as React.ComponentType<LetterGlitchProps>;

/**
 * Fondo de letras de la sección de carreras, con los colores de la app: el rojo del logotipo y su tono claro para los
 * destellos, el blanco y el gris de la tinta para las letras en reposo, y las letras de «ECI MyCampus» e «Ingeniería».
 * Va detrás de todo, no recibe toques (la pieza escucha el puntero por su cuenta) y se apaga solo con movimiento reducido.
 */
export function CampusGlitch() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <LetterGlitch
        glitchColors={['#e4202b', '#ff5c64', '#f4f4f5', '#a1a1aa']}
        baseColor="#a1a1aa"
        characters="ECIMYCAMPUSINGENIERÍA0123456789"
        fontSize={17}
        spacing={0.9}
        density={0.42}
        baseOpacity={0.13}
        glitchAmount={0.42}
        speed={0.6}
        flow={0.8}
        clickEffect="tear"
        edgeFade={0.12}
        cursorRadius={160}
      />
    </div>
  );
}
