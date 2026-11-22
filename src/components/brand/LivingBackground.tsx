'use client';

import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../lib/use-media-query';

/** Ruido fino, para que el fondo no sea un degradado liso. */
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .7 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/**
 * Fondo vivo: una mancha de luz roja sigue al puntero con retraso y otra gris se mueve en sentido contrario, más lenta.
 * Aunque no haya puntero (en el celular, por ejemplo), las dos derivan solas despacio. Va detrás de todo el contenido,
 * no recibe toques y con movimiento reducido queda quieto.
 */
export function LivingBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = (name: string, value: number) => el.style.setProperty(name, `${(value * 100).toFixed(2)}%`);

    const target = { x: 0.5, y: 0.35 };
    const red = { x: 0.3, y: 0.28 };
    const gray = { x: 0.72, y: 0.7 };
    const paint = () => {
      set('--rx', red.x);
      set('--ry', red.y);
      set('--gx', gray.x);
      set('--gy', gray.y);
    };
    paint();
    if (reduced) return;

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX / window.innerWidth;
      target.y = event.clientY / window.innerHeight;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    let frame: number | null = null;
    const tick = (now: number) => {
      const t = now / 1000;
      // Deriva lenta, para que se mueva aunque nadie toque nada.
      const drift = { x: Math.sin(t * 0.13) * 0.07, y: Math.cos(t * 0.11) * 0.06 };
      red.x += (target.x + drift.x - red.x) * 0.045;
      red.y += (target.y + drift.y - red.y) * 0.045;
      gray.x += (1 - target.x + Math.cos(t * 0.09) * 0.08 - gray.x) * 0.022;
      gray.y += (1 - target.y + Math.sin(t * 0.08) * 0.07 - gray.y) * 0.022;
      paint();
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (frame === null && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    start();

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, [reduced]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        ['--rx' as string]: '30%',
        ['--ry' as string]: '28%',
        ['--gx' as string]: '72%',
        ['--gy' as string]: '70%',
        background: [
          'radial-gradient(36rem 28rem at var(--rx) var(--ry), rgb(165 29 36 / 0.32), transparent 70%)',
          'radial-gradient(46rem 34rem at var(--gx) var(--gy), rgb(150 150 168 / 0.16), transparent 72%)',
          'radial-gradient(70rem 38rem at 50% -8%, rgb(255 255 255 / 0.05), transparent 70%)',
        ].join(','),
      }}
    >
      <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
    </div>
  );
}
