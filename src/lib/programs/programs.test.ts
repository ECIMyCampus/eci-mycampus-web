import { describe, expect, it } from 'vitest';
import { PROGRAMS, contrastRatio, programUrl, textColorOn } from './programs';

describe('programas de pregrado', () => {
  it('son 13, sin nombres ni páginas repetidas, y cada uno con un color válido', () => {
    expect(PROGRAMS).toHaveLength(13);
    expect(new Set(PROGRAMS.map((p) => p.name)).size).toBe(13);
    expect(new Set(PROGRAMS.map((p) => p.slug)).size).toBe(13);
    for (const program of PROGRAMS) expect(program.color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('el nombre partido en dos líneas se lee igual que el nombre completo', () => {
    for (const { name, lines } of PROGRAMS) expect(lines.filter(Boolean).join(' ')).toBe(name);
  });

  it('arma el enlace a la página oficial del programa', () => {
    expect(programUrl(PROGRAMS[0])).toBe('https://www.escuelaing.edu.co/es/programas/ingenieria-de-sistemas/');
  });

  it('elige el texto claro u oscuro que mejor contraste da sobre cada color', () => {
    for (const { color } of PROGRAMS) {
      const best = contrastRatio(color, textColorOn(color));
      expect(best).toBeGreaterThanOrEqual(4);
      expect(best).toBeGreaterThanOrEqual(contrastRatio(color, '#f4f4f5'));
    }
    expect(textColorOn('#004b19')).toBe('#f4f4f5');
    expect(textColorOn('#bed600')).toBe('#0a0a0b');
  });
});
