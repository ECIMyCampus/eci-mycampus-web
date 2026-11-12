// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import * as tokenModule from '../../lib/map/token';
import * as mapService from '../../lib/map/map-service';
import { DEMO_BUILDINGS, DEMO_SPORTS, createDemoEvents } from '../../lib/map/demo-data';

type Listener = (event?: unknown) => void;

interface FakeMap {
  addControl: ReturnType<typeof vi.fn>;
  on: (event: string, cb: Listener) => void;
  once: (event: string, cb: Listener) => void;
  remove: ReturnType<typeof vi.fn>;
  getSource: ReturnType<typeof vi.fn>;
  addSource: ReturnType<typeof vi.fn>;
  getLayer: ReturnType<typeof vi.fn>;
  addLayer: ReturnType<typeof vi.fn>;
  getStyle: ReturnType<typeof vi.fn>;
  setPaintProperty: ReturnType<typeof vi.fn>;
  setLayoutProperty: ReturnType<typeof vi.fn>;
  setTerrain: ReturnType<typeof vi.fn>;
  setFog: ReturnType<typeof vi.fn>;
  easeTo: ReturnType<typeof vi.fn>;
  jumpTo: ReturnType<typeof vi.fn>;
  flyTo: ReturnType<typeof vi.fn>;
  fitBounds: ReturnType<typeof vi.fn>;
  getZoom: () => number;
  getBearing: () => number;
  getPitch: () => number;
  setBearing: (bearing: number) => void;
  getContainer: () => HTMLElement;
  emit: (event: string, payload?: unknown) => void;
}

let lastMap: FakeMap | null = null;
let rejectTokenOnLoad = false;

vi.mock('mapbox-gl', () => {
  class MockMap implements FakeMap {
    private container: HTMLElement;
    private listeners = new Map<string, Listener[]>();
    addControl = vi.fn();
    remove = vi.fn();
    getSource = vi.fn(() => null);
    addSource = vi.fn();
    getLayer = vi.fn((id: string) => (id === 'satellite' ? { id: 'satellite' } : null));
    addLayer = vi.fn();
    getStyle = vi.fn(() => ({ layers: [] }));
    setPaintProperty = vi.fn();
    setLayoutProperty = vi.fn();
    setTerrain = vi.fn();
    setFog = vi.fn();
    easeTo = vi.fn();
    jumpTo = vi.fn();
    flyTo = vi.fn();
    fitBounds = vi.fn();

    constructor(options: { container: HTMLElement }) {
      this.container = options.container;
      lastMap = this;
      queueMicrotask(() => {
        if (rejectTokenOnLoad) {
          this.emit('error', { error: { status: 401 } });
          return;
        }
        this.emit('style.load');
        this.emit('idle');
      });
    }

    on(event: string, cb: Listener) {
      const list = this.listeners.get(event) ?? [];
      list.push(cb);
      this.listeners.set(event, list);
    }

    once(event: string, cb: Listener) {
      this.on(event, cb);
    }

    emit(event: string, payload?: unknown) {
      for (const cb of this.listeners.get(event) ?? []) cb(payload);
    }

    getZoom() {
      return 16.3;
    }

    private bearing = -90;

    getBearing() {
      return this.bearing;
    }

    getPitch() {
      return 0;
    }

    setBearing(bearing: number) {
      this.bearing = bearing;
      this.emit('rotate');
    }

    getContainer() {
      return this.container;
    }
  }

  class MockMarker {
    private element: HTMLElement;
    private lngLat: [number, number] = [0, 0];

    constructor(options: { element: HTMLElement }) {
      this.element = options.element;
    }

    setLngLat(coords: [number, number]) {
      this.lngLat = coords;
      return this;
    }

    addTo(map: FakeMap) {
      map.getContainer().appendChild(this.element);
      return this;
    }

    remove() {
      this.element.remove();
    }

    on() {
      return this;
    }

    getLngLat() {
      return { lng: this.lngLat[0], lat: this.lngLat[1] };
    }
  }

  class NavigationControl {}
  class AttributionControl {}

  return {
    default: {
      Map: MockMap,
      Marker: MockMarker,
      NavigationControl,
      AttributionControl,
    },
  };
});

import { CampusMap } from './CampusMap';

const sampleData = (): mapService.CampusMapData => ({
  points: mapService.buildPoints(DEMO_BUILDINGS, DEMO_SPORTS, createDemoEvents()),
  source: 'demo',
});

