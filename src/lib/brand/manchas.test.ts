import { describe, expect, it } from 'vitest';
import { MANCHAS_GREETINGS, manchasSize, manchasSrc, pickGreeting } from './manchas';

describe('saludos de Manchas', () => {
  it('todos la presentan por su nombre', () => {
    for (const greeting of MANCHAS_GREETINGS) expect(greeting).toContain('Manchas');
  });

  it('elige uno al azar y nunca se sale de la lista', () => {
    expect(pickGreeting(() => 0)).toBe(MANCHAS_GREETINGS[0]);
    expect(pickGreeting(() => 0.5)).toBe(MANCHAS_GREETINGS[1]);
    expect(pickGreeting(() => 0.999999)).toBe(MANCHAS_GREETINGS[2]);
  });

  it('una pose que solo existe en el estilo animado se sirve de ahí aunque se pida el realista', () => {
    expect(manchasSrc('sosteniendo-cuadro', 'realista')).toBe('/brand/manchas-animado/sosteniendo-cuadro.webp');
    expect(manchasSize('sosteniendo-cuadro', 'realista')).toEqual({ width: 475, height: 877 });
    expect(manchasSrc('calendario', 'realista')).toBe('/brand/manchas/calendario.webp');
  });
});
