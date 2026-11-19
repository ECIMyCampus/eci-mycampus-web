// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SessionProvider } from '../session/session';
import { RegistrationsProvider, useRegistrations } from './registrations';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const ME = { id: 'u1', email: 'ana@mail.escuelaing.edu.co', role: 'ESTUDIANTE', fullName: 'Ana', facultyId: null, isAuthorizedOrganizer: false, createdAt: '2026-11-01T00:00:00.000Z' };

const reservation = (eventId: string, status = 'CONFIRMADA') => ({
  id: `r-${eventId}`,
  eventId,
  userId: 'u1',
  status,
  registeredAt: '2026-11-18T00:00:00.000Z',
  cancelledAt: null,
  eventTitle: `Evento ${eventId}`,
});

function stubBackend({ loggedIn = true, itinerary = [reservation('e1')] as unknown[] } = {}) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url).replace('/api/v1', '');
    if (path === '/auth/refresh') return loggedIn ? jsonResponse(200, { token: 'tk' }) : jsonResponse(401, { mensaje: 'Sin sesión' });
    if (path === '/auth/me') return jsonResponse(200, ME);
    if (path === '/registrations/itinerary') return jsonResponse(200, itinerary);
    if (path === '/registrations/events/e2' && init?.method === 'POST') return jsonResponse(201, { id: 'r-e2', eventId: 'e2', userId: 'u1', status: 'CONFIRMADA', registeredAt: 'x', cancelledAt: null });
    if (path === '/registrations/events/e1' && init?.method === 'DELETE') return jsonResponse(200, { id: 'r-e1', eventId: 'e1', userId: 'u1', status: 'CANCELADA', registeredAt: 'x', cancelledAt: 'y' });
    if (path === '/registrations/events/e3' && init?.method === 'POST') return jsonResponse(409, { mensaje: 'Ya estás inscrito' });
    throw new Error(`Llamada inesperada: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function Probe() {
  const { status, isRegistered, register, cancel, items } = useRegistrations();
  const [error, setError] = React.useState('');
  return (
    <div>
      <p data-testid="estado">{status}</p>
      <p data-testid="e1">{String(isRegistered('e1'))}</p>
      <p data-testid="e2">{String(isRegistered('e2'))}</p>
      <p data-testid="titulo-e1">{items.find((i) => i.eventId === 'e1')?.eventTitle ?? '-'}</p>
      <p data-testid="error">{error}</p>
      <button onClick={() => register('e2')}>inscribir e2</button>
      <button onClick={() => register('e3').catch((e) => setError(e.message))}>inscribir e3</button>
      <button onClick={() => cancel('e1')}>cancelar e1</button>
    </div>
  );
}

const renderProbe = () =>
  render(
    <SessionProvider>
      <RegistrationsProvider>
        <Probe />
      </RegistrationsProvider>
    </SessionProvider>,
  );

describe('RegistrationsProvider', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('carga la agenda al tener sesión y distingue lo que está reservado', async () => {
    stubBackend();
    renderProbe();

    await waitFor(() => expect(screen.getByTestId('estado').textContent).toBe('ready'));
    expect(screen.getByTestId('e1').textContent).toBe('true');
    expect(screen.getByTestId('e2').textContent).toBe('false');
  });

  it('un visitante no pide la agenda', async () => {
    const fetchMock = stubBackend({ loggedIn: false });
    renderProbe();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await act(async () => undefined);

    expect(screen.getByTestId('estado').textContent).toBe('idle');
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/itinerary'))).toBe(false);
  });

  it('reservar y cancelar actualizan el estado sin volver a pedir la agenda', async () => {
    const fetchMock = stubBackend();
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('estado').textContent).toBe('ready'));

    fireEvent.click(screen.getByText('inscribir e2'));
    await waitFor(() => expect(screen.getByTestId('e2').textContent).toBe('true'));

    fireEvent.click(screen.getByText('cancelar e1'));
    await waitFor(() => expect(screen.getByTestId('e1').textContent).toBe('false'));
    // La cancelación conserva los datos del evento que ya se conocían.
    expect(screen.getByTestId('titulo-e1').textContent).toBe('Evento e1');
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/itinerary'))).toHaveLength(1);
  });

  it('si el backend rechaza la reserva, lanza el motivo y no cambia el estado', async () => {
    stubBackend();
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('estado').textContent).toBe('ready'));

    fireEvent.click(screen.getByText('inscribir e3'));

    await waitFor(() => expect(screen.getByTestId('error').textContent).toBe('Ya estás inscrito'));
  });

  it('avisa con un error claro fuera del proveedor', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow('useRegistrations debe usarse dentro de <RegistrationsProvider>');
    spy.mockRestore();
  });
});
