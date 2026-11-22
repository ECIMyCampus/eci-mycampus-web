import { describe, expect, it } from 'vitest';
import { CYCLE_MS, DRAW_MS, FILL_AT_MS, ease, frameAt, glyphDelay } from './logo-timeline';

describe('ease', () => {
  it('va de 0 a 1 sin salirse del rango', () => {
    expect(ease(-1)).toBe(0);
    expect(ease(0)).toBe(0);
    expect(ease(0.5)).toBeCloseTo(0.5);
    expect(ease(1)).toBe(1);
    expect(ease(3)).toBe(1);
  });
});

describe('glyphDelay', () => {
  it('«ECI» arranca de a 90 ms y «MyCampus» reparte de 120 a 340 ms', () => {
    expect([0, 1, 2].map((i) => glyphDelay(0, i, 3))).toEqual([0, 90, 180]);
    expect(glyphDelay(1, 0, 8)).toBe(120);
    expect(glyphDelay(1, 7, 8)).toBe(340);
  });

  it('todos los contornos terminan de dibujarse antes de que empiece el relleno', () => {
    const last = Math.max(glyphDelay(0, 2, 3), glyphDelay(1, 7, 8));
    expect(last + DRAW_MS).toBeLessThanOrEqual(FILL_AT_MS);
  });
});

describe('frameAt', () => {
  it('empieza sin nada dibujado y con el relleno apagado', () => {
    const frame = frameAt(0);
    expect(frame.draw(0)).toBe(0);
    expect(frame.fill).toBe(0);
    expect(frame.outline).toBe(1);
    expect(frame.group).toBe(1);
  });

  it('cruza del contorno al relleno entre 3100 y 3800 ms', () => {
    expect(frameAt(3100).fill).toBe(0);
    const mid = frameAt(3450);
    expect(mid.fill).toBeCloseTo(0.5);
    expect(mid.outline).toBeCloseTo(0.5);
    expect(frameAt(3800).fill).toBe(1);
    expect(frameAt(3800).outline).toBe(0);
  });

  it('sostiene el logotipo completo hasta los 5000 ms y luego lo desvanece', () => {
    expect(frameAt(4900).group).toBe(1);
    const fading = frameAt(5300).group;
    expect(fading).toBeGreaterThan(0);
    expect(fading).toBeLessThan(1);
    expect(frameAt(5599).group).toBeLessThan(0.001);
  });

  it('se repite cada 5600 ms', () => {
    expect(frameAt(CYCLE_MS + 1200).fill).toBe(frameAt(1200).fill);
    expect(frameAt(CYCLE_MS + 1200).draw(90)).toBe(frameAt(1200).draw(90));
  });
});
