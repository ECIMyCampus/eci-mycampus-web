import { UserRole } from '../../types';

export const ROLE_LABELS: Record<UserRole, string> = {
  INVITADO: 'Invitado',
  ESTUDIANTE: 'Estudiante',
  DOCENTE: 'Docente',
  ENTRENADOR: 'Entrenador',
  MODERADOR: 'Moderador',
  ADMIN: 'Administrador',
};

/** Iniciales para el avatar: primera letra del primer y del último nombre. "?" si no hay nombre. */
export function getInitials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = Array.from(words[0])[0];
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : '';
  return `${first}${last}`.toUpperCase();
}
