// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EventRegistration } from '../../types';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

let sessionStatus: 'loading' | 'authenticated' | 'anonymous' = 'authenticated';
vi.mock('../../lib/session/session', () => ({ useSession: () => ({ status: sessionStatus }) }));

const cancel = vi.fn();
const reload = vi.fn();
let registrations: { status: string; items: EventRegistration[] } = { status: 'ready', items: [] };
vi.mock('../../lib/registrations/registrations', () => ({
  useRegistrations: () => ({ ...registrations, cancel, reload }),
}));

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  api: { getBuildings: async () => [], getSportsFacilities: async () => [] },
}));

import { AgendaView } from './AgendaView';

const hours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();
const reg = (id: string, startH: number, status: EventRegistration['status'] = 'CONFIRMADA'): EventRegistration => ({
  id,
  eventId: `e-${id}`,
  userId: 'u',
  status,
  registeredAt: hours(-48),
  cancelledAt: null,
  eventTitle: `Actividad ${id}`,
  startTime: hours(startH),
  endTime: hours(startH + 1),
  specificLocation: 'Sala 1',
});

describe('AgendaView', () => {
  beforeEach(() => {
    sessionStatus = 'authenticated';
    registrations = { status: 'ready', items: [] };
    cancel.mockReset();
    reload.mockReset();
    replace.mockReset();
  });
  afterEach(cleanup);

  it('manda a iniciar sesión, con regreso a la agenda, si no hay sesión', () => {
    sessionStatus = 'anonymous';
    render(<AgendaView />);
    expect(replace).toHaveBeenCalledWith('/login?volver=%2Fmis-eventos');
  });

  it('explica el estado vacío y ofrece ir al radar', () => {
    render(<AgendaView />);
    expect(screen.getByText('Aún no tienes actividades')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ver el radar' }).getAttribute('href')).toBe('/');
  });

  it('permite reintentar si la agenda no carga', () => {
    registrations = { status: 'error', items: [] };
    render(<AgendaView />);
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(reload).toHaveBeenCalled();
  });

  it('separa lo que viene del historial y deja cancelar solo con más de 2 horas de margen', () => {
    registrations = {
      status: 'ready',
      items: [reg('lejos', 30), reg('cerca', 1), reg('vieja', -30), reg('anulada', 40, 'CANCELADA')],
    };
    render(<AgendaView />);

    expect(screen.getByRole('heading', { name: 'Actividad lejos' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Historial' })).toBeTruthy();
    expect(screen.getByText('Cancelada')).toBeTruthy();
    // Solo «lejos» se puede cancelar: «cerca» empieza en menos de 2 horas y el resto no está vigente.
    expect(screen.getAllByRole('button', { name: /Cancelar inscripción/ })).toHaveLength(1);
  });

  it('pide confirmación antes de cancelar y cancela el evento correcto', async () => {
    registrations = { status: 'ready', items: [reg('lejos', 30)] };
    cancel.mockResolvedValue({});
    render(<AgendaView />);

    fireEvent.click(screen.getByRole('button', { name: /Cancelar inscripción/ }));
    expect(cancel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar' }));

    await waitFor(() => expect(cancel).toHaveBeenCalledWith('e-lejos'));
  });
});
