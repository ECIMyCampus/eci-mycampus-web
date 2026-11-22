/** Dirección pública de la aplicación, para enlaces absolutos (mapa del sitio, etiquetas para compartir). */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (configured || 'http://localhost:3000').replace(/\/+$/, '');
}

/** Páginas que sí deben salir en buscadores: lo público. El perfil, la agenda y el acceso quedan fuera. */
export const PUBLIC_PATHS = ['/', '/mapa', '/carreras', '/privacidad'] as const;

/** Rutas que no deben indexarse ni recorrerse: son de la persona o dependen de su sesión. */
export const PRIVATE_PATHS = ['/perfil', '/mis-eventos', '/login'] as const;
