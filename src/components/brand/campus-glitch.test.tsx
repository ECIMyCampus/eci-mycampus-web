// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { CampusGlitch } from './CampusGlitch';

describe('CampusGlitch', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('va detrás del contenido, sin recibir toques ni anunciarse a lectores de pantalla', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const { container } = render(<CampusGlitch />);

    const layer = container.firstElementChild as HTMLElement;
    expect(layer.getAttribute('aria-hidden')).toBe('true');
    expect(layer.className).toContain('pointer-events-none');
    expect(layer.className).toContain('-z-10');
    expect(container.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('sin WebGL2 no falla: deja el lienzo vacío y la página sigue con su fondo', () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(() => render(<CampusGlitch />)).not.toThrow();
    expect(getContext).toHaveBeenCalledWith('webgl2', expect.any(Object));
  });
});
