'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight, RotateCcw, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PROGRAMS, Program, programUrl, textColorOn } from '../../lib/programs/programs';
import { Spring, TILE_GAP, TILE_STEP, TILE_W, clamp, flipPose, smoothstep, stepSpring } from '../../lib/programs/wall-motion';
import { useMediaQuery, useReducedMotion } from '../../lib/use-media-query';
import { Manchas } from '../brand/Manchas';
import { ProgramLabel, fitFont } from './ProgramLabel';

/** Los 12 cuadros del muro; el que sobra, Matemáticas, lo sostiene Manchas. */
const WALL_PROGRAMS = PROGRAMS.slice(0, 12);
const HELD_INDEX = 12;
const HELD_PROGRAM = PROGRAMS[HELD_INDEX];
/** La lámina que sostiene Manchas en su dibujo (`sosteniendo-cuadro`): proporción y posición, en % de la imagen. */
const HELD_ASPECT = 1.45;
/** La onda hace dar una vuelta entera a cada cuadro: empieza y termina con el color de frente. */
const TURNS = 2;

const DEG = 180 / Math.PI;
const spring = (): Spring => ({ value: 0, velocity: 0 });

/** Un elemento inerte no recibe foco ni toques: el frente y el reverso se alternan según el cuadro esté abierto. */
const inertWhen = (on: boolean): Record<string, unknown> => (on ? { inert: true } : {});

interface TileProps {
  program: Program;
  isOpen: boolean;
  compact?: boolean;
  /** Proporción ancho/alto del cuadro. Los del muro son 6:5; el que sostiene Manchas copia la lámina de su dibujo. */
  aspect?: number;
  tileRef: (el: HTMLDivElement | null) => void;
  contentRef: (el: HTMLDivElement | null) => void;
  frontRef: (el: HTMLButtonElement | null) => void;
  closeRef: (el: HTMLButtonElement | null) => void;
  onToggle: () => void;
  onHover: (hovered: boolean) => void;
  onPointer: (x: number, y: number) => void;
}

