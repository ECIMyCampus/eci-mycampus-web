# ADR 0001: Frontend v2 contra el backend del equipo

Estado: propuesto. Fecha: 2026-11-18.

## Contexto

El front actual se construyó contra otra versión del backend (sesión por cookie `eci_session`, rutas `/events/mine/...`). El backend del equipo usa un token de acceso de 15 minutos más un `refreshToken` que rota, y expone `/radar/`, `/registrations/*` y `/users/me`. Hay que adaptar el front, completar las pantallas que faltan y dejarlo presentable para el profesor.

## Decisiones

### 1. Sesión
- El token de acceso vive solo en memoria (módulo `lib/session/token-store.ts`), nunca en `localStorage`. Se envía como `Authorization: Bearer`.
- El `refreshToken` viaja en su cookie HttpOnly (`Path=/api/v1/auth`). El front no lo lee aunque el login también lo devuelva en el cuerpo: se ignora.
- Al abrir la app se llama `POST /auth/refresh`; si responde 200 hay sesión, si 401 es visitante.
- Ante un 401 en una llamada con sesión: un único refresh compartido por todas las llamadas en vuelo (promesa única), un reintento, y si falla se cierra la sesión y se avisa. El refresh rota: nunca dos en paralelo.
- Consecuencia: recargar la página cuesta un refresh. Es aceptable.

### 2. Capa de datos y caché
- Se mantiene `fetch` con un cliente propio (`lib/api`) y hooks pequeños (`useResource`) con estados `loading | error | empty | ready`, reintento y revalidación al volver a la pestaña. No se añade librería de caché: son pocas pantallas, listas paginadas y mutaciones simples; evitamos una dependencia y su peso.
- Revisable: si el bloque C o D exige caché compartida entre pantallas, se propone `@tanstack/react-query` en otro ADR.
- El cliente soporta GET, POST, PUT, PATCH y DELETE.

### 3. Errores y 429
- Todo error del backend (`{status, mensaje, detalles}`) se convierte en `ApiRequestError`. El 429 añade `retryAfterSeconds` leído de `Retry-After`, y las pantallas de acceso muestran el tiempo de espera y deshabilitan el botón hasta que pase.
- Sin conexión: `status 0` con mensaje propio y botón de reintento.
- Los avisos de éxito y error puntuales usan `sonner`. Dependencia nueva: pendiente de tu aprobación.

### 4. Contrato del backend
- Radar: `GET /radar/` con paginación del servidor (10 por página), filtros primarios visibles y avanzados plegados. Se abandona `/events/radar`.
- Inscripción: `POST|DELETE /registrations/events/{id}`; el POST de `/events/{id}/register` es otra ruta con el mismo efecto y no se usa. Agenda: `GET /registrations/itinerary`.
- La cancelación se bloquea en el cliente solo como ayuda visual (2 h antes); el backend decide y su 409 se muestra tal cual.
- Roles: el front oculta lo que no corresponde; nunca "protege".

### 5. Estructura
```
src/lib/api/        cliente, errores, endpoints por módulo
src/lib/session/    token-store, provider, refresh único
src/lib/hooks/      useResource, useDebouncedValue
src/features/       radar, evento, agenda, mapa, perfil, (organizador, moderación, admin)
src/components/ui/  sistema de diseño existente (tokens, 4 px)
design/mockups/     mockups HTML aislados, sin publicar
design/review/      capturas por fase (375, 768, 1440)
```

### 6. Pruebas
- Vitest + Testing Library por flujo.
- Prueba de contrato: los tipos del front se validan contra `/docs/json` del backend (campos y enums).
- Casos obligatorios: 401 con refresh, refresh vencido, 429, aforo lleno, cancelación fuera de plazo, sin red, INVITADO.
- Verificación manual contra el backend real (puerto 4000).

## Alternativas descartadas
- Token en `localStorage`: expuesto a XSS.
- Mantener la cookie de sesión propia: el backend del equipo no la ofrece.
- React Query desde ya: dependencia sin necesidad demostrada.

## Pendientes
- Aprobar `sonner`.
- Login con Microsoft queda fuera (otro trabajo); se deja el espacio en la pantalla de acceso.
