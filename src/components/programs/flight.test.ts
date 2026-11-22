// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { prepareFlight } from './flight';

const rect = (left: number, top: number, width: number, height: number) => ({ left, top, width, height }) as DOMRect;

describe('prepareFlight', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const source = () => {
    const el = document.createElement('li');
    el.setAttribute('data-row-tile', 'civil');
    el.innerHTML = '<span data-front="civil">Civil</span>';
    return el;
  };

  it('pone copias fijas justo encima de cada origen, sin marcas que las confundan con los cuadros reales', () => {
    const flight = prepareFlight([{ source: source(), from: rect(10, 20, 200, 160) }]);

    const layer = document.body.lastElementChild as HTMLElement;
    expect(layer.getAttribute('aria-hidden')).toBe('true');
    const ghost = layer.firstElementChild as HTMLElement;
    expect(ghost.style.position).toBe('fixed');
    expect([ghost.style.left, ghost.style.top, ghost.style.width, ghost.style.height]).toEqual(['10px', '20px', '200px', '160px']);
    expect(ghost.hasAttribute('data-row-tile')).toBe(false);
    expect(ghost.querySelector('[data-front]')).toBeNull();
    expect(ghost.hasAttribute('inert')).toBe(true);

    flight.remove();
    expect(document.body.children).toHaveLength(0);
  });

  it('aterriza sin esperar cuando el navegador no sabe animar', async () => {
    const flight = prepareFlight([{ source: source(), from: rect(0, 0, 100, 80) }]);
    await expect(flight.run([rect(300, 200, 50, 40)])).resolves.toBeUndefined();
    flight.remove();
  });
});
