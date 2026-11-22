// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MapConsent } from './MapConsent';

describe('MapConsent', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

  it('no carga el mapa hasta que la persona lo acepta, y explica a quién le llegan datos', async () => {
    render(
      <MapConsent>
        <p>el mapa</p>
      </MapConsent>,
    );

    expect(await screen.findByRole('heading', { name: 'Antes de cargar el mapa' })).toBeTruthy();
    expect(screen.getByText(/Mapbox/)).toBeTruthy();
    expect(screen.queryByText('el mapa')).toBeNull();
    expect(screen.getByRole('link', { name: 'Cómo tratamos tus datos' }).getAttribute('href')).toBe('/privacidad#terceros');
  });

  it('al aceptar carga el mapa y recuerda la elección para la próxima vez', async () => {
    const { unmount } = render(
      <MapConsent>
        <p>el mapa</p>
      </MapConsent>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Cargar el mapa' }));
    expect(screen.getByText('el mapa')).toBeTruthy();
    expect(window.localStorage.getItem('eci-map-consent')).toBe('1');
    unmount();

    render(
      <MapConsent>
        <p>el mapa</p>
      </MapConsent>,
    );
    await waitFor(() => expect(screen.getByText('el mapa')).toBeTruthy());
  });
});
