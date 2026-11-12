import { describe, expect, it } from 'vitest';
import { safeRedirect, withReturnTo } from './redirect';
import {
  fieldErrorsFromApi,
  validateEmail,
  validateFullName,
  validateLogin,
  validateNewPassword,
  validateRegister,
} from './validation';

describe('validación de cuenta (mismas reglas y mensajes que el backend)', () => {
  it('exige correo institucional solo al registrarse', () => {
    expect(validateEmail('ana@gmail.com', { institutional: true })).toMatch(/correo institucional/);
    expect(validateEmail('ana@gmail.com', { institutional: false })).toBeNull();
    expect(validateEmail('Ana@Mail.Escuelaing.edu.co', { institutional: true })).toBeNull();
    expect(validateEmail('ana@escuelaing.edu.co', { institutional: true })).toBeNull();
    expect(validateEmail('sin-arroba', { institutional: false })).toBe('Formato de correo electrónico no válido');
    expect(validateEmail('   ', { institutional: true })).toBe('Escribe tu correo');
  });

  it('señala una regla de contraseña a la vez, en el orden del backend', () => {
    expect(validateNewPassword('abc')).toMatch(/al menos 8 caracteres/);
    expect(validateNewPassword('abcdefgh1')).toMatch(/mayúscula/);
    expect(validateNewPassword('Abcdefgh')).toMatch(/número/);
    expect(validateNewPassword('Abcdefg1')).toBeNull();
  });

  it('valida el nombre completo sin contar los espacios de los extremos', () => {
    expect(validateFullName('  Al ')).toMatch(/al menos 3/);
    expect(validateFullName('Ana')).toBeNull();
    expect(validateFullName('x'.repeat(101))).toMatch(/100/);
  });

  it('el login solo pide un correo con formato válido y una contraseña', () => {
    expect(validateLogin({ email: 'ana@gmail.com', password: 'x' })).toEqual({});
    expect(validateLogin({ email: '', password: '' })).toEqual({
      email: 'Escribe tu correo',
      password: 'La contraseña es obligatoria',
    });
  });

  it('el registro exige aceptar Habeas Data', () => {
    const base = { fullName: 'Ana Pérez', email: 'ana@mail.escuelaing.edu.co', password: 'Secreto123', academicProgram: '' };

    expect(validateRegister({ ...base, habeasDataAccepted: true })).toEqual({});
    expect(validateRegister({ ...base, habeasDataAccepted: false }).habeasDataAccepted).toMatch(/Habeas Data/);
  });

  it('pasa los errores del backend a los campos del formulario y descarta los que no existen', () => {
    const errors = fieldErrorsFromApi(
      [
        { campo: 'body.email', mensaje: 'Correo no válido' },
        { campo: 'body.password', mensaje: 'Muy corta' },
        { campo: 'body.password', mensaje: 'Sin mayúscula' },
        { campo: 'body.interests', mensaje: 'No es un campo del formulario' },
      ],
      ['email', 'password'] as const,
    );

    expect(errors).toEqual({ email: 'Correo no válido', password: 'Muy corta' });
  });
});

describe('destino después de iniciar sesión', () => {
  it('acepta rutas internas, con su búsqueda y ancla', () => {
    expect(safeRedirect('/eventos/abc')).toBe('/eventos/abc');
    expect(safeRedirect('/?edificio=BLQ-F#radar')).toBe('/?edificio=BLQ-F#radar');
  });

  it.each([
    'https://sitio-malicioso.com',
    '//sitio-malicioso.com',
    '/\\sitio-malicioso.com',
    'javascript:alert(1)',
    'mapa',
    '/login',
    '/registro?volver=/',
    '/ruta\nconcontrol',
  ])('rechaza %j y usa el destino por defecto', (target) => {
    expect(safeRedirect(target)).toBe('/');
  });

  it('usa el destino por defecto si no hay nada', () => {
    expect(safeRedirect(null)).toBe('/');
    expect(safeRedirect(undefined, '/perfil')).toBe('/perfil');
  });

  it('arma el enlace a la pantalla de entrada recordando a dónde volver', () => {
    expect(withReturnTo('/login', '/eventos/abc')).toBe('/login?volver=%2Feventos%2Fabc');
    expect(withReturnTo('/login', 'https://malo.com')).toBe('/login');
    expect(withReturnTo('/registro', null)).toBe('/registro');
  });
});
