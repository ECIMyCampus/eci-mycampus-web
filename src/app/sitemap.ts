import type { MetadataRoute } from 'next';
import { PUBLIC_PATHS, siteUrl } from '../lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return PUBLIC_PATHS.map((path) => ({
    url: path === '/' ? base : `${base}${path}`,
    changeFrequency: path === '/' ? 'hourly' : 'monthly',
    priority: path === '/' ? 1 : 0.6,
  }));
}
