import { describe, expect, it } from 'vitest';
import { resolveMapboxToken } from './token';

describe('elección del token de Mapbox', () => {
  it('prefiere el token de la variable de entorno', () => {
    expect(resolveMapboxToken('pk.entorno', 'pk.defecto')).toBe('pk.entorno');
  });

  it('usa el token por defecto si la variable está vacía', () => {
    expect(resolveMapboxToken('   ', 'pk.defecto')).toBe('pk.defecto');
    expect(resolveMapboxToken(undefined, 'pk.defecto')).toBe('pk.defecto');
  });

  it('ignora los tokens secretos', () => {
    expect(resolveMapboxToken('sk.secreto', 'pk.defecto')).toBe('pk.defecto');
    expect(resolveMapboxToken('sk.secreto', '')).toBeNull();
  });

  it('devuelve null si no hay ningún token válido', () => {
    expect(resolveMapboxToken(undefined, '')).toBeNull();
  });
});
