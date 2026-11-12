'use client';

import { useSyncExternalStore } from 'react';

/** Se suscribe a una media query del navegador. En el servidor devuelve `false`. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener?.('change', onChange);
      return () => list.removeEventListener?.('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** La persona pidió menos movimiento en su sistema. */
export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
