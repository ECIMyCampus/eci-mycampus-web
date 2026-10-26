export type EventCategory =
  | 'ACADEMICO'
  | 'DEPORTIVO'
  | 'CULTURAL'
  | 'ESTUDIANTIL'
  | 'INSTITUCIONAL'
  | 'BIENESTAR';

export type EventStatus =
  | 'BORRADOR'
  | 'PENDIENTE_APROBACION'
  | 'PUBLICADO'
  | 'RECHAZADO'
  | 'CANCELADO'
  | 'ARCHIVADO'
  | 'REUBICACION_LOGISTICA_PENDIENTE';

export type TemporalStatus = 'EN_CURSO' | 'PROXIMO' | 'FINALIZADO';

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  facultyId?: string | null;
  organizerId: string;
  organizerName: string;
  buildingId: string;
  specificLocation: string;
  startTime: string;
  endTime: string;
  originalEndTime: string;
  status: EventStatus;
  temporalStatus?: TemporalStatus;
  isLive?: boolean;
  isPublic: boolean;
  requiresRegistration: boolean;
  maxCapacity?: number | null;
  availableCapacity?: number | null;
  price: string | number;
  imageUrl?: string | null;
  registrationsCount?: number;
  favoritesCount?: number;
}

export interface Building {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  svgElementId: string;
  imageUrl?: string | null;
  floorsCount: number;
  academicInfo?: string | null;
  isActive: boolean;
}

export interface Faculty {
  id: string;
  name: string;
  slug: string;
  hexColor: string;
}

export interface UserSession {
  id: string;
  email: string;
  role: 'INVITADO' | 'ESTUDIANTE' | 'DOCENTE' | 'ENTRENADOR' | 'MODERADOR' | 'ADMIN';
  fullName: string;
  facultyId?: string | null;
  isAuthorizedOrganizer?: boolean;
}
