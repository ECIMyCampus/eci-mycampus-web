'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, Rows3 } from 'lucide-react';
import { useReducedMotion } from '../../lib/use-media-query';
import { CounterflowHandle, CounterflowRows } from './CounterflowRows';
import { ProgramWall } from './ProgramWall';

type View = 'rows' | 'wall';

const buttonClass =
  'pressable inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-surface-raised px-5 text-sm font-semibold text-ink transition-colors duration-fast ease-out hover:border-ink-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink disabled:pointer-events-none disabled:opacity-60';

/**
 * Las carreras de pregrado en dos vistas. El recorrido pasa los trece programas en dos filas a contraflujo mientras se
 * baja la página; «Ver todas las carreras» los junta en el centro y los voltea para armar el muro. Desde el muro se
 * puede volver: el muro se desarma al revés y los cuadros regresan a sus filas.
 */
export function ProgramsExplorer() {
  const reduced = useReducedMotion();
  const [view, setView] = useState<View>('rows');
  const [wallOpen, setWallOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const [returning, setReturning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<CounterflowHandle>(null);
  const allButton = useRef<HTMLButtonElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const focusNext = useRef<View | null>(null);

  const showAll = async () => {
    if (busy) return;
    setBusy(true);
    await rowsRef.current?.group();
    setWallOpen(true);
    focusNext.current = 'wall';
    setView('wall');
    setBusy(false);
  };

  const showRows = () => {
    if (busy) return;
    setBusy(true);
    setWallOpen(false);
  };

  const onWallClosed = () => {
    setReturning(true);
    focusNext.current = 'rows';
    setView('rows');
    setBusy(false);
  };

  // Al cambiar de vista la página cambia de alto: se lleva el inicio de la sección a la vista y el foco al botón nuevo,
  // porque el que se tocó ya no existe.
  useLayoutEffect(() => {
    const target = focusNext.current;
    if (!target) return;
    focusNext.current = null;
    containerRef.current?.scrollIntoView?.({ block: 'start', behavior: 'auto' });
    (target === 'wall' ? backButton.current : allButton.current)?.focus({ preventScroll: true });
  }, [view]);

  // Después del primer regreso las filas ya no entran desde el centro si se vuelve a montar por otra razón.
  useEffect(() => {
    if (view === 'wall') setReturning(false);
  }, [view]);

  return (
    <div ref={containerRef} className="scroll-mt-14">
      <p className="sr-only" role="status">
        {view === 'wall' ? 'Mostrando todas las carreras en el muro.' : 'Mostrando el recorrido de las carreras.'}
      </p>

      {view === 'rows' ? (
        <CounterflowRows ref={rowsRef} enterFromCenter={returning && !reduced}>
          <button ref={allButton} type="button" onClick={showAll} disabled={busy} className={buttonClass}>
            Ver todas las carreras
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </CounterflowRows>
      ) : (
        <div className="mx-auto max-w-6xl space-y-2 px-4 sm:px-6">
          <ProgramWall open={wallOpen} onClosed={onWallClosed} />
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
