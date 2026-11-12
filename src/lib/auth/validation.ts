/**
 * Validación de los formularios de cuenta. Replica las reglas del backend con sus mismos mensajes,
 * para avisar antes de enviar. El backend sigue siendo quien decide: si discrepa, manda su mensaje.
 */

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INSTITUTIONAL_DOMAINS = ['@mail.escuelaing.edu.co', '@escuelaing.edu.co'];

export function validateEmail(value: string, options: { institutional: boolean }): string | null {
  const email = value.trim();
  if (!email) return 'Escribe tu correo';
  if (!EMAIL_FORMAT.test(email)) return 'Formato de correo electrónico no válido';
  if (options.institutional && !INSTITUTIONAL_DOMAINS.some((domain) => email.toLowerCase().endsWith(domain))) {
    return 'El registro exige un correo institucional válido (@mail.escuelaing.edu.co o @escuelaing.edu.co)';
  }
  return null;
}

/** Primera regla de contraseña que no se cumple, o null si todas se cumplen. */
export function validateNewPassword(value: string): string | null {
  if (value.length < 8) return 'La contraseña debe contener al menos 8 caracteres';
  if (!/[A-Z]/.test(value)) return 'La contraseña debe contener al menos una letra mayúscula';
  if (!/[0-9]/.test(value)) return 'La contraseña debe contener al menos un número';
  return null;
}

export function validateFullName(value: string): string | null {
  const name = value.trim();
  if (name.length < 3) return 'El nombre completo debe tener al menos 3 caracteres';
  if (name.length > 100) return 'El nombre completo no puede superar 100 caracteres';
  return null;
}

export type LoginField = 'email' | 'password';

export function validateLogin(values: { email: string; password: string }): FieldErrors<LoginField> {
  const errors: FieldErrors<LoginField> = {};
  const email = validateEmail(values.email, { institutional: false });
  if (email) errors.email = email;
  if (!values.password) errors.password = 'La contraseña es obligatoria';
  return errors;
}

export type RegisterField = 'fullName' | 'email' | 'password' | 'academicProgram' | 'habeasDataAccepted';

export interface RegisterValues {
  fullName: string;
  email: string;
  password: string;
  academicProgram: string;
  habeasDataAccepted: boolean;
}

export function validateRegister(values: RegisterValues): FieldErrors<RegisterField> {
  const errors: FieldErrors<RegisterField> = {};
  const fullName = validateFullName(values.fullName);
  if (fullName) errors.fullName = fullName;
  const email = validateEmail(values.email, { institutional: true });
  if (email) errors.email = email;
  const password = validateNewPassword(values.password);
  if (password) errors.password = password;
  if (values.academicProgram.trim().length > 100) errors.academicProgram = 'La carrera no puede superar 100 caracteres';
  if (!values.habeasDataAccepted) {
    errors.habeasDataAccepted = 'Debe aceptar la política de tratamiento de datos (Habeas Data)';
  }
  return errors;
}

/**
 * Pasa los errores por campo del backend (`body.email`, `body.password`...) a los campos del formulario.
 * Si un campo trae varios mensajes se queda con el primero. Ignora los campos que el formulario no tiene.
 */
export function fieldErrorsFromApi<K extends string>(
  details: { campo: string; mensaje: string }[],
  fields: readonly K[],
): FieldErrors<K> {
  const errors: FieldErrors<K> = {};
  for (const { campo, mensaje } of details) {
    const name = campo.split('.').pop() as K;
    if (fields.includes(name) && !errors[name]) errors[name] = mensaje;
  }
  return errors;
}
