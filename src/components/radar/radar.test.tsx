// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createDemoEvents, DEMO_BUILDINGS, DEMO_SPORTS } from '../../lib/map/demo-data';
import { CampusEvent } from '../../types';

let searchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({ useSearchParams: () => searchParams }));

import { EventCard } from './EventCard';
import { RadarFeed } from './RadarFeed';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const stubBackend = (events: CampusEvent[]) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.includes('/events/radar')) return jsonResponse(200, events);
      if (url.includes('/campus/buildings')) return jsonResponse(200, DEMO_BUILDINGS);
      return jsonResponse(200, DEMO_SPORTS);
    }),
  );

describe('EventCard con datos extremos', () => {
  afterEach(cleanup);

  const [, base] = createDemoEvents();

  it('no rompe con título, ubicación y descripción muy largos', () => {
    const title = 'Congreso Internacional de Ingeniería de Sistemas, Electrónica y Telecomunicaciones '.repeat(3);
    render(<EventCard event={{ ...base, title, specificLocation: 'Laboratorio-de-Redes-y-Telecomunicaciones-Avanzadas-Piso-3-Ala-Norte-Sala-301-B' }} />);

    expect(screen.getByRole('heading', { name: title.trim() }).className).toContain('line-clamp-2');
    expect(screen.getByText(/Laboratorio-de-Redes/).closest('dd')?.className).toContain('overflow-wrap:anywhere');
  });

  it('escribe un solo cupo en singular y el aforo lleno sin botón de inscripción', () => {
    const onRegister = vi.fn();
    const { rerender } = render(<EventCard event={{ ...base, availableCapacity: 1 }} onRegister={onRegister} />);
    expect(screen.getByText('1 cupo libre')).toBeTruthy();

    rerender(<EventCard event={{ ...base, availableCapacity: 0 }} onRegister={onRegister} />);
    expect(screen.getByText('Aforo lleno')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Inscribirme' })).toBeNull();
  });

  it('inscribe al evento y muestra el nombre del lugar y la categoría legible', () => {
    const onRegister = vi.fn();
    render(<EventCard event={base} placeName="Bloque F" onRegister={onRegister} />);

    fireEvent.click(screen.getByRole('button', { name: 'Inscribirme' }));

    expect(onRegister).toHaveBeenCalledWith(base.id);
    expect(screen.getByText('Bloque F')).toBeTruthy();
    expect(screen.getByText('Académico')).toBeTruthy();
  });

  it('muestra "Gratis" con precio cero o inválido y "Acceso libre" sin aforo', () => {
    render(<EventCard event={{ ...base, price: 'abc', availableCapacity: null }} />);

    expect(screen.getByText('Gratis')).toBeTruthy();
    expect(screen.getByText('Acceso libre')).toBeTruthy();
  });
});

describe('RadarFeed', () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('muestra los eventos con el nombre del lugar y filtra por lo que está en vivo', async () => {
    stubBackend(createDemoEvents());
    render(<RadarFeed />);

    expect(await screen.findByRole('heading', { name: /Torneo Interfacultades/ })).toBeTruthy();
    expect(screen.getByText('3 actividades')).toBeTruthy();
    expect(screen.getAllByText('Coliseo El Otoño').length).toBeGreaterThan(0);

    const filters = screen.getByRole('group', { name: 'Filtrar actividades' });
    fireEvent.click(within(filters).getByRole('button', { name: 'En vivo' }));

    expect(screen.getByText('1 actividad')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /Taller de Drones/ })).toBeNull();
  });

  it('explica el estado vacío cuando el filtro no encuentra nada y permite volver a ver todo', async () => {
    stubBackend(createDemoEvents());
    render(<RadarFeed />);
    await screen.findByRole('heading', { name: /Torneo Interfacultades/ });

    fireEvent.click(screen.getByRole('button', { name: 'Bienestar' }));

    expect(screen.getByText('No hay actividades para mostrar')).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: 'Ver todas' }));
    await waitFor(() => expect(screen.getByText('3 actividades')).toBeTruthy());
  });

  it('filtra por lugar desde la URL y ofrece quitar el filtro', async () => {
    searchParams = new URLSearchParams('edificio=BLQ-F');
    stubBackend(createDemoEvents());
    render(<RadarFeed />);

    expect(await screen.findByRole('heading', { name: /Taller de Drones/ })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /Torneo Interfacultades/ })).toBeNull();
    expect(screen.getByRole('link', { name: /Quitar filtro de lugar/ }).textContent).toContain('Bloque F');
  });

  it('avisa que son datos de ejemplo si el backend no responde', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin conexión')));
    render(<RadarFeed />);

    expect(await screen.findByText('Datos de ejemplo')).toBeTruthy();
    expect(screen.getByText('3 actividades')).toBeTruthy();
  });
});
