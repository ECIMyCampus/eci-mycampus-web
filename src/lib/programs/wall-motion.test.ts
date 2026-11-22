import { describe, expect, it } from 'vitest';
import { Spring, flipDelay, flipPose, stepSpring } from './wall-motion';

describe('cascada de volteo', () => {
  it('el retraso crece por columna y por fila, y el último cuadro del muro de 4×3 termina justo al final', () => {
    expect(flipDelay(0, 0)).toBe(0);
    expect(flipDelay(3, 2)).toBeCloseTo(0.48);
    expect(flipDelay(1, 0)).toBeLessThan(flipDelay(0, 1) + 0.04);
  });

  it('empieza con la cara oculta a la vista y termina plano, con el color de frente', () => {
    const start = flipPose(0, 2, 1, 4, 3);
    expect(start.rotY).toBeCloseTo(Math.PI);
    expect(start.z).toBe(0);

    const end = flipPose(1, 3, 2, 4, 3);
    expect(end.rotY).toBeCloseTo(0);
    expect(end.z).toBeCloseTo(0);
    expect(end.x).toBeCloseTo(0);
    expect(end.y).toBeCloseTo(0);
  });

  it('a mitad de camino un cuadro está en el aire: adelantado y separado del centro', () => {
    const mid = flipPose(0.55, 0, 0, 4, 3);
    expect(mid.eased).toBeGreaterThan(0);
    expect(mid.eased).toBeLessThan(1);
    expect(mid.z).toBeGreaterThan(0);
    expect(mid.x).toBeLessThan(0); // la columna izquierda se abre hacia la izquierda
  });

  it('un cuadro más lejano en la onda va por detrás de uno cercano', () => {
    expect(flipPose(0.5, 3, 2, 4, 3).eased).toBeLessThan(flipPose(0.5, 0, 0, 4, 3).eased);
  });
});

describe('resorte', () => {
  it('llega al objetivo y se detiene sin pasarse', () => {
    const s: Spring = { value: 0, velocity: 0 };
    let peak = 0;
    while (stepSpring(s, 1, 9, 1 / 60)) peak = Math.max(peak, s.value);
    expect(s.value).toBe(1);
    expect(peak).toBeLessThanOrEqual(1.0001);
  });

  it('con tope de velocidad no avanza más de 0,85 por segundo', () => {
    const s: Spring = { value: 0, velocity: 0 };
    for (let i = 0; i < 60; i++) stepSpring(s, 1, 3.6, 1 / 60, 0.85);
    expect(s.value).toBeLessThanOrEqual(0.85 + 1e-6);
  });

  it('una pausa larga no la dispara: el paso de tiempo se limita', () => {
    const a: Spring = { value: 0, velocity: 0 };
    const b: Spring = { value: 0, velocity: 0 };
    stepSpring(a, 1, 9, 5);
    stepSpring(b, 1, 9, 0.05);
    expect(a.value).toBeCloseTo(b.value);
  });

  it('el volteo completo de la entrada termina en un tiempo razonable', () => {
    const s: Spring = { value: 0, velocity: 0 };
    let seconds = 0;
    while (stepSpring(s, 1, 3.6, 1 / 60, 0.85) && seconds < 20) seconds += 1 / 60;
    expect(seconds).toBeLessThan(8);
  });
});
