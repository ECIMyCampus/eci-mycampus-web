'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { PROGRAMS, Program, textColorOn } from '../../lib/programs/programs';
import { useReducedMotion } from '../../lib/use-media-query';
import { cn } from '../../lib/utils';
import { ProgramLabel } from './ProgramLabel';

const ROW_A = PROGRAMS.slice(0, 7);
const ROW_B = PROGRAMS.slice(7);

/** Ancho relativo y alto en % de cada cuadro de la fila: el segundo y el cuarto son distintos para dar ritmo. */
const WIDTHS = [1, 0.8, 1, 0.92, 1, 1, 1];
const HEIGHTS = [100, 88, 100, 78, 100, 100, 100];

/** Cada fila repite su tramo cuatro veces y se desplaza una cuarta parte: el bucle no tiene costura. */
const COPIES = [0, 1, 2, 3];

export interface MarqueeTile {
  program: Program;
  el: HTMLElement;
  rect: DOMRect;
}

export interface MarqueeHandle {
  /** Un cuadro por programa: la copia más cercana al centro de la pantalla, con su posición actual. */
  snapshot: () => MarqueeTile[];
  /** Oculta o muestra las filas sin quitarlas (mientras los cuadros vuelan de un lado a otro). */
  setHidden: (hidden: boolean) => void;
  /** Detiene el desplazamiento aunque la persona no haya pausado, para medir posiciones estables. */
  freeze: (on: boolean) => void;
}

interface MarqueeRowsProps {
  /** Las filas aparecen ocultas hasta que se llame a `setHidden(false)`. */
  startHidden?: boolean;
  /** Lo que va debajo de las filas: el botón para ver todas las carreras. */
  children?: React.ReactNode;
}

interface RowProps {
  programs: Program[];
  direction: 'left' | 'right';
  seconds: number;
  label: string;
  hidden: boolean;
}

function Row({ programs, direction, seconds, label, hidden }: RowProps) {
  return (
    <div className="relative h-[48%]">
      <div
        className="marquee-track absolute left-0 top-0 flex h-full w-max will-change-transform"
        data-direction={direction}
        style={{ animationDuration: `${seconds}s`, visibility: hidden ? 'hidden' : 'visible' }}
      >
        {COPIES.map((copy) => (
          <ul
            key={copy}
            // Solo el primer tramo es la lista real; las copias son relleno visual.
            role={copy === 0 ? 'list' : undefined}
            aria-label={copy === 0 ? label : undefined}
            aria-hidden={copy === 0 ? undefined : true}
            className="flex h-full items-center"
            style={{ gap: 'var(--gap)', paddingRight: 'var(--gap)' }}
          >
            {programs.map((program, i) => (
              <li
                key={program.slug}
                data-row-tile={program.slug}
                data-copy={copy}
                className={cn('program-tile relative flex flex-none flex-col justify-end rounded-[0.8rem] p-3 sm:p-4')}
                style={{
                  ['--tile' as string]: program.color,
                  ['--sheen-delay' as string]: `${((PROGRAMS.indexOf(program) + copy) % 7) * 1.1}s`,
                  width: `calc(var(--tw) * ${WIDTHS[i]})`,
                  height: `${HEIGHTS[i]}%`,
                  color: textColorOn(program.color),
                  containerType: 'inline-size',
                }}
              >
                <ProgramLabel program={program} maxRem={2.8} />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/**
 * Recorrido de las carreras: dos filas de cuadros que pasan solas, en sentidos opuestos y despacio. Siguen su camino
 * aunque el puntero esté encima; solo se detienen fuera de pantalla o cuando la persona las pausa con el botón. Con
 * movimiento reducido quedan quietas.
 */
export const MarqueeRows = forwardRef<MarqueeHandle, MarqueeRowsProps>(function MarqueeRows({ startHidden = false, children }, ref) {
  const reduced = useReducedMotion();
  const sceneRef = useRef<HTMLDivElement>(null);
  const [userPaused, setUserPaused] = useState(false);
  const [offscreen, setOffscreen] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [hidden, setHidden] = useState(startHidden);

  useImperativeHandle(
    ref,
    () => ({
      snapshot: () => {
        const scene = sceneRef.current;
        if (!scene) return [];
        const center = window.innerWidth / 2;
        return PROGRAMS.flatMap((program) => {
          const copies = Array.from(scene.querySelectorAll<HTMLElement>(`[data-row-tile="${program.slug}"]`));
          const best = copies
            .map((el) => ({ el, rect: el.getBoundingClientRect() }))
            .sort((a, b) => Math.abs(a.rect.left + a.rect.width / 2 - center) - Math.abs(b.rect.left + b.rect.width / 2 - center))[0];
          return best ? [{ program, ...best }] : [];
        });
      },
      setHidden,
      freeze: setFrozen,
    }),
    [],
  );

  // Fuera de pantalla las filas no se animan.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting));
    observer.observe(scene);
    return () => observer.disconnect();
  }, []);

  const paused = userPaused || offscreen || frozen;

  return (
    <div
      ref={sceneRef}
      data-paused={paused}
      className="marquee-scene relative flex h-[min(86svh,44rem)] min-h-[24rem] flex-col overflow-hidden max-md:h-[min(62svh,34rem)]"
      style={{ ['--tw' as string]: 'clamp(11rem, 20vw, 20rem)', ['--gap' as string]: 'clamp(0.75rem, 1.6vw, 1.5rem)' }}
    >
      <div className="relative flex-1">
        <div className="absolute inset-x-0 top-1/2 flex h-[min(92%,31rem)] -translate-y-1/2 flex-col gap-[4%]">
          <Row programs={ROW_A} direction="left" seconds={62} label="Programas de pregrado, primera fila" hidden={hidden} />
          <Row programs={ROW_B} direction="right" seconds={56} label="Programas de pregrado, segunda fila" hidden={hidden} />
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 py-4">
        {children}
        {!reduced && (
          <button
            type="button"
            onClick={() => setUserPaused((value) => !value)}
            aria-label={userPaused ? 'Reanudar el recorrido' : 'Pausar el recorrido'}
            aria-pressed={userPaused}
            className="pressable flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-surface-raised text-ink-muted transition-colors duration-fast ease-out hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
          >
            {userPaused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
});
