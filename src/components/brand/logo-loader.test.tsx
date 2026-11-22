// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LogoLoader } from './LogoLoader';

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

describe('LogoLoader', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('tiene un nombre accesible y dibuja las 11 letras', () => {
    mockMotion(false);
    const { container } = render(<LogoLoader />);
    expect(screen.getByRole('img', { name: 'Logotipo de ECI MyCampus' })).toBeTruthy();
    expect(container.querySelectorAll('path[pathLength]')).toHaveLength(11);
  });

  it('con movimiento reducido muestra el logotipo completo y desactiva los botones', () => {
    mockMotion(true);
    const { container } = render(<LogoLoader />);
    const groups = container.querySelectorAll('svg > g > g');
    expect(groups[0].getAttribute('opacity')).toBe('1'); // relleno
    expect(groups[1].getAttribute('opacity')).toBe('0'); // contornos
    expect((screen.getByRole('button', { name: 'Pausar la animación' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Repetir la animación' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('pausa y reanuda, y puede ocultar los botones', () => {
    mockMotion(false);
    const { rerender } = render(<LogoLoader />);
    fireEvent.click(screen.getByRole('button', { name: 'Pausar la animación' }));
    expect(screen.getByRole('button', { name: 'Reanudar la animación' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Repetir la animación' }));
    expect(screen.getByRole('button', { name: 'Pausar la animación' })).toBeTruthy();

    rerender(<LogoLoader controls={false} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('al desmontar quita sus escuchas y cancela el cuadro pendiente', () => {
    mockMotion(false);
    const remove = vi.spyOn(document, 'removeEventListener');
    const { unmount } = render(<LogoLoader />);
    unmount();
    expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });
});
