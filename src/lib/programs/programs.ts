/**
 * Programas de pregrado y su color oficial. Los colores salen de la carpeta `docs/Colors` del backend (uno por carrera,
 * tomados de la página de la Escuela). El orden es el de la página: el último, Matemáticas, es el que sostiene Manchas.
 */
export interface Program {
  /** Nombre completo, tal como lo escribe la Escuela. */
  name: string;
  /** El nombre partido en dos líneas para el cuadro: lo que antecede («Ingeniería de») y lo principal. */
  lines: [string | null, string];
  /** Color oficial del programa. */
  color: string;
  /** Tramo de la página oficial del programa. */
  slug: string;
}

export const PROGRAMS_BASE_URL = 'https://www.escuelaing.edu.co/es/programas';

export const PROGRAMS: Program[] = [
  { name: 'Ingeniería de Sistemas', lines: ['Ingeniería de', 'Sistemas'], color: '#004b19', slug: 'ingenieria-de-sistemas' },
  { name: 'Ingeniería de Inteligencia Artificial', lines: ['Ingeniería de', 'Inteligencia Artificial'], color: '#6459c4', slug: 'ingenieria-de-inteligencia-artificial' },
  { name: 'Ingeniería de Ciberseguridad', lines: ['Ingeniería de', 'Ciberseguridad'], color: '#bed600', slug: 'ingenieria-de-ciberseguridad' },
  { name: 'Ingeniería Electrónica', lines: ['Ingeniería', 'Electrónica'], color: '#003399', slug: 'ingenieria-de-electronica' },
  { name: 'Ingeniería Eléctrica', lines: ['Ingeniería', 'Eléctrica'], color: '#210042', slug: 'ingenieria-electrica' },
  { name: 'Ingeniería Civil', lines: ['Ingeniería', 'Civil'], color: '#5e0500', slug: 'ingenieria-civil' },
  { name: 'Ingeniería Ambiental', lines: ['Ingeniería', 'Ambiental'], color: '#7bba25', slug: 'ingenieria-ambiental' },
  { name: 'Ingeniería Industrial', lines: ['Ingeniería', 'Industrial'], color: '#cc6633', slug: 'ingenieria-industrial' },
  { name: 'Ingeniería Estadística', lines: ['Ingeniería', 'Estadística'], color: '#00d900', slug: 'ingenieria-estadistica' },
  { name: 'Ingeniería en Biotecnología', lines: ['Ingeniería en', 'Biotecnología'], color: '#65cfe9', slug: 'ingenieria-en-biotecnologia' },
  { name: 'Economía', lines: [null, 'Economía'], color: '#007aa0', slug: 'economia' },
  { name: 'Administración de Empresas', lines: [null, 'Administración de Empresas'], color: '#90006f', slug: 'administracion-de-empresas' },
  { name: 'Matemáticas', lines: [null, 'Matemáticas'], color: '#003366', slug: 'matematicas' },
];

export const programUrl = (program: Program): string => `${PROGRAMS_BASE_URL}/${program.slug}/`;

