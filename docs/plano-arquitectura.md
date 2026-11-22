# Plano de ECI MyCampus

Estado: borrador para decidir. Destino de despliegue: **Azure**, más adelante (todavía no hay fecha ni suscripción).
Los costos no llevan cifras porque dependen de decisiones sin tomar; cada fila dice qué se cobra y qué falta saber.

El backend ya trae su propia guía de despliegue (`eci-mycampus-backend/docs/deployment/AZURE.md`, sin ejecutar todavía contra Azure) con la misma arquitectura que se propone aquí: Container Apps, PostgreSQL Flexible Server, Container Registry y un job de migraciones. Este plano la complementa con el frontend, los datos que viajan y los costos.

## 1. Las piezas

| Pieza | Qué es | Dónde vive hoy | Estado |
| --- | --- | --- | --- |
| Frontend | Next.js 15, imagen `standalone` | `eci-mycampus-web-v2`, con `Dockerfile` | Funciona |
| Backend | Fastify 5 + Prisma 6, puerto 4000 | `eci-mycampus-backend`, con `Dockerfile` y `docker-compose.yml` | Funciona; no tiene el acceso con Microsoft |
| Base de datos | PostgreSQL | Local, puerto 5433 | Funciona |
| Acceso institucional | Microsoft Entra ID (solo cuentas de la Escuela) | — | **Pendiente**: lo expone el backend (ver `acceso-microsoft.md`) |
| Mapa | Mapbox GL, desde el navegador | Servicio externo | Funciona con token público |
| Correo | Resend, desde el backend (`RESEND_API_KEY`) | Servicio externo | **Apagado por defecto** (sin clave, el correo solo se escribe en el registro). Hoy envía un único correo: la confirmación de inscripción. No depende del acceso con Microsoft |
| Secretos | `JWT_SECRET`, `DATABASE_URL`, tokens | Archivos `.env` | Hay que moverlos a un almacén seguro |

## 2. Cómo se pasan los datos

```
Navegador
  ├─► Frontend (Next)  ──/api/v1/*──►  Backend (Fastify)  ──►  PostgreSQL
  │        │                               │
  │        └─ rewrite al backend           └─► Resend (correo)
  ├─► Microsoft Entra ID  ──► vuelve al backend ──► cookie de sesión ──► frontend
  └─► Mapbox (teselas, solo si la persona acepta cargar el mapa)
```

Lo que viaja y por qué importa para el despliegue:

- **Todo pasa por el mismo origen.** El frontend reenvía `/api/v1/*` al backend (`next.config.ts`). Gracias a eso la cookie de sesión es de primera parte, `HttpOnly`, y no hace falta CORS entre dominios. Hay que conservarlo en Azure: frontend y backend detrás de la misma dirección pública.
- **Sesión:** el token de acceso vive solo en memoria del navegador; se renueva con la cookie de refresco (`POST /auth/refresh`).
- **El radar** se vuelve a consultar cada 30 s mientras la pestaña está visible. Es la carga recurrente más grande del sistema.
- **Mapbox** recibe datos técnicos del navegador (la IP). Por eso el mapa pide aceptación antes de cargar.

## 3. Dónde va cada pieza en Azure (propuesta, por decidir)

| Pieza | Servicio de Azure propuesto | Por qué |
| --- | --- | --- |
| Frontend y backend | **Azure Container Apps** (o App Service para contenedores) | Ya hay imágenes Docker de los dos. Container Apps cobra por uso y puede bajar a cero; App Service da un costo fijo más predecible |
| Base de datos | **Azure Database for PostgreSQL, Flexible Server** | Es el mismo Postgres; el nivel más bajo alcanza para un piloto |
| Acceso con Microsoft | **Registro de aplicación en Microsoft Entra ID** | El registro en sí no tiene costo; restringe el acceso al tenant de la Escuela |
| Secretos | **Azure Key Vault** | Sacar `JWT_SECRET` y `DATABASE_URL` de los archivos |
| Imágenes de contenedor | **Azure Container Registry** | Guarda las imágenes que despliegan las dos piezas |
| Registros y errores | **Log Analytics / Application Insights** | Ver fallos en producción; se cobra por volumen |
| Dirección y certificado | Dominio de la Escuela + certificado administrado | HTTPS sin trámites |

## 4. Costo al mes (por cotizar)

Se llena con la calculadora de precios de Azure una vez decididas las preguntas de la sección 6. Marco qué se cobra en cada línea.

