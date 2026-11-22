'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, Rows3 } from 'lucide-react';
import { PROGRAMS } from '../../lib/programs/programs';
import { useReducedMotion } from '../../lib/use-media-query';
import { afterPaint, prepareFlight } from './flight';
import { MarqueeHandle, MarqueeRows } from './MarqueeRows';
import { ProgramWall, WallMode } from './ProgramWall';

type View = 'rows' | 'wall';

const buttonClass =
  'pressable inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-surface-raised px-5 text-sm font-semibold text-ink transition-colors duration-fast ease-out hover:border-ink-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink disabled:pointer-events-none disabled:opacity-60';

const frontOf = (slug: string) => document.querySelector<HTMLElement>(`[data-front="${slug}"]`);

/**
 * Las carreras de pregrado en dos vistas. El recorrido las pasa solas en dos filas a contraflujo; «Ver todas las
 * carreras» hace volar los cuadros hasta su lugar en el muro, donde dan la vuelta en una onda. Desde el muro se
 * vuelve: la onda corre al revés y los cuadros regresan a sus filas.
 */
export function ProgramsExplorer() {
  const reduced = useReducedMotion();
  const [view, setView] = useState<View>('rows');
  const [wallMode, setWallMode] = useState<WallMode>('open');
  const [rowsHidden, setRowsHidden] = useState(false);
  const [busy, setBusy] = useState(false);

  const rowsRef = useRef<MarqueeHandle>(null);
  const allButton = useRef<HTMLButtonElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const focusNext = useRef<View | null>(null);

  const showAll = async () => {
    if (busy) return;
    setBusy(true);
    const rows = rowsRef.current;
    if (reduced || !rows) {
      setWallMode('open');
      focusNext.current = 'wall';
      setView('wall');
      setBusy(false);
      return;
    }

    // 1. Copias flotantes sobre cada cuadro del recorrido; el recorrido se oculta y se cambia de vista.
    rows.freeze(true);
    const tiles = rows.snapshot();
    const flight = prepareFlight(tiles.map(({ el, rect }) => ({ source: el, from: rect })));
    rows.setHidden(true);
    setWallMode('hidden');
    focusNext.current = 'wall';
    setView('wall');
    await afterPaint();

    // 2. Las copias vuelan hasta el lugar de cada cuadro en el muro, que todavía está invisible.
    await flight.run(tiles.map(({ program }) => frontOf(program.slug)?.getBoundingClientRect()));

    // 3. Aterrizan: el muro aparece justo debajo y sus cuadros dan la vuelta en la onda.
    setWallMode('open');
    await afterPaint();
    flight.remove();
    setBusy(false);
  };

  const showRows = () => {
    if (busy) return;
    setBusy(true);
    setWallMode('closing');
  };

  const onWallClosed = async () => {
    focusNext.current = 'rows';
    if (reduced) {
      setRowsHidden(false);
      setView('rows');
      setBusy(false);
      return;
    }

    // Los cuadros del muro, ya planos, vuelan de regreso a sus filas.
    const sources = PROGRAMS.flatMap((program) => {
      const el = frontOf(program.slug);
      return el ? [{ program, source: el, from: el.getBoundingClientRect() }] : [];
    });
    const flight = prepareFlight(sources.map(({ source, from }) => ({ source, from })));
    setRowsHidden(true);
    setView('rows');
    await afterPaint();

    const rows = rowsRef.current;
    rows?.freeze(true);
    const tiles = rows?.snapshot() ?? [];
    const rectOf = (slug: string) => tiles.find((tile) => tile.program.slug === slug)?.rect;
    await flight.run(sources.map(({ program }) => rectOf(program.slug)));

    rows?.setHidden(false);
    rows?.freeze(false);
    await afterPaint();
    flight.remove();
    setRowsHidden(false);
    setBusy(false);
  };

  // El botón que se tocó ya no existe al cambiar de vista: el foco pasa al botón nuevo.
  useLayoutEffect(() => {
    const target = focusNext.current;
    if (!target) return;
    focusNext.current = null;
    (target === 'wall' ? backButton.current : allButton.current)?.focus({ preventScroll: true });
  }, [view]);

  return (
    <div>
      <p className="sr-only" role="status">
        {view === 'wall' ? 'Mostrando todas las carreras en el muro.' : 'Mostrando el recorrido de las carreras.'}
      </p>

      {view === 'rows' ? (
        <MarqueeRows ref={rowsRef} startHidden={rowsHidden}>
          <button ref={allButton} type="button" onClick={showAll} disabled={busy} className={buttonClass}>
            Ver todas las carreras
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </MarqueeRows>
      ) : (
        <div className="mx-auto max-w-6xl space-y-2 px-4 sm:px-6">
          <ProgramWall mode={wallMode} onClosed={onWallClosed} />
          <div className="flex justify-center pb-4">
            <button ref={backButton} type="button" onClick={showRows} disabled={busy} className={buttonClass}>
              <Rows3 className="h-4 w-4" aria-hidden="true" />
              Ver el recorrido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
