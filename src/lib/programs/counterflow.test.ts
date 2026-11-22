import { describe, expect, it } from 'vitest';
import { rowOffsets, rowTravel, scrollProgress } from './counterflow';

const geometry = { height: 2000, sceneHeight: 700, viewportHeight: 800, pinTop: 56 };

describe('avance del recorrido', () => {
  it('empieza en 0 cuando la sección asoma por abajo y termina en 1 al acabar la escena fija', () => {
    expect(scrollProgress({ ...geometry, top: 800 })).toBe(0);
    // La escena termina cuando el tramo fijo (alto − escena) se ha recorrido por completo.
    expect(scrollProgress({ ...geometry, top: 56 - (2000 - 700) })).toBeCloseTo(1);
  });

  it('no se sale de 0 a 1 por más que se desplace la página', () => {
    expect(scrollProgress({ ...geometry, top: 5000 })).toBe(0);
    expect(scrollProgress({ ...geometry, top: -9000 })).toBe(1);
  });

  it('avanza en línea recta con el scroll y es reversible: la misma posición da el mismo avance', () => {
    const at = (top: number) => scrollProgress({ ...geometry, top });
    expect(at(400) - at(500)).toBeCloseTo(at(300) - at(400));
    expect(at(400)).toBe(at(400));
  });
});

describe('desplazamiento de las filas', () => {
  it('las dos filas van en sentidos opuestos y se cruzan a la mitad', () => {
    const start = rowOffsets(0, 10);
    const middle = rowOffsets(0.5, 10);
    const end = rowOffsets(1, 10);
    expect(start).toEqual({ first: -0, second: -10 });
    expect(middle).toEqual({ first: -5, second: -5 });
    expect(end).toEqual({ first: -10, second: 0 });
  });

  it('se mueve poco en pantallas anchas y mucho en celular', () => {
    expect(rowTravel(false)).toBe(10);
    expect(rowTravel(true)).toBe(50);
  });
});