| Concepto | Qué se cobra | Estimado | Estado |
| --- | --- | --- | --- |
| Frontend (Container Apps) | CPU y memoria usadas y peticiones; hay una cuota mensual gratuita | por cotizar | Verificar la cuota vigente |
| Backend (Container Apps) | Lo mismo | por cotizar | Verificar |
| PostgreSQL Flexible Server | Horas del servidor, almacenamiento y copias de seguridad | por cotizar | Es lo más probable que domine el costo |
| Container Registry | Cuota mensual fija según el nivel | por cotizar | Verificar |
| Key Vault | Operaciones sobre secretos (muy bajo) | por cotizar | Verificar |
| Log Analytics / App Insights | Gigabytes de registros recibidos | por cotizar | Poner un tope de ingesta |
| Registro en Entra ID | Sin costo adicional por registrar la aplicación | 0 | Verificar con la suscripción de la Escuela |
| Mapbox | Cargas de mapa; hay un nivel gratuito mensual | por cotizar | Depende del tráfico; verificar el plan |
| Resend (si se queda) | Correos enviados | por cotizar | Decidir si hace falta |
| Dominio | Lo pone la Escuela | — | Pedir un subdominio |
| **Total mensual** | | **por cotizar** | |

## 5. Qué rompe qué (las dependencias)

- **El acceso con Microsoft depende de José.** Hasta que el backend exponga el inicio de sesión y redirija con `?error=dominio` cuando la cuenta no sea de la Escuela, el frontend solo tiene el «acceso de pruebas».
- **Variables que se fijan al compilar.** `NEXT_PUBLIC_*` (token de Mapbox, dirección del sitio, enlaces de política) e `INTERNAL_API_URL` se leen en `next build`. Cambiarlas exige reconstruir la imagen; conviene una imagen por entorno.
- **Dirección del backend entre contenedores.** `INTERNAL_API_URL` debe apuntar a la dirección interna del backend en Azure, no a `localhost`.
- **Cuenta demo.** `NEXT_PUBLIC_DEMO_EMAIL` y `NEXT_PUBLIC_DEMO_PASSWORD` deben estar vacías en producción; si no, el botón de pruebas queda con la contraseña a la vista.
- **Cookie de sesión.** Si algún día frontend y backend quedan en dominios distintos, hay que revisar `SameSite`, `Secure` y `CORS_ORIGIN`.
- **Migraciones de la base.** Hay que correr las migraciones de Prisma antes de arrancar la versión nueva del backend, y decidir quién siembra los datos del catálogo.

## 6. Preguntas abiertas

1. **¿Qué suscripción de Azure?** ¿La de la Escuela, créditos académicos u otra? Cambia el costo y quién tiene permisos.
2. **¿Cuántas personas lo usarán?** Define el tamaño de la base de datos y el volumen del radar.
3. **¿En qué región?** Importa por la ley de datos: un servidor fuera de Colombia implica transferencia internacional de datos personales (Ley 1581). Debe confirmarlo quien maneje datos en la Escuela.
4. **¿Qué dominio?** Un subdominio de `escuelaing.edu.co`.
5. **¿Se quiere el correo de confirmación de inscripción?** Es lo único que Resend envía. Si se activa hace falta un dominio remitente verificado (SPF y DKIM), contar el costo de Resend o usar un servicio dentro de Azure, y sumar a Resend en la página de privacidad. Si no se activa, la confirmación queda en la aplicación (aviso y agenda) y no hace falta nada de esto.
6. **¿Quién opera en producción?** Quién recibe las alertas y quién renueva los secretos.

## 7. Antes de desplegar

- [ ] Acceso con Microsoft funcionando de punta a punta, con el rechazo `?error=dominio`.
- [ ] Secretos en Key Vault; ninguno en el repositorio ni en la imagen.
- [ ] Variables de compilación del entorno definidas; cuenta demo vacía.
- [ ] `NEXT_PUBLIC_SITE_URL` con la dirección real (mapa del sitio y etiquetas para compartir).
- [ ] Si se activa el correo: dominio remitente verificado, fecha del correo en hora de Colombia (hoy sale como marca ISO en UTC) y Resend agregado a `/privacidad`.
- [ ] Política de datos de la Escuela enlazada en `NEXT_PUBLIC_DATA_POLICY_URL` y contacto en `NEXT_PUBLIC_DATA_CONTACT_EMAIL`.
- [ ] Copias de seguridad de PostgreSQL y una prueba de restauración.
- [ ] Prueba de carga del radar con el número esperado de personas.
- [ ] Límite de gasto o alerta de presupuesto en Azure.
