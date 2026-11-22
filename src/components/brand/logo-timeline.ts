/** Cronología del logotipo animado: dibujar → rellenar → sostener → desvanecer. Todo en milisegundos. */
export const CYCLE_MS = 5600;
export const DRAW_MS = 2650;
export const FILL_AT_MS = 3100;
export const FILL_MS = 700;
export const HOLD_END_MS = 5000;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Curva suave de entrada y salida. */
export const ease = (v: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(v));

/**
 * Retraso de cada contorno: «ECI» arranca de a 90 ms (0, 90, 180) y «MyCampus» reparte de 120 a 340 ms.
 * El último contorno termina de dibujarse a los 2990 ms, antes de que empiece el relleno (3100 ms).
 */
export function glyphDelay(line: 0 | 1, index: number, count: number): number {
  if (line === 0) return index * 90;
  return count <= 1 ? 120 : Math.round(120 + (index * 220) / (count - 1));
}

export interface Frame {
  /** Opacidad del grupo relleno. */
  fill: number;
  /** Opacidad del grupo de contornos. */
  outline: number;
  /** Opacidad de todo el logotipo (baja al final del ciclo). */
  group: number;
  /** Avance del trazo de un contorno, de 0 a 1, según su retraso. */
  draw: (delay: number) => number;
}

/** Estado de la animación a los `ms` de iniciar; el ciclo se repite cada 5600 ms. */
export function frameAt(ms: number): Frame {
  const t = ((ms % CYCLE_MS) + CYCLE_MS) % CYCLE_MS;
  const fill = ease((t - FILL_AT_MS) / FILL_MS);
  return {
    fill,
    outline: 1 - fill,
    group: t < HOLD_END_MS ? 1 : 1 - ease((t - HOLD_END_MS) / (CYCLE_MS - HOLD_END_MS)),
    draw: (delay) => ease((t - delay) / DRAW_MS),
  };
}

/** Logotipo completo y relleno: lo que se muestra con movimiento reducido o si algo falla. */
export const STATIC_FRAME: Frame = { fill: 1, outline: 0, group: 1, draw: () => 1 };
