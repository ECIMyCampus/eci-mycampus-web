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
  | 'corriendo';

const FOLDERS: Record<ManchasStyle, string> = { realista: 'manchas', animado: 'manchas-animado' };

/** Medidas de los archivos, para que `next/image` reserve el espacio. Solo las poses que ya se usan. */
const SIZES: Partial<Record<ManchasPose, Record<ManchasStyle, { width: number; height: number }>>> = {
  'saludo-1': { realista: { width: 200, height: 404 }, animado: { width: 236, height: 388 } },
};

export function manchasSrc(pose: ManchasPose, style: ManchasStyle = MANCHAS_STYLE): string {
  return `/brand/${FOLDERS[style]}/${pose}.webp`;
}

export function manchasSize(pose: ManchasPose, style: ManchasStyle = MANCHAS_STYLE) {
  const size = SIZES[pose]?.[style];
  if (!size) throw new Error(`Falta la medida de la pose «${pose}» en el estilo «${style}»`);
  return size;
}

/** El estilo realista necesita un contorno blanco para despegarse del fondo oscuro; el animado ya lo trae. */
export const manchasOutlineClass = MANCHAS_STYLE === 'realista' ? 'sticker-outline' : '';
