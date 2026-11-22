// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PROGRAMS } from '../../lib/programs/programs';
import { ProgramWall } from './ProgramWall';

const mockMotion = (reduce: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes('reduce'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );

describe('ProgramWall', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('muestra los 13 programas, 12 en el muro y Matemáticas en manos de Manchas', () => {
    mockMotion(false);
    const { container } = render(<ProgramWall />);

    // Consultas directas al DOM: las de rol son lentas con tantos botones y la prueba no depende de ellas.
    expect(container.querySelectorAll('button[aria-label$="Ver el programa"]')).toHaveLength(13);
    for (const program of PROGRAMS) {
      expect(container.querySelector(`button[aria-label^="${program.name},"]`)).toBeTruthy();
    }
  });

  it('al tocar un cuadro se voltea: queda expandido y su enlace oficial se vuelve alcanzable', () => {
    mockMotion(false);
    render(<ProgramWall />);

    const sistemas = screen.getByRole('button', { name: /^Ingeniería de Sistemas,/ });
    expect(sistemas.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(sistemas);

    expect(sistemas.getAttribute('aria-expanded')).toBe('true');
    const link = screen.getByRole('link', { name: /Ver Ingeniería de Sistemas en escuelaing.edu.co/ });
    expect(link.getAttribute('href')).toBe('https://www.escuelaing.edu.co/es/programas/ingenieria-de-sistemas/');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('solo un cuadro está abierto a la vez y Escape lo devuelve', () => {
    mockMotion(false);
    render(<ProgramWall />);

    const sistemas = screen.getByRole('button', { name: /^Ingeniería de Sistemas,/ });
    const civil = screen.getByRole('button', { name: /^Ingeniería Civil,/ });
    fireEvent.click(sistemas);
    fireEvent.click(civil);
    expect(sistemas.getAttribute('aria-expanded')).toBe('false');
    expect(civil.getAttribute('aria-expanded')).toBe('true');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(civil.getAttribute('aria-expanded')).toBe('false');
  });

  it('con movimiento reducido los cuadros quedan completos y se pueden tocar de inmediato', () => {
    mockMotion(true);
    render(<ProgramWall />);

    const tile = screen.getByRole('button', { name: /^Economía,/ }).closest('[style*="aspect-ratio"]') as HTMLElement;
    expect(tile.style.pointerEvents).toBe('auto');
    expect(tile.style.transform).toContain('rotateY(0deg)');
  });

  it('ofrece repetir la animación', () => {
    mockMotion(false);
    render(<ProgramWall />);
    expect(screen.getByRole('button', { name: 'Repetir la animación' })).toBeTruthy();
  });
});
