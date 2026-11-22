/** Matemática del muro de cuadros: cascada de volteo, resorte y medidas. Todo en unidades del muro (1,5 de ancho por cuadro). */
export const TILE_W = 1.5;
export const TILE_H = 1.25;
export const TILE_GAP = 0.024;
export const TILE_STEP = TILE_W + TILE_GAP;

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** Retraso de un cuadro en la onda diagonal: avanza por columna y por fila. */
export const flipDelay = (col: number, row: number) => col * 0.11 + row * 0.075;

export interface FlipPose {
  /** Avance suavizado del volteo del cuadro, de 0 a 1. */
  eased: number;
  /** Giro sobre Y en radianes: π con la cara oculta hacia nosotros y 0 con el color a la vista. */
  rotY: number;
  /** Inclinación sobre X en radianes, según la fila. */
  rotX: number;
  /** Empuje hacia el espectador, en unidades. */
  z: number;
  /** Separación hacia afuera, en unidades (y hacia abajo). */
  x: number;
  y: number;
}

/**
 * Pose de un cuadro en la entrada. `fraction` va de 0 a 1 para todo el muro; cada cuadro usa su retraso, se voltea,
 * se aleja del centro y se adelanta mientras gira (el arco), y vuelve plano al terminar.
 */
export function flipPose(fraction: number, col: number, row: number, cols: number, rows: number): FlipPose {
  const local = clamp(fraction * 1.48 - flipDelay(col, row), 0, 1);
  const eased = smoothstep(local);
  const arc = Math.sin(Math.PI * eased);
  const cx = col - (cols - 1) / 2;
  const cy = row - (rows - 1) / 2;
  return {
    eased,
    rotY: Math.PI * (1 - eased),
    rotX: arc * cy * 0.12,
    z: arc * (0.65 + row * 0.12),
    x: arc * 0.12 * cx,
    y: arc * 0.12 * cy,
  };
}

export interface Spring {
  value: number;
  velocity: number;
}

/**
 * Resorte críticamente amortiguado, con solución analítica (no se rompe con pasos de tiempo grandes).
 * `maxSpeed` limita cuánto se mueve el valor por segundo, para que varias órdenes seguidas no apuren la onda.
 * Devuelve `true` mientras siga en movimiento.
 */
export function stepSpring(spring: Spring, target: number, omega: number, dt: number, maxSpeed?: number): boolean {
  const step = Math.min(dt, 0.05);
  const offset = spring.value - target;
  const decay = Math.exp(-omega * step);
  const impulse = (spring.velocity + omega * offset) * step;
  let next = target + (offset + impulse) * decay;
  let velocity = (spring.velocity - omega * impulse) * decay;

  if (maxSpeed !== undefined) {
    const limit = maxSpeed * step;
    next = spring.value + clamp(next - spring.value, -limit, limit);
    velocity = clamp(velocity, -maxSpeed, maxSpeed);
  }

  spring.value = next;
  spring.velocity = velocity;
  if (Math.abs(next - target) < 1e-4 && Math.abs(velocity) < 5e-4) {
    spring.value = target;
    spring.velocity = 0;
    return false;
  }
  return true;
}
