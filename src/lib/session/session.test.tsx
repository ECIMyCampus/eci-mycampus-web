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

/** Backend simulado: la sesión existe solo después de un login correcto, como con la cookie. */
function stubBackend({ loggedIn = false }: { loggedIn?: boolean } = {}) {
  let session = loggedIn;
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/auth/me')) return session ? jsonResponse(200, ME) : jsonResponse(401, { mensaje: 'No autenticado' });
    if (url.endsWith('/auth/login')) {
      session = true;
      return jsonResponse(200, { user: ME });
    }
    if (url.endsWith('/auth/register')) return jsonResponse(201, { message: 'ok' });
    if (url.endsWith('/auth/logout')) {
      session = false;
      return new Response(null, { status: 204 });
    }
    if (url.includes('/events/') && init?.method === 'POST') return jsonResponse(401, { mensaje: 'Token inválido' });
    throw new Error(`Llamada inesperada: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return {
    fetchMock,
    expireSession: () => {
      session = false;
    },
  };
}

function Probe() {
  const { status, user, login, register, logout } = useSession();
  return (
    <div>
      <p data-testid="estado">{status}</p>
      <p data-testid="nombre">{user?.fullName ?? '-'}</p>
      <button onClick={() => login(ME.email, 'Secreto123')}>entrar</button>
      <button
        onClick={() =>
          register({ email: ME.email, password: 'Secreto123', fullName: ME.fullName, habeasDataAccepted: true })
        }
      >
        registrar
      </button>
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

  it('empieza cargando y termina como visitante si /auth/me responde 401', async () => {
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

  it('registrarse entra directamente, sin pedir iniciar sesión otra vez', async () => {
    const { fetchMock } = stubBackend();
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('estado').textContent).toBe('anonymous'));

    fireEvent.click(screen.getByText('registrar'));

    await waitFor(() => expect(screen.getByTestId('estado').textContent).toBe('authenticated'));
    const called = fetchMock.mock.calls.map(([url]) => String(url).replace('/api/v1', ''));
    expect(called).toEqual(['/auth/me', '/auth/register', '/auth/login', '/auth/me']);
  });

  it('vuelve a visitante cuando una acción con sesión recibe 401', async () => {
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
