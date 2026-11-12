import { Building, CampusEvent, SportsFacility } from '../../types';

/** Centro del campus de la Escuela (AK 45 #205-59, Bogotá) como [longitud, latitud]. */
export const CAMPUS_CENTER: [number, number] = [-74.0444, 4.783];

/**
 * Ubicación de cada punto del campus, por código, como [longitud, latitud].
 * Es el respaldo del mapa: si el backend entrega latitude/longitude, mandan esas.
 * Los bloques A-F, la biblioteca, el coliseo y la cancha se ubicaron a mano con el modo
 * calibración (/mapa?calibrar); el resto sale de los rótulos del mapa base (OpenStreetMap).
 * Debe coincidir con el catálogo de prisma/seed.ts del backend.
 */
export const POINT_COORDINATES: Record<string, [number, number]> = {
  'BLQ-A': [-74.04252, 4.78282],
  'BLQ-B': [-74.04262, 4.78306],
  'BLQ-C': [-74.04242, 4.78243],
  'BLQ-D': [-74.04345, 4.78329],
  'BLQ-E': [-74.04354, 4.78266],
  'BLQ-F': [-74.04334, 4.78364],
  'BLQ-G': [-74.04272, 4.78343],
  'BLQ-H': [-74.04498, 4.78173],
  'BLQ-I': [-74.04437, 4.78177],
  'BIB-LLR': [-74.04284, 4.783],
  'AUL-MAX': [-74.04253, 4.78208],
  'LAB-L2': [-74.04471, 4.78382],
  'LAB-L3': [-74.04555, 4.78377],
  CEA: [-74.04507, 4.78354],
  'CAF-DIA': [-74.04464, 4.7833],
  'COL-OTO': [-74.04632, 4.78317],
  'CAN-FUT': [-74.04564, 4.78308],
};

