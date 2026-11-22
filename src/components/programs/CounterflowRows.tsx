'use client';

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { PROGRAMS, textColorOn } from '../../lib/programs/programs';
import { rowOffsets, rowTravel, scrollProgress } from '../../lib/programs/counterflow';
import { useReducedMotion } from '../../lib/use-media-query';
import { cn } from '../../lib/utils';
import { ProgramLabel } from './ProgramLabel';

/** Altura de la barra superior fija: la escena queda pegada justo debajo. */
const PIN_TOP = 56;

/** Anchos relativos de cada cuadro de la fila y su alto en %; el segundo y el cuarto son distintos para dar ritmo. */
const UNITS = [23, 18, 23, 21, 23, 23, 23];
const HEIGHTS = [100, 88, 100, 78, 100, 100, 100];

const ROW_A = PROGRAMS.slice(0, 7);
const ROW_B = PROGRAMS.slice(7);

const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

export interface CounterflowHandle {
  /** Junta todos los cuadros en el centro de la escena. Se resuelve al terminar. */
  group: () => Promise<void>;
}

interface CounterflowRowsProps {
  /** Los cuadros entran desde el centro, como al volver del muro. */
  enterFromCenter?: boolean;
  /** Lo que va debajo de las filas, dentro de la escena fija: el botón para ver todas las carreras. */
  children?: React.ReactNode;
}

const hasAnimate = (el: Element): el is Element & { animate: Element['animate'] } => typeof el.animate === 'function';

/**
 * Recorrido de las carreras: dos filas de cuadros que se mueven en sentidos opuestos mientras se baja la página.
 * La escena queda fija durante el recorrido y el avance sale directo del scroll, sin autoplay ni suavizado.
 */
export const CounterflowRows = forwardRef<CounterflowHandle, CounterflowRowsProps>(function CounterflowRows(
  { enterFromCenter = false, children },
  ref,
) {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const firstRow = useRef<HTMLUListElement>(null);
  const secondRow = useRef<HTMLUListElement>(null);
  const tiles = useRef<(HTMLLIElement | null)[]>([]);
  const reducedRef = useRef(false);

  const update = useCallback(() => {
    const section = sectionRef.current;
    const scene = sceneRef.current;
    if (!section || !scene) return;
    let p = 0.5;
    if (!reducedRef.current) {
      const rect = section.getBoundingClientRect();
      p = scrollProgress({
        top: rect.top,
        height: rect.height,
        sceneHeight: scene.offsetHeight,
        viewportHeight: window.innerHeight,
        pinTop: PIN_TOP,
      });
    }
    const { first, second } = rowOffsets(p, rowTravel(window.matchMedia('(max-width: 767px)').matches));
    if (firstRow.current) firstRow.current.style.transform = `translateX(${first}%)`;
    if (secondRow.current) secondRow.current.style.transform = `translateX(${second}%)`;
  }, []);

  // Con movimiento reducido el avance es fijo (la mitad) y se quita el tramo de scroll extra.
  useLayoutEffect(() => {
    reducedRef.current = reduced;
    update();
  }, [reduced, update]);

  // Mientras la sección se ve se escucha el scroll, con un solo cálculo por cuadro de pantalla.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let raf: number | null = null;
    const schedule = () => {
      if (raf !== null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        update();
      });
    };
    const listen = () => {
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      update();
    };
    const mute = () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === 'undefined') {
      listen();
    } else {
      observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? listen() : mute()));
      observer.observe(section);
    }
    return () => {
      observer?.disconnect();
      mute();
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [update]);

  const centerOf = useCallback(() => {
    const rect = sceneRef.current?.getBoundingClientRect();
    return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.45 } : { x: 0, y: 0 };
  }, []);

  const vectors = useCallback(() => {
    const center = centerOf();
    return tiles.current.map((el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { el, dx: center.x - (r.left + r.width / 2), dy: center.y - (r.top + r.height / 2) };
    });
  }, [centerOf]);

  useImperativeHandle(
    ref,
    () => ({
      group: () => {
        if (reducedRef.current) return Promise.resolve();
        const done = vectors().map((item, i) => {
          if (!item || !hasAnimate(item.el)) return Promise.resolve();
          return item.el.animate(
            [
              { transform: 'translate(0, 0) scale(1)', opacity: 1 },
              { transform: `translate(${item.dx}px, ${item.dy}px) scale(0.32)`, opacity: 1, offset: 0.82 },
              { transform: `translate(${item.dx}px, ${item.dy}px) scale(0.32)`, opacity: 0 },
            ],
            { duration: 720, delay: i * 16, easing: EASE, fill: 'forwards' },
          ).finished.then(() => undefined);
        });
        return Promise.all(done).then(() => undefined);
      },
    }),
    [vectors],
  );

  // Al volver del muro, los cuadros salen del centro hacia su lugar en las filas.
  useLayoutEffect(() => {
    if (!enterFromCenter || reducedRef.current) return;
    update();
    vectors().forEach((item, i) => {
      if (!item || !hasAnimate(item.el)) return;
      item.el.animate(
        [
          { transform: `translate(${item.dx}px, ${item.dy}px) scale(0.32)`, opacity: 0 },
          { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        ],
        { duration: 700, delay: i * 18, easing: EASE, fill: 'backwards' },
      );
    });
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderRow = (programs: typeof PROGRAMS, offset: number, rowRef: React.RefObject<HTMLUListElement | null>, className: string, label: string) => (
    <ul ref={rowRef} role="list" aria-label={label} className={cn('absolute flex items-center will-change-transform', className)} style={{ gap: '2%' }}>
      {programs.map((program, i) => (
        <li
          key={program.slug}
          ref={(el) => {
            tiles.current[offset + i] = el;
          }}
          className="relative flex min-w-0 flex-col justify-end rounded-[0.7rem] p-3 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]"
          style={{
            flex: `${UNITS[i]} ${UNITS[i]} 0`,
            height: `${HEIGHTS[i]}%`,
            background: program.color,
            color: textColorOn(program.color),
            containerType: 'inline-size',
          }}
        >
          <ProgramLabel program={program} />
        </li>
      ))}
    </ul>
  );

  return (
    <div
      ref={sectionRef}
      className={cn('relative', reduced ? 'h-auto' : 'h-[230svh] md:h-[250svh]')}
    >
      <div
        ref={sceneRef}
        className={cn(
          'flex flex-col overflow-hidden',
          reduced
            ? 'min-h-[26rem]'
            : 'sticky top-14 h-[calc(100svh-3.5rem)] min-h-[26rem] max-md:h-[calc(100svh-7rem)]',
        )}
      >
        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-1/2 h-[min(94%,32rem)] -translate-y-1/2">
            {renderRow(ROW_A, 0, firstRow, 'left-0 top-0 h-[46%] w-[330%] md:w-[150%]', 'Programas de pregrado, primera fila')}
            {renderRow(ROW_B, ROW_A.length, secondRow, 'left-[-3%] top-[54%] h-[46%] w-[275%] md:w-[125%]', 'Programas de pregrado, segunda fila')}
          </div>
        </div>
        <div className="flex justify-center py-4">{children}</div>
      </div>
    </div>
  );
});
