# Acceso con Microsoft

Decisión de producto: no hay registro propio. Se entra con la cuenta de la Escuela (Microsoft) o como invitado.

## Qué hace el frontend

- La pantalla `/login` ofrece «Iniciar sesión con Microsoft» y «Entrar como invitado». No hay formulario de correo ni de registro.
- El botón de Microsoft navega a `NEXT_PUBLIC_MICROSOFT_LOGIN_URL` y agrega `?volver=<ruta interna>` para regresar a donde estaba la persona. Mientras la variable no exista, el botón avisa que el acceso llegará pronto.
- Un invitado que intenta inscribirse pasa por esta pantalla y regresa al mismo evento.

## Qué necesita del backend (José)

1. **Iniciar el flujo.** Un endpoint (por ejemplo `GET /api/v1/auth/microsoft`) que redirija a Microsoft y conserve `volver`.
2. **Restringir el dominio.** Solo se aceptan cuentas del tenant de la Escuela (`@mail.escuelaing.edu.co` y `@escuelaing.edu.co`). Esa regla vive en el backend; el frontend no la puede garantizar.
3. **Entregar la sesión.** Al terminar, dejar la cookie de refresco (HttpOnly) y redirigir a `volver` (o a `/`). El frontend recupera el token de acceso con `POST /auth/refresh` y el perfil con `GET /auth/me`, igual que hoy.
4. **Rechazos.** Si la cuenta no es de la Escuela, redirigir a `/login?error=dominio`. Cualquier otro fallo, a `/login?error=<motivo>`. La pantalla muestra un mensaje para `dominio` y uno general para el resto.

## Provisional

- `NEXT_PUBLIC_DEMO_EMAIL` y `NEXT_PUBLIC_DEMO_PASSWORD` activan un «acceso de pruebas» discreto con una cuenta de demostración. Solo para desarrollo; se quita al terminar el acceso con Microsoft.
