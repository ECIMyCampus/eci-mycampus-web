/**
 * Manchas, la mascota. Hay dos estilos de ilustración con las mismas poses y los mismos nombres de archivo:
 * `realista` (fotos del disfraz, con contorno blanco puesto por código) y `animado` (dibujo, que ya trae su borde).
 * Para probar el otro estilo basta con cambiar `MANCHAS_STYLE`.
 */
export type ManchasStyle = 'realista' | 'animado';

export const MANCHAS_STYLE = 'animado' as ManchasStyle;

export type ManchasPose =
  | 'saludo-1'
  | 'saludo-2'
  | 'saludo-brazos-arriba'
  | 'saludo-pecho'
  | 'asomado'
  | 'pulgar-arriba'
  | 'senalando-abajo'
  | 'sin-resultados'
  | 'error-manos-cabeza'
  | 'esperando-sentado'
  | 'celular'
  | 'calendario'
  | 'durmiendo'
  | 'corriendo'
  | 'sosteniendo-cuadro';

const FOLDERS: Record<ManchasStyle, string> = { realista: 'manchas', animado: 'manchas-animado' };

/** Medidas de los archivos, para que `next/image` reserve el espacio. Solo las poses que ya se usan. */
const SIZES: Partial<Record<ManchasPose, Partial<Record<ManchasStyle, { width: number; height: number }>>>> = {
  'saludo-1': { realista: { width: 200, height: 404 }, animado: { width: 236, height: 388 } },
  'sin-resultados': { realista: { width: 248, height: 384 }, animado: { width: 292, height: 396 } },
  'error-manos-cabeza': { realista: { width: 204, height: 384 }, animado: { width: 228, height: 392 } },
  'esperando-sentado': { realista: { width: 216, height: 316 }, animado: { width: 256, height: 348 } },
  calendario: { realista: { width: 228, height: 416 }, animado: { width: 272, height: 416 } },
  durmiendo: { realista: { width: 196, height: 420 }, animado: { width: 272, height: 420 } },
  // Solo existe en el estilo animado: si se pide en el realista, se usa esta.
  'sosteniendo-cuadro': { animado: { width: 475, height: 877 } },
};

/** El estilo que de verdad tiene la pose: algunas existen solo en el animado. */
const styleFor = (pose: ManchasPose, style: ManchasStyle): ManchasStyle =>
  SIZES[pose]?.[style] ? style : SIZES[pose]?.animado ? 'animado' : style;

export function manchasSrc(pose: ManchasPose, style: ManchasStyle = MANCHAS_STYLE): string {
  return `/brand/${FOLDERS[styleFor(pose, style)]}/${pose}.webp`;
}

export function manchasSize(pose: ManchasPose, style: ManchasStyle = MANCHAS_STYLE) {
  const size = SIZES[pose]?.[styleFor(pose, style)];
  if (!size) throw new Error(`Falta la medida de la pose «${pose}» en el estilo «${style}»`);
  return size;
}

/** Lo que dice Manchas al llegar a las pantallas de entrada. Siempre se presenta por su nombre; sale una al azar por carga. */
export const MANCHAS_GREETINGS = [
  '¡Hola! Soy Manchas. ¿Listo para ver qué está pasando?',
  '¡Hola! Soy Manchas, tu guía del campus.',
  '¿Primera vez? Soy Manchas, yo te guío.',
] as const;

export function pickGreeting(random: () => number = Math.random): string {
  return MANCHAS_GREETINGS[Math.floor(random() * MANCHAS_GREETINGS.length)];
}

/** El estilo realista necesita un contorno blanco para despegarse del fondo oscuro; el animado ya lo trae. */
export const manchasOutlineClass = MANCHAS_STYLE === 'realista' ? 'sticker-outline' : '';
