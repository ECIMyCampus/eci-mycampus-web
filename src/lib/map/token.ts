/**
 * Token por defecto de Mapbox. Va vacío a propósito: el token público (pk.) se configura con
 * NEXT_PUBLIC_MAPBOX_TOKEN y debe estar restringido por URL en la cuenta de Mapbox.
 * Nunca pegar aquí un token secreto (sk.): Mapbox no los permite en el navegador.
 */
export const DEFAULT_PUBLIC_TOKEN = '';

/**
 * Elige el token de Mapbox: primero la variable de entorno y luego el token por defecto.
 * Ignora los valores vacíos y los secretos (sk.). Devuelve null si no hay ninguno válido.
 */
export function resolveMapboxToken(
  envToken: string | undefined = process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  defaultToken: string = DEFAULT_PUBLIC_TOKEN,
): string | null {
  for (const candidate of [envToken, defaultToken]) {
    const token = candidate?.trim();
    if (token && token.startsWith('pk.')) return token;
  }
  return null;
}
