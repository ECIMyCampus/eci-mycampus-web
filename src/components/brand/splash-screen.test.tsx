// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let status: 'loading' | 'authenticated' | 'anonymous' = 'loading';
vi.mock('../../lib/session/session', () => ({ useSession: () => ({ status }) }));
vi.mock('./LogoLoader', () => ({ LogoLoader: () => <div data-testid="logo" /> }));

import { SplashScreen } from './SplashScreen';

describe('SplashScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
    status = 'loading';
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('no aparece si la sesión se resuelve rápido', () => {
    const { rerender } = render(<SplashScreen />);
    act(() => void vi.advanceTimersByTime(100));
    status = 'anonymous';
    rerender(<SplashScreen />);
    act(() => void vi.advanceTimersByTime(1000));
    expect(screen.queryByTestId('logo')).toBeNull();
  });

  it('aparece si la sesión tarda y se queda al menos 1,2 s antes de retirarse', () => {
    const { rerender } = render(<SplashScreen />);
    act(() => void vi.advanceTimersByTime(350));
    expect(screen.getByText('Cargando ECI MyCampus')).toBeTruthy();
    expect(screen.getByTestId('logo')).toBeTruthy();

    status = 'authenticated';
    rerender(<SplashScreen />);
    act(() => void vi.advanceTimersByTime(600));
    expect(screen.queryByTestId('logo')).not.toBeNull();
    act(() => void vi.advanceTimersByTime(1000));
    expect(screen.queryByTestId('logo')).toBeNull();
  });

  it('solo se muestra una vez por pestaña', () => {
    window.sessionStorage.setItem('eci-splash-seen', '1');
    render(<SplashScreen />);
    act(() => void vi.advanceTimersByTime(2000));
    expect(screen.queryByTestId('logo')).toBeNull();
  });
});
