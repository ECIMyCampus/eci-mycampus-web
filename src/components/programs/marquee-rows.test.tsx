// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PROGRAMS } from '../../lib/programs/programs';
import { MarqueeRows } from './MarqueeRows';

const mockMotion = (reduce: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('reduce') ? reduce : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );

describe('MarqueeRows', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('pasa los 13 programas en dos filas, la primera hacia la izquierda y la segunda hacia la derecha', () => {
    mockMotion(false);
    const { container } = render(<MarqueeRows />);

    expect(screen.getByRole('list', { name: /primera fila/ }).children).toHaveLength(7);
    expect(screen.getByRole('list', { name: /segunda fila/ }).children).toHaveLength(6);
    expect(Array.from(container.querySelectorAll('.marquee-track')).map((t) => t.getAttribute('data-direction'))).toEqual(['left', 'right']);
    for (const program of PROGRAMS) {
      expect(container.querySelectorAll(`[data-row-tile="${program.slug}"]`).length).toBe(4); // cuatro copias por fila
    }
  });

  it('solo el primer tramo de cada fila es contenido para lectores de pantalla; las copias son relleno', () => {
    mockMotion(false);
    const { container } = render(<MarqueeRows />);
    expect(container.querySelectorAll('ul[aria-hidden="true"]')).toHaveLength(6); // 3 copias × 2 filas
  });

  it('se puede pausar y reanudar con un botón', () => {
    mockMotion(false);
    const { container } = render(<MarqueeRows />);
    const scene = container.querySelector('.marquee-scene') as HTMLElement;
    expect(scene.getAttribute('data-paused')).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: 'Pausar el recorrido' }));
    expect(scene.getAttribute('data-paused')).toBe('true');
    expect(screen.getByRole('button', { name: 'Reanudar el recorrido' }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Reanudar el recorrido' }));
    expect(scene.getAttribute('data-paused')).toBe('false');
  });

  it('con movimiento reducido no ofrece pausar porque nada se mueve', () => {
    mockMotion(true);
    render(<MarqueeRows />);
    expect(screen.queryByRole('button', { name: /recorrido/ })).toBeNull();
  });

  it('puede empezar oculto, para los vuelos de regreso', () => {
    mockMotion(false);
    const { container } = render(<MarqueeRows startHidden />);
    for (const track of Array.from(container.querySelectorAll<HTMLElement>('.marquee-track'))) {
      expect(track.style.visibility).toBe('hidden');
    }
  });
});
