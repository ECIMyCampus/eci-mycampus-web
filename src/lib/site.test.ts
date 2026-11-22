import { afterEach, describe, expect, it, vi } from 'vitest';
import robots from '../app/robots';
import sitemap from '../app/sitemap';
import { PRIVATE_PATHS, PUBLIC_PATHS, siteUrl } from './site';

describe('siteUrl', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('usa la dirección configurada sin barra final, o la local si no hay', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://mycampus.escuelaing.edu.co///');
    expect(siteUrl()).toBe('https://mycampus.escuelaing.edu.co');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    expect(siteUrl()).toBe('http://localhost:3000');
  });
});

describe('robots y mapa del sitio', () => {
  it('deja pasar lo público y cierra lo privado y la API', () => {
    const { rules, sitemap: map } = robots();
    const rule = Array.isArray(rules) ? rules[0] : rules;
    expect(rule.allow).toBe('/');
    expect(rule.disallow).toEqual(expect.arrayContaining(['/perfil', '/mis-eventos', '/login', '/api/']));
    expect(map).toBe(`${siteUrl()}/sitemap.xml`);
  });

  it('lista solo páginas públicas con dirección absoluta', () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toHaveLength(PUBLIC_PATHS.length);
    expect(urls[0]).toBe(siteUrl());
    expect(urls).toContain(`${siteUrl()}/carreras`);
    for (const path of PRIVATE_PATHS) expect(urls.some((url) => url.endsWith(path))).toBe(false);
  });
});
