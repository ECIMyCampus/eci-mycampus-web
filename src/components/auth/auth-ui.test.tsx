// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SessionProvider } from '../../lib/session/session';
import { getInitials } from '../../lib/auth/labels';

const replace = vi.fn();
let search = new URLSearchParams();
const toastInfo = vi.fn();
vi.mock('sonner', () => ({ toast: { info: (...args: unknown[]) => toastInfo(...args) } }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => search,
  usePathname: () => '/',
}));

import { LoginForm } from './LoginForm';
import { ProfileView } from './ProfileView';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const ME = {
  id: 'u1',
  email: 'ana@mail.escuelaing.edu.co',
  role: 'ESTUDIANTE',
  fullName: 'Ana María Pérez',
  facultyId: 'fac-1',
  isAuthorizedOrganizer: false,
  createdAt: '2026-11-15T12:00:00.000Z',
  academicProgram: 'Ingeniería de Sistemas',
  interests: ['Robótica', 'IA'],
  avatarUrl: null,
};

type Handler = (init?: RequestInit) => Response | Promise<Response>;

/** Backend simulado. La cookie de refresco existe solo después de un login correcto. */
function stubBackend(overrides: Record<string, Handler> = {}, { loggedIn = false } = {}) {
  let session = loggedIn;
  const handlers: Record<string, Handler> = {
    '/auth/refresh': () => (session ? json(200, { token: 'tk' }) : json(401, { mensaje: 'Sin sesión' })),
    '/auth/me': () => json(200, ME),
    '/auth/login': () => {
      session = true;
      return json(200, { token: 'tk', user: ME });
    },
    '/auth/logout': () => {
      session = false;
      return json(200, { message: 'ok' });
    },
    '/campus/faculties': () => json(200, [{ id: 'fac-1', name: 'Ingeniería de Sistemas', slug: 'sistemas', hexColor: '#000' }]),
    ...overrides,
  };
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const handler = handlers[String(url).replace('/api/v1', '')];
    if (!handler) throw new Error(`Llamada inesperada: ${url}`);
    return handler(init);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const calls = (fetchMock: ReturnType<typeof stubBackend>, path: string) =>
  fetchMock.mock.calls.filter(([url]) => String(url).endsWith(path));

const withSession = (ui: React.ReactElement) => render(<SessionProvider>{ui}</SessionProvider>);

beforeEach(() => {
  replace.mockClear();
  search = new URLSearchParams();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('LoginForm', () => {
  it('ofrece Microsoft y entrar como invitado, sin crear cuenta ni formulario de correo', async () => {
    stubBackend();
    withSession(<LoginForm />);

    expect(screen.getByRole('heading', { name: 'Acceder' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Iniciar sesión con Microsoft/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Entrar como invitado' }).getAttribute('href')).toBe('/');
    expect(screen.queryByText(/Crear cuenta/)).toBeNull();
    expect(screen.queryByLabelText(/Contraseña/)).toBeNull();
    expect(screen.queryByText(/correo y contraseña/i)).toBeNull();
  });

  it('avisa que el acceso con Microsoft llega pronto mientras el backend no lo exponga', () => {
    stubBackend();
    withSession(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión con Microsoft/ }));

    expect(toastInfo).toHaveBeenCalledWith(expect.stringMatching(/estará disponible pronto/));
  });

  it('explica el rechazo cuando la cuenta no es de la Escuela', () => {
    search = new URLSearchParams('error=dominio');
    stubBackend();
    withSession(<LoginForm />);

    expect(screen.getByRole('alert').textContent).toMatch(/no es de la Escuela/);
  });

  it('muestra un aviso general ante un motivo de error desconocido', () => {
    search = new URLSearchParams('error=otro');
    stubBackend();
    withSession(<LoginForm />);

    expect(screen.getByRole('alert').textContent).toMatch(/No pudimos completar el acceso con Microsoft/);
  });

  it('quien ya tiene sesión es llevado a su destino', async () => {
    search = new URLSearchParams('volver=/mis-eventos');
    stubBackend({}, { loggedIn: true });
    withSession(<LoginForm />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/mis-eventos'));
  });
});

describe('ProfileView', () => {
  it('sin sesión lleva a iniciar sesión y regresa al perfil', async () => {
    stubBackend();
    withSession(<ProfileView />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login?volver=%2Fperfil'));
  });

  it('muestra los datos reales de la cuenta, con la facultad por nombre', async () => {
    stubBackend({}, { loggedIn: true });
    withSession(<ProfileView />);

    expect(await screen.findByRole('heading', { name: 'Ana María Pérez' })).toBeTruthy();
    expect(screen.getByText('Estudiante')).toBeTruthy();
    expect(screen.getByText('ana@mail.escuelaing.edu.co')).toBeTruthy();
    // Programa y facultad se llaman igual en estos datos; la facultad llega cuando carga su lista.
    await waitFor(() => expect(screen.getAllByText('Ingeniería de Sistemas', { selector: 'dd' })).toHaveLength(2));
    expect(screen.getByText(/noviembre.*2026/)).toBeTruthy();
    expect(screen.getByText('Robótica')).toBeTruthy();
  });

  it('cierra la sesión y vuelve al inicio', async () => {
    const fetchMock = stubBackend({}, { loggedIn: true });
    withSession(<ProfileView />);

    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(calls(fetchMock, '/auth/logout')).toHaveLength(1);
  });

  it('si no se puede cerrar la sesión, lo dice y conserva la sesión', async () => {
    stubBackend({ '/auth/logout': () => Promise.reject(new TypeError('Failed to fetch')) }, { loggedIn: true });
    withSession(<ProfileView />);

    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/No pudimos conectar/);
    expect(replace).not.toHaveBeenCalledWith('/');
    expect(screen.getByRole('heading', { name: 'Ana María Pérez' })).toBeTruthy();
  });
});

describe('iniciales del avatar', () => {
  it.each([
    ['Ana María Pérez', 'AP'],
    ['  carlos   gómez ', 'CG'],
    ['Jo', 'J'],
    ['😀 Emoji Nombre', '😀N'],
    ['', '?'],
  ])('%j → %s', (name, initials) => {
    expect(getInitials(name)).toBe(initials);
  });
});
