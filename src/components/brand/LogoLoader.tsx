'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LOGO_FONT_SIZE, LOGO_GLYPHS, LOGO_TEXT_WIDTH } from './logo-glyphs';
import { Frame, STATIC_FRAME, frameAt, glyphDelay } from './logo-timeline';

const CURVE_SRC = '/brand/curva-eci.webp';
const CURVE_RATIO = 182 / 193;
/** La curva de la Escuela mide el 90 % del ancho del texto y va centrada detrás de las dos líneas. */
const CURVE_W = LOGO_TEXT_WIDTH * 0.9;
const CURVE_H = CURVE_W * CURVE_RATIO;
const CENTER_Y = LOGO_FONT_SIZE;
const VIEW_X = -114;
const VIEW_W = 228;
const VIEW_Y = -56;
const VIEW_H = 192;

const INK = '#f4f4f5';
const LOGO_RED = '#e4202b';
/** Color del trazo mientras se dibuja el contorno. */
const STROKE = '#f5edde';

const LINE_COUNTS = [0, 1].map((line) => LOGO_GLYPHS.filter((g) => g.line === line).length);

const DELAYS = LOGO_GLYPHS.map((g) => glyphDelay(g.line, g.index, LINE_COUNTS[g.line]));

interface LogoLoaderProps {
  /** Muestra los botones de pausa y de repetir. Una pantalla de carga que termina sola los omite. */
  controls?: boolean;
  /** Punto del ciclo en el que arranca, en milisegundos. Sirve para pruebas y para revisar un fotograma. */
  initialMs?: number;
  className?: string;
}

/**
 * Logotipo «ECI MyCampus» que se dibuja, se rellena con sus colores, se sostiene y se desvanece, en un ciclo de 5,6 s.
 * Un solo bucle de `requestAnimationFrame` con reloj propio: se detiene si la pestaña se oculta, si el bloque sale de
 * pantalla o si la persona lo pausa, y al volver continúa donde iba. Con movimiento reducido muestra el logotipo completo.
 */
