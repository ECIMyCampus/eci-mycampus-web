// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { SiteFooter } from '../../components/layout/SiteFooter';
import PrivacyPage from './page';

describe('página de privacidad', () => {
  afterEach(cleanup);

  it('cubre datos, cookies, terceros y derechos, con lo que la aplicación hace de verdad', () => {
    render(<PrivacyPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Privacidad y cookies' })).toBeTruthy();
    for (const title of ['Qué datos usamos y para qué', 'Cookies y almacenamiento', 'Servicios de terceros', 'Tus derechos']) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeTruthy();
    }
    expect(screen.getAllByText(/Mapbox/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Ley 1581 de 2012/)).toBeTruthy();
    expect(screen.getByText(/No usamos cookies de analítica/)).toBeTruthy();
  });

  it('remite a la política de la Escuela cuando no hay una dirección propia configurada', () => {
    render(<PrivacyPage />);
    const link = screen.getByRole('link', { name: 'escuelaing.edu.co' });
    expect(link.getAttribute('href')).toBe('https://www.escuelaing.edu.co');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('el pie lleva a la página', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('link', { name: 'Privacidad y cookies' }).getAttribute('href')).toBe('/privacidad');
  });
});
