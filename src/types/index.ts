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
  /** Nombre legible del edificio (el radar lo incluye). */
  buildingName?: string | null;
  specificLocation: string;
  startTime: string;
  endTime: string;
  originalEndTime: string;
  status: EventStatus;
  accessType?: 'LIBRE' | 'REGISTRO_PREVIO' | 'EXCLUSIVO_FACULTAD';
  rejectionReason?: string | null;
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
  tags?: string[];
  modality?: 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDA' | string;
  isFeatured?: boolean;
  paymentInstructions?: string | null;
  cancellationReason?: string | null;
}

/** Respuesta paginada de `GET /radar/`. */
export interface RadarPage {
  data: CampusEvent[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  activeEventsCount: number;
  upcomingEventsCount: number;
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
  /** Ubicación en el mapa (WGS84). null o ausente si el backend aún no la tiene. */
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean;
  services?: CampusServiceInfo[];
}

export interface CampusServiceInfo {
  id: string;
  name: string;
  serviceType: string;
  operatingHours?: string | null;
  phone?: string | null;
}

export interface SportsFacility {
  id: string;
  code: string;
  name: string;
  sportTypes: string[];
  svgElementId: string;
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean;
}

export interface Faculty {
  id: string;
  name: string;
  slug: string;
  hexColor: string;
}

export type UserRole = 'INVITADO' | 'ESTUDIANTE' | 'DOCENTE' | 'ENTRENADOR' | 'MODERADOR' | 'ADMIN';

/** Persona con sesión iniciada: lo que devuelve `GET /auth/me`. */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  facultyId: string | null;
  isAuthorizedOrganizer: boolean;
  isEmailVerified?: boolean;
  createdAt: string;
  /** Los trae `GET /users/me`, no `/auth/me`. */
  academicProgram?: string | null;
  interests?: string[];
  avatarUrl?: string | null;
}

/** Una reserva de cupo. En la agenda (`/registrations/itinerary`) trae los datos del evento. */
export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: 'CONFIRMADA' | 'CANCELADA' | 'ASISTIO';
  registeredAt: string;
  cancelledAt: string | null;
  eventTitle?: string;
  startTime?: string;
  endTime?: string;
  buildingId?: string;
  specificLocation?: string;
}

/** Contrato estándar de error de los microservicios (ErrorResponseDTO). */
export interface ApiError {
  status: number;
  error: string;
  mensaje: string;
  path: string;
  timestamp: string;
  detalles?: { campo: string; mensaje: string }[];
}
