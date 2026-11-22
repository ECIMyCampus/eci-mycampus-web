/** Matemática del recorrido a contraflujo: dos filas que se mueven en sentidos opuestos según el avance del scroll. */
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Cuánto se desplaza cada fila, en % de su propio ancho: poco en pantallas anchas y mucho en el celular. */
export const rowTravel = (narrow: boolean) => (narrow ? 50 : 10);

export interface ScrollGeometry {
  /** `getBoundingClientRect().top` de la sección. */
  top: number;
  /** Alto total de la sección (la pantalla fija más el tramo de scroll). */
  height: number;
  /** Alto de la escena fija. */
  sceneHeight: number;
  /** Alto de la ventana. */
  viewportHeight: number;
  /** Donde queda fija la escena: debajo de la barra superior. */
  pinTop: number;
}

/**
 * Avance de 0 a 1 desde que la sección asoma por abajo hasta que la escena fija termina su recorrido.
 * Es una función directa del scroll, sin suavizado: al subir, la composición vuelve exactamente por donde fue.
 */
export function scrollProgress({ top, height, sceneHeight, viewportHeight, pinTop }: ScrollGeometry): number {
  const pinned = height - sceneHeight;
  return clamp01((viewportHeight - top) / (viewportHeight - pinTop + pinned));
}

/** Desplazamiento de cada fila en % de su ancho: la primera va hacia la izquierda y la segunda, hacia la derecha. */
export function rowOffsets(p: number, travel: number): { first: number; second: number } {
  return { first: -travel * p, second: -travel + travel * p };
}