describe('CampusMap', () => {
  beforeEach(() => {
    lastMap = null;
    rejectTokenOnLoad = false;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    vi.spyOn(mapService, 'loadCampusMapData').mockResolvedValue(sampleData());
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('muestra un aviso claro cuando no hay token de Mapbox', () => {
    vi.spyOn(tokenModule, 'resolveMapboxToken').mockReturnValue(null);

    render(<CampusMap showList />);

    const alert = screen.getByRole('alert');
    expect(within(alert).getByText(/Falta el token de Mapbox para mostrar el mapa/i)).toBeTruthy();
  });

  it('muestra un aviso claro cuando Mapbox rechaza el token', async () => {
    vi.spyOn(tokenModule, 'resolveMapboxToken').mockReturnValue('pk.invalido');
    rejectTokenOnLoad = true;

    render(<CampusMap />);

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText(/Mapbox rechazó el token del mapa/i)).toBeTruthy();
  });

  it('abre la tarjeta al hacer clic en un pin y la cierra con la X y con Esc', async () => {
    vi.spyOn(tokenModule, 'resolveMapboxToken').mockReturnValue('pk.prueba');

    render(<CampusMap showList />);

    const mapCanvas = screen.getByLabelText('Mapa interactivo del campus de la Escuela');
    const pin = await within(mapCanvas).findByRole('button', { name: 'Bloque F' });

    fireEvent.click(pin);

    const dialog = await screen.findByRole('dialog', { name: 'Detalle de Bloque F' });
    expect(within(dialog).getByText(/Taller de Drones Autónomos/i)).toBeTruthy();
    expect(within(dialog).getByAltText('Fotografía de Bloque F')).toBeTruthy();
    expect(
      within(dialog)
        .getByRole('link', { name: /Ver actividades en este lugar/i })
        .getAttribute('href'),
    ).toBe('/?edificio=BLQ-F#radar');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cerrar ficha' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    // Vuelve a abrir y cierra con la tecla Escape.
    fireEvent.click(pin);
    expect(await screen.findByRole('dialog', { name: 'Detalle de Bloque F' })).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('filtra los puntos por tipo y por actividad en vivo y cierra la tarjeta si el punto queda oculto', async () => {
    vi.spyOn(tokenModule, 'resolveMapboxToken').mockReturnValue('pk.prueba');

    render(<CampusMap showList />);

    const list = screen.getByRole('list', { name: 'Lugares del campus' });
    const blockAButton = await within(list).findByRole('button', { name: /Bloque A/i });
    fireEvent.click(blockAButton);
    expect(await screen.findByRole('dialog', { name: 'Detalle de Bloque A' })).toBeTruthy();

    const filterGroup = screen.getByRole('group', { name: 'Filtrar puntos del mapa' });
    fireEvent.click(within(filterGroup).getByRole('button', { name: 'Deportes' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(within(list).queryByRole('button', { name: /Bloque A/i })).toBeNull();
    expect(within(list).getByRole('button', { name: /Coliseo El Otoño/i })).toBeTruthy();
    expect(within(list).getByRole('button', { name: /Cancha de Fútbol 1/i })).toBeTruthy();

    fireEvent.click(within(filterGroup).getByRole('button', { name: 'En vivo' }));
    expect(within(list).getByRole('button', { name: /Coliseo El Otoño/i })).toBeTruthy();
    expect(within(list).queryByRole('button', { name: /Cancha de Fútbol 1/i })).toBeNull();
  });

  it('selecciona un lugar desde la lista y centra el mapa en él', async () => {
    vi.spyOn(tokenModule, 'resolveMapboxToken').mockReturnValue('pk.prueba');

    render(<CampusMap showList />);

    const list = screen.getByRole('list', { name: 'Lugares del campus' });
    const coliseoItem = await within(list).findByRole('button', { name: /Coliseo El Otoño/i });

    fireEvent.click(coliseoItem);

    expect(await screen.findByRole('dialog', { name: 'Detalle de Coliseo El Otoño' })).toBeTruthy();
    expect(lastMap?.flyTo).toHaveBeenCalled();

    const mapCanvas = screen.getByLabelText('Mapa interactivo del campus de la Escuela');
    const coliseoPin = within(mapCanvas).getByRole('button', { name: /Coliseo El Otoño/i });
    expect(coliseoPin.classList.contains('is-selected')).toBe(true);
  });

  it('limita el giro del mapa y lo endereza a la orientación base', async () => {
    vi.spyOn(tokenModule, 'resolveMapboxToken').mockReturnValue('pk.prueba');

    render(<CampusMap showList />);
    const list = screen.getByRole('list', { name: 'Lugares del campus' });
    await within(list).findByRole('button', { name: /Coliseo El Otoño/i });
    expect(screen.queryByRole('button', { name: /Enderezar/i })).toBeNull();

    // Girar más allá del tope se recorta a 45 grados a cada lado de la base (-90).
    act(() => lastMap?.setBearing(0));
    expect(lastMap?.getBearing()).toBe(-45);
    act(() => lastMap?.setBearing(170));
    expect(lastMap?.getBearing()).toBe(-135);

    fireEvent.click(await screen.findByRole('button', { name: /Enderezar/i }));
    expect(lastMap?.easeTo).toHaveBeenCalledWith(expect.objectContaining({ bearing: -90 }));

    act(() => lastMap?.setBearing(-90));
    await waitFor(() => expect(screen.queryByRole('button', { name: /Enderezar/i })).toBeNull());
  });
});