/** Un cuadro: de frente el color y el nombre del programa; al voltearlo, el reverso con el enlace a la página oficial. */
function Tile({ program, isOpen, compact = false, aspect = 6 / 5, tileRef, contentRef, frontRef, closeRef, onToggle, onHover, onPointer }: TileProps) {
  const text = textColorOn(program.color);
  const sheenDelay = `${(PROGRAMS.indexOf(program) % 7) * 1.1}s`;

  return (
    <div
      ref={tileRef}
      className="relative rounded-[0.7rem] [transform-style:preserve-3d]"
      style={{ aspectRatio: String(aspect), pointerEvents: 'none' }}
      onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && onHover(false)}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        const rect = e.currentTarget.getBoundingClientRect();
        onPointer(((e.clientX - rect.left) / rect.width) * 2 - 1, ((e.clientY - rect.top) / rect.height) * 2 - 1);
      }}
    >
      {/* Frente */}
      <div
        data-front={program.slug}
        className="program-tile absolute inset-0 rounded-[inherit] [backface-visibility:hidden] [-webkit-backface-visibility:hidden]"
        style={{ ['--tile' as string]: program.color, ['--sheen-delay' as string]: sheenDelay, color: text, containerType: 'inline-size' }}
      >
        <button
          ref={frontRef}
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label={`${program.name}, programa de pregrado. Ver el programa`}
          {...inertWhen(isOpen)}
          className={cn(
            'pressable relative z-[1] flex h-full w-full flex-col justify-end rounded-[inherit] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink',
            compact ? 'p-2.5' : 'p-3 sm:p-4',
          )}
        >
          <ProgramLabel program={program} compact={compact} maxRem={2.3} />
        </button>
      </div>

      {/* Reverso */}
      <div
        className="absolute inset-0 rounded-[inherit] bg-surface-raised text-ink [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)]"
        style={{ boxShadow: `inset 0 0 0 2px ${program.color}`, containerType: 'inline-size' }}
      >
        <div
          ref={contentRef}
          {...inertWhen(!isOpen)}
          className={cn('flex h-full flex-col justify-between', compact ? 'p-2.5' : 'p-3 sm:p-4')}
          style={{ opacity: 0 }}
        >
          <div className="min-w-0">
            {!compact && <p className="hidden text-xs text-ink-muted sm:block">Programa de pregrado</p>}
            <p className="font-program font-bold leading-[1] tracking-[-0.01em] sm:mt-1" style={{ fontSize: fitFont(program.name, compact ? 0.9 : 1.15) }}>
              {program.name}
            </p>
          </div>
          <div className="flex items-end justify-between gap-1">
            <a
              href={programUrl(program)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ver ${program.name} en escuelaing.edu.co (abre en otra pestaña)`}
              className={cn(
                'inline-flex min-h-6 items-center gap-0.5 rounded font-medium text-accent-ink hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-ink',
                compact ? 'text-[10px]' : 'text-[11px] sm:text-xs',
              )}
            >
              Ver programa
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
            <button
              ref={closeRef}
              type="button"
              onClick={onToggle}
              aria-label={`Volver a ${program.name}`}
              className="-m-1 flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-ink"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * `hidden`: el muro está armado pero invisible (se mide mientras los cuadros vuelan hacia él). `open`: los cuadros dan
 * la vuelta en una onda diagonal y el muro se inclina a su postura. `closing`: la onda corre al revés y, al terminar,
 * avisa con `onClosed`.
 */
export type WallMode = 'hidden' | 'open' | 'closing';

interface ProgramWallProps {
  mode?: WallMode;
  onClosed?: () => void;
}

/**
 * Muro de las carreras de pregrado: 12 cuadros con el color oficial y el nombre de cada programa, y Manchas con el
 * cuadro que sobra. Al tocar un cuadro se voltea y muestra su reverso. Todo se mueve con CSS 3D desde un solo ciclo de
 * animación que se detiene cuando nada se está moviendo.
 */
export function ProgramWall({ mode = 'open', onClosed }: ProgramWallProps) {
  const wide = useMediaQuery('(min-width: 640px)');
  const reduced = useReducedMotion();
  const cols = wide ? 4 : 3;
  const rows = 12 / cols;

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const tileEls = useRef<(HTMLDivElement | null)[]>([]);
  const contentEls = useRef<(HTMLDivElement | null)[]>([]);
  const frontEls = useRef<(HTMLButtonElement | null)[]>([]);
  const closeEls = useRef<(HTMLButtonElement | null)[]>([]);

  const entry = useRef<Spring>(spring());
  const entryTarget = useRef(0);
  const tilt = useRef<Spring>(spring());
  const tiltTarget = useRef(0);
  const opens = useRef<Spring[]>(PROGRAMS.map(spring));
  const hovers = useRef<Spring[]>(PROGRAMS.map(spring));
  const hoverTarget = useRef<number[]>(PROGRAMS.map(() => 0));
  const tilePointer = useRef(PROGRAMS.map(() => ({ x: 0, y: 0 })));
  const wallPointer = useRef({ x: spring(), y: spring(), tx: 0, ty: 0 });
  const openRef = useRef<number | null>(null);
  const unit = useRef(40);
  const heldUnit = useRef(20);
  const layout = useRef({ cols: 3, rows: 4 });
  const flags = useRef({ reduced: false, seen: false, began: false });
  const frame = useRef<number | null>(null);
  const last = useRef<number | null>(null);
  const previousOpen = useRef<number | null>(null);
  const closing = useRef(false);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;

  const apply = useCallback(() => {
    const { cols: c, rows: r } = layout.current;
    const calm = flags.current.reduced;
    const ptr = wallPointer.current;
    const lean = calm ? 0 : tilt.current.value;

    if (wallRef.current) {
      wallRef.current.style.transform = calm
        ? 'none'
        : `rotateX(${(-0.09 + ptr.y.value * 0.065) * lean * DEG}deg) rotateY(${(-0.19 + ptr.x.value * 0.11) * lean * DEG}deg) rotateZ(${-0.045 * lean * DEG}deg)`;
    }

    tileEls.current.forEach((el, i) => {
      if (!el) return;
      const held = i === HELD_INDEX;
      const col = held ? c - 1 : i % c;
      const row = held ? r - 1 : Math.floor(i / c);
      const u = held ? heldUnit.current : unit.current;
      const pose = flipPose(entry.current.value, col, row, c, r, TURNS);
      const open = opens.current[i].value;
      const hover = calm ? 0 : hovers.current[i].value;
      const openArc = Math.sin(Math.PI * clamp(open, 0, 1));
      const pt = tilePointer.current[i];

      const rotY = (pose.rotY + Math.PI * open) * DEG + pt.x * 3 * hover;
      const rotX = (held ? 0 : pose.rotX * DEG) - pt.y * 3 * hover;
      const z = (pose.z + openArc * 0.5 + open * 0.05 + hover * 0.16) * u;
      const x = held ? 0 : pose.x * u;
      const y = held ? 0 : pose.y * u;
      const own = held ? `perspective(${8.4 * u}px) ` : '';

      el.style.transform = `${own}translate3d(${x}px, ${y}px, ${z}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      el.style.pointerEvents = calm || entry.current.value > 0.98 ? 'auto' : 'none';
      el.style.zIndex = open > 0.01 || hover > 0.01 ? '2' : '0';

      const content = contentEls.current[i];
      if (content) content.style.opacity = String(smoothstep(clamp((open - 0.5) * 2, 0, 1)));
    });
  }, []);

  const tick = useCallback(
    (now: number) => {
      const dt = last.current === null ? 0 : (now - last.current) / 1000;
      last.current = now;

      let busy = stepSpring(entry.current, entryTarget.current, 3.6, dt, 0.85);
      busy = stepSpring(tilt.current, tiltTarget.current, 2.4, dt) || busy;
      opens.current.forEach((s, i) => {
        busy = stepSpring(s, openRef.current === i ? 1 : 0, 9, dt) || busy;
        busy = stepSpring(hovers.current[i], hoverTarget.current[i], 14, dt) || busy;
      });
      const ptr = wallPointer.current;
      busy = stepSpring(ptr.x, ptr.tx, 6, dt) || busy;
      busy = stepSpring(ptr.y, ptr.ty, 6, dt) || busy;

      apply();
      if (busy) {
        frame.current = requestAnimationFrame(tick);
      } else {
        frame.current = null;
        last.current = null;
        // El muro terminó de desarmarse: se avisa una sola vez.
        if (closing.current && entry.current.value === 0) {
          closing.current = false;
          onClosedRef.current?.();
        }
      }
    },
    [apply],
  );

  /** Pone en marcha el ciclo si estaba detenido. Se llama cada vez que algo cambia de objetivo. */
  const kick = useCallback(() => {
    if (frame.current === null) {
      last.current = null;
      frame.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  const settleNow = useCallback(() => {
    entry.current = { value: 1, velocity: 0 };
    entryTarget.current = 1;
    opens.current.forEach((s, i) => Object.assign(s, { value: openRef.current === i ? 1 : 0, velocity: 0 }));
    apply();
  }, [apply]);

  /** Arranca la onda de entrada, una sola vez por apertura. */
  const begin = useCallback(() => {
    if (flags.current.began) return;
    flags.current.began = true;
    tiltTarget.current = 1;
    if (flags.current.reduced) {
      settleNow();
    } else {
      entryTarget.current = 1;
      kick();
    }
  }, [kick, settleNow]);

  // Medidas: una unidad del muro en píxeles, para el espacio entre cuadros, la perspectiva y los empujes en profundidad.
  useLayoutEffect(() => {
    layout.current = { cols, rows };
    const measure = () => {
      const wall = wallRef.current;
      const held = tileEls.current[HELD_INDEX];
      if (wall) {
        unit.current = wall.offsetWidth / (cols * TILE_STEP - TILE_GAP);
        stageRef.current?.style.setProperty('--u', `${unit.current}px`);
      }
      if (held) heldUnit.current = held.offsetWidth / TILE_W;
      apply();
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    if (wallRef.current) observer.observe(wallRef.current);
    if (tileEls.current[HELD_INDEX]) observer.observe(tileEls.current[HELD_INDEX]!);
    return () => observer.disconnect();
  }, [cols, rows, apply]);

  // Movimiento reducido: el muro aparece completo y quieto, sin elevación al pasar ni inercia.
  useEffect(() => {
    flags.current.reduced = reduced;
    if (reduced && flags.current.began) settleNow();
    else apply();
  }, [reduced, settleNow, apply]);

  // Primera vez que el muro asoma en pantalla. Si ya está en modo abierto, la onda arranca de inmediato.
  useEffect(() => {
    const stage = stageRef.current;
    apply();
    setReady(true);
    if (!stage || typeof IntersectionObserver === 'undefined') {
      flags.current.seen = true;
      if (modeRef.current === 'open') begin();
      return;
    }
    const observer = new IntersectionObserver(
      ([item]) => {
        if (!item.isIntersecting) return;
        flags.current.seen = true;
        observer.disconnect();
        if (modeRef.current === 'open') begin();
      },
      { threshold: 0.25 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, [apply, begin]);

  // Cambios de modo: abrir arranca la onda; cerrar la corre al revés y avisa al terminar.
  useEffect(() => {
    if (mode === 'open') {
      if (flags.current.seen) begin();
      return;
    }
    if (mode !== 'closing') return;
    openRef.current = null;
    setOpenIndex(null);
    closing.current = true;
    entryTarget.current = 0;
    tiltTarget.current = 0;
    flags.current.began = false;
    if (flags.current.reduced) {
      entry.current = { value: 0, velocity: 0 };
      apply();
      closing.current = false;
      queueMicrotask(() => onClosedRef.current?.());
      return;
    }
    kick();
  }, [mode, begin, apply, kick]);

  // Al desmontar se cancela el ciclo pendiente.
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    },
    [],
  );

  const toggle = useCallback(
    (index: number) => {
      const next = openRef.current === index ? null : index;
      openRef.current = next;
      setOpenIndex(next);
      if (flags.current.reduced) settleNow();
      else kick();
    },
    [kick, settleNow],
  );

  // Escape devuelve el cuadro abierto; el foco pasa al reverso al abrir y regresa al frente al cerrar.
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') toggle(openIndex);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex, toggle]);

  useEffect(() => {
    const was = previousOpen.current;
    previousOpen.current = openIndex;
    if (openIndex !== null) closeEls.current[openIndex]?.focus({ preventScroll: true });
    else if (was !== null) frontEls.current[was]?.focus({ preventScroll: true });
  }, [openIndex]);

  const replay = () => {
    openRef.current = null;
    setOpenIndex(null);
    if (flags.current.reduced) {
      settleNow();
      return;
    }
    entry.current = { value: 0, velocity: 0 };
    entryTarget.current = 1;
    kick();
  };

  const onStagePointerMove = (event: React.PointerEvent) => {
    if (event.pointerType !== 'mouse' || flags.current.reduced || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    wallPointer.current.tx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    wallPointer.current.ty = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    kick();
  };

  const onStageLeave = () => {
    wallPointer.current.tx = 0;
    wallPointer.current.ty = 0;
    kick();
  };

  const bind = (index: number, program: Program, held = false) => (
    <Tile
      key={program.slug}
      program={program}
      aspect={held ? HELD_ASPECT : undefined}
      isOpen={openIndex === index}
      tileRef={(el) => {
        tileEls.current[index] = el;
      }}
      contentRef={(el) => {
        contentEls.current[index] = el;
      }}
      frontRef={(el) => {
        frontEls.current[index] = el;
      }}
      closeRef={(el) => {
        closeEls.current[index] = el;
      }}
      onToggle={() => toggle(index)}
      onHover={(hovered) => {
        hoverTarget.current[index] = hovered ? 1 : 0;
        kick();
      }}
      onPointer={(x, y) => {
        tilePointer.current[index] = { x, y };
        kick();
      }}
    />
  );

  return (
    <div className="space-y-6">
      {/* Sin JavaScript el muro quedaría oculto hasta que cargue la animación: así se muestra tal cual. */}
      <noscript>
        <style>{'.program-wall{opacity:1 !important}'}</style>
      </noscript>
      <div
        ref={stageRef}
        className="program-wall grid items-center gap-10 py-2 lg:grid-cols-[minmax(0,1fr)_17rem]"
        style={{ opacity: ready ? 1 : 0, visibility: mode === 'hidden' ? 'hidden' : 'visible', ['--u' as string]: '40px' }}
        onPointerMove={onStagePointerMove}
        onPointerLeave={onStageLeave}
      >
        <div style={{ perspective: 'calc(var(--u) * 8.4)' }}>
          <div
            ref={wallRef}
            className="grid grid-cols-3 sm:grid-cols-4 [transform-style:preserve-3d]"
            style={{ gap: 'calc(var(--u) * 0.024)' }}
          >
            {WALL_PROGRAMS.map((program, index) => bind(index, program))}
          </div>
        </div>

        <div className="relative mx-auto w-[min(100%,15rem)]">
          <Manchas pose="sosteniendo-cuadro" className="h-auto w-full" />
          <div className="absolute left-[12.6%] top-[42.7%] w-[74.9%]">{bind(HELD_INDEX, HELD_PROGRAM, true)}</div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={replay}
          className="pressable inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-sm text-ink-muted transition-colors duration-fast ease-out hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-ink"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Repetir la animación
        </button>
      </div>
    </div>
  );
}
