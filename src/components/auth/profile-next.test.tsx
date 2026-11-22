// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { EventRegistration } from '../../types';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('../../lib/session/session', () => ({
  useSession: () => ({
    status: 'authenticated',
    user: { id: 'u', email: 'ana@mail.escuelaing.edu.co', role: 'ESTUDIANTE', fullName: 'Ana Pérez', facultyId: null, isAuthorizedOrganizer: false, createdAt: '2026-01-10T00:00:00Z' },
    logout: vi.fn(),
  }),
}));
vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  api: { getFaculties: async () => [] },
}));

let items: EventRegistration[] = [];
vi.mock('../../lib/registrations/registrations', () => ({
  useOptionalRegistrations: () => ({ status: 'ready', items }),
}));

import { ProfileView } from './ProfileView';

const inHours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

describe('ProfileView: próxima actividad', () => {
  afterEach(cleanup);

  it('enlaza a la actividad vigente más cercana', () => {
    items = [
      { id: '2', eventId: 'e2', userId: 'u', status: 'CONFIRMADA', registeredAt: inHours(-5), cancelledAt: null, eventTitle: 'Más tarde', startTime: inHours(48), endTime: inHours(49) },
      { id: '1', eventId: 'e1', userId: 'u', status: 'CONFIRMADA', registeredAt: inHours(-5), cancelledAt: null, eventTitle: 'Primero', startTime: inHours(5), endTime: inHours(6) },
    ];
    render(<ProfileView />);
    expect(screen.getByRole('link', { name: 'Primero' }).getAttribute('href')).toBe('/eventos/e1');
  });

  it('invita a mirar el radar si no hay nada próximo', () => {
    items = [];
    render(<ProfileView />);
    expect(screen.getByText(/No tienes actividades próximas/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Mira el radar' }).getAttribute('href')).toBe('/');
  });
});
