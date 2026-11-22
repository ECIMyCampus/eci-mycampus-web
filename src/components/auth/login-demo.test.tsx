// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_DEMO_EMAIL = 'demo@mail.escuelaing.edu.co';
  process.env.NEXT_PUBLIC_DEMO_PASSWORD = 'clave-de-prueba';
});

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams('volver=/mis-eventos'),
}));

const login = vi.fn();
vi.mock('../../lib/session/session', () => ({ useSession: () => ({ status: 'anonymous', login }) }));

import { LoginForm } from './LoginForm';

describe('LoginForm con cuenta demo', () => {
  afterEach(() => {
    cleanup();
    replace.mockReset();
    login.mockReset();
  });

  it('entra con la cuenta demo de un toque y vuelve a donde venía', async () => {
    login.mockResolvedValue({});
    render(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: /cuenta demo/ }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/mis-eventos'));
    expect(login).toHaveBeenCalledWith('demo@mail.escuelaing.edu.co', 'clave-de-prueba');
  });

  it('avisa si la cuenta demo no existe y deja reintentar', async () => {
    login.mockRejectedValue(new Error('x'));
    render(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: /cuenta demo/ }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/No pudimos entrar con la cuenta demo/);
    expect(replace).not.toHaveBeenCalled();
  });
});
