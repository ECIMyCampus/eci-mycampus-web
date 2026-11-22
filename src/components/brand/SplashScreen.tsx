'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from '../../lib/session/session';
import { LogoLoader } from './LogoLoader';

/** Solo se muestra si la sesión tarda más de esto en restaurarse: con una respuesta rápida no aparece. */
const SHOW_AFTER_MS = 300;
/** Una vez visible, se queda al menos esto para que no parpadee. */
const MIN_VISIBLE_MS = 1200;
const FADE_MS = 250;
const SEEN_KEY = 'eci-splash-seen';

const wasSeen = () => {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

const markSeen = () => {
  try {
    window.sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* sin almacenamiento: solo se vuelve a mostrar en la próxima carga lenta */
  }
};

/**
 * Pantalla de carga con el logotipo animado, para cuando restaurar la sesión tarda. Se muestra una vez por pestaña y
 * no reemplaza a los marcadores de carga de cada vista: solo cubre el arranque.
 */
export function SplashScreen() {
  const { status } = useSession();
  const [shownAt, setShownAt] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  // Arranque lento: se muestra después de una pausa corta.
  useEffect(() => {
    if (status !== 'loading' || wasSeen()) return;
    const timer = window.setTimeout(() => setShownAt(Date.now()), SHOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  // La sesión ya se resolvió: se marca como visto y, si estaba visible, se retira con un desvanecimiento.
  useEffect(() => {
    if (status === 'loading') return;
    markSeen();
    if (shownAt === null) return;
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt));
    const fade = window.setTimeout(() => setLeaving(true), wait);
    const remove = window.setTimeout(() => setGone(true), wait + FADE_MS);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(remove);
    };
  }, [status, shownAt]);

  if (shownAt === null || gone) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[60] bg-canvas transition-opacity ease-out"
      style={{ opacity: leaving ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}
    >
      <span className="sr-only">Cargando ECI MyCampus</span>
      <LogoLoader controls={false} />
    </div>
  );
}
