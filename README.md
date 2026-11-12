# ECI-MyCampus Web

Aplicación web adaptable para la comunidad de la **Escuela Colombiana de Ingeniería Julio Garavito**. Es un cliente del backend del repo `eci-mycampus-backend`.

**Estado actual:** piloto. El mapa interactivo consulta `/api/v1/campus/buildings`, `/api/v1/campus/sports` y `/api/v1/events/radar` en tiempo real y recurre a los datos de demostración si el backend no está disponible. Los enlaces a `/login`, `/mis-eventos` y `/perfil` todavía no tienen página.

## Tecnologías

- Next.js 15 (App Router) y React 19
- TypeScript 5
- Tailwind CSS
- Mapbox GL JS 3
- Lucide React
- Vitest y Testing Library

## Estructura

```text
src/
├── app/          # Rutas: / (radar y vista previa del mapa) y /mapa
├── components/   # layout, map y radar
├── lib/          # Cliente HTTP, servicio del mapa y utilidades
└── types/        # Contratos de datos
```

## Ejecución local

Requiere Node.js 22 o superior y el backend corriendo en `http://localhost:4000`.

```bash
cp .env.example .env.local
npm install
npm run dev
```

La aplicación queda en `http://localhost:3000`.

## Variables de entorno

| Variable | Por defecto | Descripción |
| :--- | :--- | :--- |
| `INTERNAL_API_URL` | `http://localhost:4000` | URL del backend |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | `DEFAULT_PUBLIC_TOKEN` | Token público de Mapbox (`pk.…`) para renderizar el mapa |
| `PORT` | `3000` | Puerto, solo en la imagen Docker |

### Configuración y restricción del token de Mapbox

1. En tu cuenta de Mapbox crea un **token público** (empieza por `pk.`) con los permisos públicos estándar (`styles:read`, `fonts:read`, `datasets:read`, `vision:read`). **Nunca uses ni subas un token secreto (`sk.`)**: el navegador lo expone y `resolveMapboxToken()` lo rechaza.
2. En **URL restrictions** del token en Mapbox, agrega únicamente los orígenes autorizados:
   - `http://localhost:3000` (desarrollo local)
   - El dominio de producción (por ejemplo, `https://mycampus.escuelaing.edu.co`)
3. Para desarrollo local, colócalo en `.env.local` como `NEXT_PUBLIC_MAPBOX_TOKEN=pk.…` (archivo ignorado por Git). Si el equipo comparte un token público restringido por URL, también puede definirse en `src/lib/map/token.ts` (`DEFAULT_PUBLIC_TOKEN`).

### Compilación en Docker y CI

Next.js resuelve el rewrite `/api/v1/*` e incrusta las variables `NEXT_PUBLIC_*` en el paquete de JavaScript del navegador **al compilar**. Cambiar `INTERNAL_API_URL` o `NEXT_PUBLIC_MAPBOX_TOKEN` exige recompilar, por lo que en Docker y CI deben pasarse como `--build-arg`:

```bash
docker build \
  --build-arg INTERNAL_API_URL=https://api.ejemplo.edu.co \
  --build-arg NEXT_PUBLIC_MAPBOX_TOKEN=pk.tu_token_publico \
  -t eci-mycampus-web .
```

La imagen usa la salida `standalone` de Next.js y arranca con `node server.js`. El despliegue en Azure está en `docs/deployment/AZURE.md` del repo `eci-mycampus-backend`.

## Cómo ajustar las coordenadas del campus

Las coordenadas viven en el backend (`Building.latitude`/`longitude` y `SportsFacility.latitude`/`longitude`, sembradas desde `prisma/seed.ts` en `eci-mycampus-backend`) y tienen como respaldo `POINT_COORDINATES` en `src/lib/map/demo-data.ts` (formato `[longitud, latitud]`).

Para calibrarlas visualmente en desarrollo:

1. Abre `http://localhost:3000/mapa?calibrar` con `npm run dev`.
2. El mapa entra en **Modo calibración** sobre la vista satelital y permite arrastrar cada pin hasta su bloque real.
3. Pulsa **Copiar coordenadas** para obtener el bloque `POINT_COORDINATES` listo para pegar en `src/lib/map/demo-data.ts` y actualizar los valores correspondientes en `prisma/seed.ts` del backend.

## Calidad

```bash
npx tsc --noEmit
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

ESLint no está configurado todavía: `npm run lint` abre un asistente interactivo.

## Flujo Git

| Rama | Uso |
| :--- | :--- |
| `main` | Versión estable |
| `develop` | Integración |
| `feature/*`, `refactor/*`, `fix/*`, `docs/*` | Un objetivo por rama, con PR hacia `develop` |

Los commits son atómicos y siguen Conventional Commits. El contrato de la API se consulta en `/docs` del backend.
