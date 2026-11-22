// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SessionProvider, useSession } from './session';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const ME = {
  id: 'u1',
  email: 'ana@mail.escuelaing.edu.co',
  role: 'ESTUDIANTE',
  fullName: 'Ana Pérez',
  facultyId: null,
  isAuthorizedOrganizer: false,
  createdAt: '2026-11-01T00:00:00.000Z',
  academicProgram: null,
  interests: [],
  avatarUrl: null,
};

/**
 * Backend simulado: la cookie de refresco existe tras un login correcto (o desde el inicio si
 * `loggedIn`), y el refresco entrega un token nuevo mientras la cookie siga viva.
 */
function stubBackend({ loggedIn = false }: { loggedIn?: boolean } = {}) {
  let cookie = loggedIn;
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/auth/refresh')) return cookie ? jsonResponse(200, { token: 'tk' }) : jsonResponse(401, { mensaje: 'Sin sesión' });
    if (url.endsWith('/auth/me')) return jsonResponse(200, ME);
    if (url.endsWith('/auth/login')) {
      cookie = true;
      return jsonResponse(200, { token: 'tk', user: ME });
    }
    if (url.endsWith('/auth/logout')) {
      cookie = false;
      return jsonResponse(200, { message: 'ok' });
    }
    if (url.includes('/registrations/') && init?.method === 'POST') return jsonResponse(401, { mensaje: 'Token inválido' });
    throw new Error(`Llamada inesperada: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return {
    fetchMock,
    expireSession: () => {
      cookie = false;
    },
  };
}

function Probe() {
  const { status, user, login, logout } = useSession();
  return (
    <div>
      <p data-testid="estado">{status}</p>
      <p data-testid="nombre">{user?.fullName ?? '-'}</p>
      <button onClick={() => login(ME.email, 'Secreto123')}>entrar</button>
      <button onClick={() => logout()}>salir</button>
    </div>
  );
}

const renderProbe = () =>
  render(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );

describe('SessionProvider', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('empieza cargando y termina como visitante si no hay cookie de refresco', async () => {
    stubBackend();
    renderProbe();

    expect(screen.getByTestId('estado').textContent).toBe('loading');
    await waitFor(() => expect(screen.getByTestId('estado').textContent).toBe('anonymous'));
    expect(screen.getByTestId('nombre').textContent).toBe('-');
  });

  it('recupera la sesión existente al abrir la aplicación', async () => {
    stubBackend({ loggedIn: true });
    renderProbe();

    await waitFor(() => expect(screen.getByTestId('estado').textContent).toBe('authenticated'));
    expect(screen.getByTestId('nombre').textContent).toBe('Ana Pérez');
  });

  it('inicia y cierra sesión', async () => {
    stubBackend();
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('estado').textContent).toBe('anonymous'));

    fireEvent.click(screen.getByText('entrar'));
    await waitFor(() => expect(screen.getByTestId('estado').textContent).toBe('authenticated'));
    expect(screen.getByTestId('nombre').textContent).toBe('Ana Pérez');

    fireEvent.click(screen.getByText('salir'));
    await waitFor(() => expect(screen.getByTestId('estado').textContent).toBe('anonymous'));
    expect(screen.getByTestId('nombre').textContent).toBe('-');
  });

  it('vuelve a visitante cuando una acción con sesión recibe 401 y el refresco ya no sirve', async () => {
    const { expireSession } = stubBackend({ loggedIn: true });
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('estado').textContent).toBe('authenticated'));

    expireSession();
    const { api } = await import('../api');
    await act(async () => {
      await api.registerToEvent('e1').catch(() => undefined);
    });

    expect(screen.getByTestId('estado').textContent).toBe('anonymous');
  });

  it('useSession fuera del proveedor avisa con un error claro', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Probe />)).toThrow('useSession debe usarse dentro de <SessionProvider>');

    spy.mockRestore();
  });
});
