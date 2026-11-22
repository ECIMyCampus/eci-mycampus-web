// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PROGRAMS } from '../../lib/programs/programs';
import { ProgramsExplorer } from './ProgramsExplorer';

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

describe('ProgramsExplorer', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('empieza con el recorrido: los 13 programas en dos filas y el botón para verlos todos', () => {
    mockMotion(false);
    render(<ProgramsExplorer />);

    expect(screen.getByRole('list', { name: 'Programas de pregrado, primera fila' }).children).toHaveLength(7);
    expect(screen.getByRole('list', { name: 'Programas de pregrado, segunda fila' }).children).toHaveLength(6);
    for (const program of PROGRAMS) expect(screen.getAllByText(program.lines[1]).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Ver todas las carreras/ })).toBeTruthy();
  });

  it('«Ver todas las carreras» arma el muro con los 13 cuadros y ofrece volver al recorrido', async () => {
    mockMotion(false);
    render(<ProgramsExplorer />);

    fireEvent.click(screen.getByRole('button', { name: /Ver todas las carreras/ }));

    expect(await screen.findByRole('button', { name: /Ver el recorrido/ })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /programa de pregrado/ })).toHaveLength(13);
    expect(screen.queryByRole('list', { name: /primera fila/ })).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('todas las carreras');
  });

  it('con movimiento reducido se puede ir y volver sin esperar animaciones', async () => {
    mockMotion(true);
    render(<ProgramsExplorer />);

    fireEvent.click(screen.getByRole('button', { name: /Ver todas las carreras/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Ver el recorrido/ }));

    await waitFor(() => expect(screen.getByRole('list', { name: /primera fila/ })).toBeTruthy());
    expect(screen.getByRole('button', { name: /Ver todas las carreras/ })).toBeTruthy();
  });
});
