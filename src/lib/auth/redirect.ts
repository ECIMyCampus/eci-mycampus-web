/**
 * Destino al que volver después de iniciar sesión. Solo se aceptan rutas internas del propio sitio:
 * un enlace con `?volver=https://sitio-malicioso.com` no debe sacar a la persona de la aplicación.
 */
export function safeRedirect(target: string | null | undefined, fallback = '/'): string {
  if (!target) return fallback;
  // Debe empezar con una sola "/" ("//host" y "/\host" las interpreta el navegador como otro sitio).
  if (!target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) return fallback;
  if (/[\u0000-\u001f]/.test(target)) return fallback;
  // No volver a las pantallas de entrada: sería un bucle.
  if (/^\/login(\/|\?|#|$)/.test(target)) return fallback;
  return target;
}

/** Enlace a una pantalla de entrada que recuerda a dónde volver. */
export function withReturnTo(path: '/login', returnTo: string | null | undefined): string {
  const target = safeRedirect(returnTo, '');
  return target ? `${path}?volver=${encodeURIComponent(target)}` : path;
}
