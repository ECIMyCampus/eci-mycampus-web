import { describe, expect, it } from 'vitest';
import { MANCHAS_GREETINGS, pickGreeting } from './manchas';

describe('saludos de Manchas', () => {
  it('todos la presentan por su nombre', () => {
    for (const greeting of MANCHAS_GREETINGS) expect(greeting).toContain('Manchas');
  });

  it('elige uno al azar y nunca se sale de la lista', () => {
    expect(pickGreeting(() => 0)).toBe(MANCHAS_GREETINGS[0]);
    expect(pickGreeting(() => 0.5)).toBe(MANCHAS_GREETINGS[1]);
    expect(pickGreeting(() => 0.999999)).toBe(MANCHAS_GREETINGS[2]);
  });
});
