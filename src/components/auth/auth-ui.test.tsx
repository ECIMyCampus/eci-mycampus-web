// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SessionProvider } from '../../lib/session/session';
import { getInitials } from '../../lib/auth/labels';

const replace = vi.fn();
let search = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => search,
  usePathname: () => '/',
}));

import { LoginForm } from './LoginForm';
import { ProfileView } from './ProfileView';
import { RegisterForm } from './RegisterForm';

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
    '/auth/register': () => json(201, { message: 'ok' }),
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

const type = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => {
  replace.mockClear();
  search = new URLSearchParams();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('LoginForm', () => {
  it('avisa los errores de cada campo sin llamar al backend', async () => {
    const fetchMock = stubBackend();
    withSession(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Escribe tu correo')).toBeTruthy();
    expect(screen.getByText('La contraseña es obligatoria')).toBeTruthy();
    expect(calls(fetchMock, '/auth/login')).toHaveLength(0);
    expect(document.activeElement).toBe(screen.getByLabelText('Correo'));
  });

  it('inicia sesión y vuelve a la página de donde venía', async () => {
    search = new URLSearchParams('volver=/eventos/abc');
    const fetchMock = stubBackend();
    withSession(<LoginForm />);

    type('Correo', 'ana@mail.escuelaing.edu.co');
    type('Contraseña', 'Secreto123');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/eventos/abc'));
    expect(JSON.parse(String(calls(fetchMock, '/auth/login')[0][1]?.body))).toEqual({
      email: 'ana@mail.escuelaing.edu.co',
      password: 'Secreto123',
    });
  });

  it('ignora un destino externo en la URL', async () => {
    search = new URLSearchParams('volver=https://sitio-malicioso.com');
    stubBackend();
    withSession(<LoginForm />);

    type('Correo', 'ana@mail.escuelaing.edu.co');
    type('Contraseña', 'Secreto123');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
  });

  it('muestra el mensaje del backend si las credenciales son incorrectas y deja reintentar', async () => {
    stubBackend({ '/auth/login': () => json(401, { mensaje: 'Credenciales inválidas o cuenta inactiva.' }) });
    withSession(<LoginForm />);

    type('Correo', 'ana@mail.escuelaing.edu.co');
    type('Contraseña', 'mala');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Credenciales inválidas o cuenta inactiva.');
    expect((screen.getByRole('button', { name: 'Entrar' }) as HTMLButtonElement).disabled).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it('explica con claridad cuando no hay conexión', async () => {
    stubBackend({ '/auth/login': () => Promise.reject(new TypeError('Failed to fetch')) });
    withSession(<LoginForm />);

    type('Correo', 'ana@mail.escuelaing.edu.co');
    type('Contraseña', 'Secreto123');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/No pudimos conectar con el servidor/);
  });

  it('quien ya tiene sesión es llevado a su destino', async () => {
    search = new URLSearchParams('volver=/mis-eventos');
    stubBackend({}, { loggedIn: true });
    withSession(<LoginForm />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/mis-eventos'));
  });

  it('el enlace a crear cuenta conserva el destino', () => {
    search = new URLSearchParams('volver=/eventos/abc');
    stubBackend();
    withSession(<LoginForm />);

    expect(screen.getByRole('link', { name: 'Crear cuenta' }).getAttribute('href')).toBe('/registro?volver=%2Feventos%2Fabc');
  });

  it('muestra y oculta la contraseña', () => {
    stubBackend();
    withSession(<LoginForm />);
    const input = screen.getByLabelText('Contraseña') as HTMLInputElement;

    expect(input.type).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(input.type).toBe('text');
  });
});

describe('RegisterForm', () => {
  const fill = () => {
    type('Nombre completo', 'Ana María Pérez');
    type('Correo institucional', 'ana@mail.escuelaing.edu.co');
    type('Contraseña', 'Secreto123');
    fireEvent.click(screen.getByLabelText(/Acepto la política/));
  };

  it('valida con las mismas reglas del backend antes de enviar', async () => {
    const fetchMock = stubBackend();
    withSession(<RegisterForm />);

    type('Nombre completo', 'Al');
    type('Correo institucional', 'ana@gmail.com');
    type('Contraseña', 'abc');
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText('El nombre completo debe tener al menos 3 caracteres')).toBeTruthy();
    expect(screen.getByText(/El registro exige un correo institucional válido/)).toBeTruthy();
    expect(screen.getByText('La contraseña debe contener al menos 8 caracteres')).toBeTruthy();
    expect(screen.getByText(/Habeas Data\)$/)).toBeTruthy();
    expect(calls(fetchMock, '/auth/register')).toHaveLength(0);
  });

  it('crea la cuenta, entra directamente y manda facultad y carrera solo si se eligieron', async () => {
    const fetchMock = stubBackend();
    withSession(<RegisterForm />);
    await screen.findByLabelText(/Facultad/);

    fill();
    fireEvent.change(screen.getByLabelText(/Facultad/), { target: { value: 'fac-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(JSON.parse(String(calls(fetchMock, '/auth/register')[0][1]?.body))).toEqual({
      email: 'ana@mail.escuelaing.edu.co',
      password: 'Secreto123',
      fullName: 'Ana María Pérez',
      facultyId: 'fac-1',
      habeasDataAccepted: true,
    });
    expect(calls(fetchMock, '/auth/login')).toHaveLength(1);
  });

  it('muestra "correo ya registrado" en el campo del correo', async () => {
    stubBackend({ '/auth/register': () => json(409, { mensaje: 'El correo electrónico ya se encuentra registrado.' }) });
    withSession(<RegisterForm />);

    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText('El correo electrónico ya se encuentra registrado.')).toBeTruthy();
    expect(screen.getByLabelText('Correo institucional').getAttribute('aria-invalid')).toBe('true');
    expect(replace).not.toHaveBeenCalled();
  });

  it('pasa los errores por campo del backend al campo correspondiente', async () => {
    stubBackend({
      '/auth/register': () =>
        json(400, {
          mensaje: 'La solicitud contiene datos inválidos.',
          detalles: [{ campo: 'body.fullName', mensaje: 'Nombre no permitido' }],
        }),
    });
    withSession(<RegisterForm />);

    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText('Nombre no permitido')).toBeTruthy();
    expect(screen.getByLabelText('Nombre completo').getAttribute('aria-invalid')).toBe('true');
  });

  it('funciona sin el campo de facultad si la lista no carga', async () => {
    stubBackend({ '/campus/faculties': () => json(500, { mensaje: 'fallo' }) });
    withSession(<RegisterForm />);

    await waitFor(() => expect(screen.queryByLabelText(/Facultad/)).toBeNull());
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeTruthy();
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
