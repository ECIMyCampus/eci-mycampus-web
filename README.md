# ECI-MyCampus Web

Aplicación web adaptable para la comunidad de la **Escuela Colombiana de Ingeniería Julio Garavito**. Es un cliente del backend del repo `eci-mycampus-backend`.

**Estado actual:** piloto. La portada muestra eventos de demostración y el mapa es interactivo, pero la interfaz aún no consume la API: `src/lib/api.ts` está listo y sin usar. Los enlaces a `/login`, `/mis-eventos` y `/perfil` todavía no tienen página.

## Tecnologías

- Next.js 15 (App Router) y React 19
- TypeScript 5
- Tailwind CSS
- Lucide React
- Vitest

## Estructura

```text
src/
├── app/          # Rutas: / (radar) y /mapa
├── components/   # layout, map y radar
├── lib/          # Cliente HTTP y utilidades
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
| `PORT` | `3000` | Puerto, solo en la imagen Docker |

Next.js reenvía `/api/v1/*` al backend mediante un rewrite que se resuelve **al compilar**. Cambiar `INTERNAL_API_URL` exige recompilar. Por eso la imagen la recibe como argumento:

```bash
docker build --build-arg INTERNAL_API_URL=https://api.ejemplo.edu.co -t eci-mycampus-web .
```

La imagen usa la salida `standalone` de Next.js y arranca con `node server.js`. El despliegue en Azure está en `docs/deployment/AZURE.md` del repo `eci-mycampus-backend`.

## Calidad

```bash
npx tsc --noEmit
npm test
npm run build
```

ESLint no está configurado todavía: `npm run lint` abre un asistente interactivo.

## Flujo Git

| Rama | Uso |
| :--- | :--- |
| `main` | Versión estable |
| `develop` | Integración |
| `feature/*`, `refactor/*`, `fix/*`, `docs/*` | Un objetivo por rama, con PR hacia `develop` |

Los commits son atómicos y siguen Conventional Commits. El contrato de la API se consulta en `/docs` del backend.