const wikiImage = (file: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=640`;

const building = (
  code: string,
  name: string,
  description: string | null = null,
  imageFile?: string,
): Building => ({
  id: code,
  code,
  name,
  description,
  svgElementId: `ECI-${code}`,
  imageUrl: imageFile ? wikiImage(imageFile) : null,
  floorsCount: 1,
  isActive: true,
});

/** Datos de ejemplo: se usan mientras el backend no esté disponible. */
export const DEMO_BUILDINGS: Building[] = [
  building('BLQ-A', 'Bloque A', 'Rectoría, Vicerrectoría, Admisiones y Registro Académico.', 'BloqueA ECI.jpg'),
  building('BLQ-B', 'Bloque B', 'Aulas de clases magistrales y dependencias de Ciencias Básicas.', 'Bloque B - ECI.jpg'),
  building('BLQ-C', 'Bloque C', 'Decanatura de Ingeniería de Sistemas, Electrónica y Salas de Cómputo.', 'Bloque C ECI 2.jpg'),
  building('BLQ-D', 'Bloque D', 'Decanatura de Ingeniería Civil, Laboratorios de Suelos e Hidráulica.', 'Bloque D - ECI.jpg'),
  building('BLQ-E', 'Bloque E', 'Ingeniería Industrial, Economía, Administración y Cafetería Central.', 'Bloque E ECI.jpg'),
  building('BLQ-F', 'Bloque F', 'Centro de Innovación y Desarrollo (I+D+i), Robótica y Posgrados.', 'Bloque F ECI 2.jpg'),
  building('BIB-LLR', 'Biblioteca Jorge Álvarez Lleras', 'Salas de estudio individual y grupal, hemeroteca y auditorio.', 'Bloque B - ECI.jpg'),
  building('BLQ-G', 'Bloque G', null, 'Bloque G - ECI.jpg'),
  building('BLQ-H', 'Bloque H', null, 'Bloque H 311018.jpg'),
  building('BLQ-I', 'Bloque I', null, 'Bloque I 311018.jpg'),
  building('AUL-MAX', 'Aula Máxima', 'Auditorio principal de la Escuela.', 'Hacienda El Otoño - ECI.jpg'),
  building('LAB-L2', 'Laboratorios L2', null, 'Bloque L2 - ECI.jpg'),
  building('LAB-L3', 'Laboratorios L3', null, 'L1 ECI.jpg'),
  building('CEA', 'Centro de Estudios Astronómicos', null, 'Escuela ing Julio Garavito Bog nov 2019.jpg'),
  building('CAF-DIA', 'Cafetería Dialimentos', null, 'Rincón de Tolkien - ECI.jpg'),
];

export const DEMO_SPORTS: SportsFacility[] = [
  { id: 'COL-OTO', code: 'COL-OTO', name: 'Coliseo El Otoño', sportTypes: ['Baloncesto', 'Voleibol'], svgElementId: 'ECI-COL-OTO', isActive: true },
  { id: 'CAN-FUT', code: 'CAN-FUT', name: 'Cancha de Fútbol 1', sportTypes: ['Fútbol'], svgElementId: 'ECI-CAN-FUT', isActive: true },
];

const HOUR = 3_600_000;

/** Eventos de demostración para el piloto inicial, relativos a la hora actual. */
export function createDemoEvents(now: number = Date.now()): CampusEvent[] {
  const iso = (offset: number) => new Date(now + offset).toISOString();
  return [
    {
      id: 'evt-1',
      title: 'Torneo Interfacultades de Futsal: Sistemas vs. Civil',
      description: 'Fase de cuartos de final del torneo universitario. Asiste y apoya a tu facultad en las canchas múltiples.',
      category: 'DEPORTIVO',
      buildingId: 'COL-OTO',
      specificLocation: 'Coliseo El Otoño - Cancha Principal',
      startTime: iso(0),
      endTime: iso(2 * HOUR),
      originalEndTime: iso(2 * HOUR),
      status: 'PUBLICADO',
      temporalStatus: 'EN_CURSO',
      isLive: true,
      isPublic: true,
      requiresRegistration: false,
      price: 0,
      organizerId: 'org-1',
      organizerName: 'Bienestar Universitario',
    },
    {
      id: 'evt-2',
      title: 'Taller de Drones Autónomos y Robótica con ROS2',
      description: 'Semillero de innovación. Aprende algoritmos de navegación para drones en ambientes cerrados. Cupos limitados a capacidad de laboratorio.',
      category: 'ACADEMICO',
      buildingId: 'BLQ-F',
      specificLocation: 'Bloque F - Laboratorio F-201',
      startTime: iso(3 * HOUR),
      endTime: iso(5 * HOUR),
      originalEndTime: iso(5 * HOUR),
      status: 'PUBLICADO',
      temporalStatus: 'PROXIMO',
      isLive: false,
      isPublic: true,
      requiresRegistration: true,
      maxCapacity: 20,
      availableCapacity: 6,
      price: 0,
      organizerId: 'org-2',
      organizerName: 'Semillero I+D+i',
    },
    {
      id: 'evt-3',
      title: 'Club de Debate: Inteligencia Artificial y Ética Profesional',
      description: 'Espacio de discusión abierta sobre el impacto de los modelos fundacionales en la práctica de la ingeniería colombiana.',
      category: 'CULTURAL',
      buildingId: 'BIB-LLR',
      specificLocation: 'Biblioteca Jorge Álvarez Lleras - Auditorio',
      startTime: iso(24 * HOUR),
      endTime: iso(26 * HOUR),
      originalEndTime: iso(26 * HOUR),
      status: 'PUBLICADO',
      temporalStatus: 'PROXIMO',
      isLive: false,
      isPublic: true,
      requiresRegistration: true,
      maxCapacity: 40,
      availableCapacity: 18,
      price: 0,
      organizerId: 'org-3',
      organizerName: 'Humanidades ECI',
    },
  ];
}