export function LogoLoader({ controls = true, initialMs = 0, className }: LogoLoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const fillRef = useRef<SVGGElement>(null);
  const outlineRef = useRef<SVGGElement>(null);
  const strokeRefs = useRef<(SVGPathElement | null)[]>([]);

  const elapsed = useRef(initialMs);
  const frameId = useRef<number | null>(null);
  const lastTick = useRef<number | null>(null);
  const flags = useRef({ playing: true, hidden: false, visible: true, ready: false, reduced: false });

  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [curveOk, setCurveOk] = useState(true);

  const apply = useCallback((frame: Frame) => {
    groupRef.current?.setAttribute('opacity', String(frame.group));
    fillRef.current?.setAttribute('opacity', String(frame.fill));
    outlineRef.current?.setAttribute('opacity', String(frame.outline));
    strokeRefs.current.forEach((path, i) => {
      if (!path) return;
      const progress = frame.draw(DELAYS[i]);
      path.setAttribute('stroke-dashoffset', String(1 - progress));
      // Con el trazo en cero, las puntas redondeadas dejarían un punto visible.
      path.setAttribute('stroke-opacity', progress <= 0.001 ? '0' : '1');
    });
  }, []);

  const sync = useCallback(() => {
    const f = flags.current;
    const active = f.playing && !f.hidden && f.visible && f.ready && !f.reduced;
    if (!active) {
      if (frameId.current !== null) cancelAnimationFrame(frameId.current);
      frameId.current = null;
      lastTick.current = null; // el tiempo suspendido no se acumula
      return;
    }
    if (frameId.current !== null) return;
    const tick = (now: number) => {
      if (lastTick.current !== null) elapsed.current += now - lastTick.current;
      lastTick.current = now;
      apply(frameAt(elapsed.current));
      frameId.current = requestAnimationFrame(tick);
    };
    frameId.current = requestAnimationFrame(tick);
  }, [apply]);

  // Espera a que la curva de la Escuela esté decodificada antes de empezar; si falla, se muestra el logotipo sin ella.
  useEffect(() => {
    let cancelled = false;
    const image = new window.Image();
    image.src = CURVE_SRC;
    const ready = (ok: boolean) => {
      if (cancelled) return;
      if (!ok) setCurveOk(false);
      flags.current.ready = true;
      sync();
    };
    const timeout = window.setTimeout(() => ready(false), 3000);
    // Navegadores sin decode() siguen adelante: la imagen se pinta cuando llegue.
    (typeof image.decode === 'function' ? image.decode() : Promise.resolve())
      .then(() => ready(true))
      .catch(() => ready(false))
      .finally(() => window.clearTimeout(timeout));
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [sync]);

  // Movimiento reducido: logotipo completo y quieto, y se reacciona si la preferencia cambia con el bloque montado.
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      flags.current.reduced = query.matches;
      setReduced(query.matches);
      if (query.matches) apply(STATIC_FRAME);
      else apply(frameAt(elapsed.current));
      sync();
    };
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [apply, sync]);

  // Pestaña oculta o bloque fuera de pantalla: se detiene.
  useEffect(() => {
    const onVisibility = () => {
      flags.current.hidden = document.hidden;
      sync();
    };
    document.addEventListener('visibilitychange', onVisibility);
    onVisibility();

    let observer: IntersectionObserver | undefined;
    if (rootRef.current && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(([entry]) => {
        flags.current.visible = entry.isIntersecting;
        sync();
      });
      observer.observe(rootRef.current);
    }
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
      if (frameId.current !== null) cancelAnimationFrame(frameId.current);
      frameId.current = null;
    };
  }, [sync]);

  const togglePlaying = () => {
    flags.current.playing = !flags.current.playing;
    setPlaying(flags.current.playing);
    sync();
  };

  const replay = () => {
    elapsed.current = 0;
    flags.current.playing = true;
    setPlaying(true);
    apply(frameAt(0));
    sync();
  };

  const initial = reduced ? STATIC_FRAME : frameAt(initialMs);

  return (
    <div ref={rootRef} className={cn('relative flex h-full w-full items-center justify-center', className)}>
      <svg
        role="img"
        aria-label="Logotipo de ECI MyCampus"
        viewBox={`${VIEW_X} ${VIEW_Y} ${VIEW_W} ${VIEW_H}`}
        className="h-auto w-[clamp(280px,58vw,620px)] max-w-[84vw] max-[500px]:w-[84vw]"
      >
        <g ref={groupRef} opacity={initial.group}>
          <g ref={fillRef} opacity={initial.fill}>
            {curveOk && (
              <image
                href={CURVE_SRC}
                x={-CURVE_W / 2}
                y={CENTER_Y - CURVE_H / 2}
                width={CURVE_W}
                height={CURVE_H}
                opacity={0.25}
                preserveAspectRatio="xMidYMid meet"
              />
            )}
            {LOGO_GLYPHS.map((glyph) => (
              <path key={`fill-${glyph.line}-${glyph.index}`} d={glyph.d} fill={glyph.line === 0 ? INK : LOGO_RED} />
            ))}
          </g>
          <g
            ref={outlineRef}
            opacity={initial.outline}
            fill="none"
            stroke={STROKE}
            strokeWidth={0.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {LOGO_GLYPHS.map((glyph, i) => {
              const progress = initial.draw(DELAYS[i]);
              return (
                <path
                  key={`line-${glyph.line}-${glyph.index}`}
                  ref={(node) => {
                    strokeRefs.current[i] = node;
                  }}
                  d={glyph.d}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - progress}
                  strokeOpacity={progress <= 0.001 ? 0 : 1}
                />
              );
            })}
          </g>
        </g>
      </svg>

      {controls && (
        <div className="absolute bottom-3 right-3 flex gap-1.5">
          <button
            type="button"
            onClick={togglePlaying}
            disabled={reduced}
            aria-label={playing ? 'Pausar la animación' : 'Reanudar la animación'}
            className="pressable flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface-raised text-ink-muted transition-colors duration-fast ease-out hover:text-ink disabled:pointer-events-none disabled:opacity-40"
          >
            {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={replay}
            disabled={reduced}
            aria-label="Repetir la animación"
            className="pressable flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface-raised text-ink-muted transition-colors duration-fast ease-out hover:text-ink disabled:pointer-events-none disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
