import { describe, expect, it } from 'vitest';
import { safeRedirect, withReturnTo } from './redirect';

describe('destino después de iniciar sesión', () => {
  it('acepta rutas internas, con su búsqueda y ancla', () => {
    expect(safeRedirect('/eventos/abc')).toBe('/eventos/abc');
    expect(safeRedirect('/?edificio=BLQ-F#radar')).toBe('/?edificio=BLQ-F#radar');
  });

  it.each([
    'https://sitio-malicioso.com',
    '//sitio-malicioso.com',
    '/\\sitio-malicioso.com',
    'javascript:alert(1)',
    'mapa',
    '/login',
    '/ruta\nconcontrol',
  ])('rechaza %j y usa el destino por defecto', (target) => {
    expect(safeRedirect(target)).toBe('/');
  });

  it('usa el destino por defecto si no hay nada', () => {
    expect(safeRedirect(null)).toBe('/');
    expect(safeRedirect(undefined, '/perfil')).toBe('/perfil');
  });

  it('arma el enlace a la pantalla de entrada recordando a dónde volver', () => {
    expect(withReturnTo('/login', '/eventos/abc')).toBe('/login?volver=%2Feventos%2Fabc');
    expect(withReturnTo('/login', 'https://malo.com')).toBe('/login');
    expect(withReturnTo('/login', null)).toBe('/login');
  });
});
