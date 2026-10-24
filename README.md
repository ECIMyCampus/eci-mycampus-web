# ECI-MyCampus — Frontend Web & Gateway BFF

Aplicación web adaptable (móviles y escritorio) para la comunidad universitaria de la **Escuela Colombiana de Ingeniería Julio Garavito**.

## Tecnologías
* **Framework:** Next.js 15 (App Router, React 19)
* **Lenguaje:** TypeScript 5
* **Estilos:** Tailwind CSS
* **Iconografía:** Lucide React
* **Validación:** Zod

## Estructura
```text
src/
├── app/               # Rutas de la aplicación (Radar, Mapa, Eventos, Lugares, Admin)
├── components/        # Componentes UI reutilizables
├── features/          # Módulos de dominio (radar, campus-map, events, auth)
├── lib/               # Clientes HTTP y utilidades
└── types/             # Contratos de datos TypeScript
```

## Ejecución Local
```bash
npm install
npm run dev
```
La aplicación iniciará en `http://localhost:3000`.

## Variables de Entorno (`.env.local`)
Ver `.env.example` para la configuración de URLs de microservicios:
* `NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:4001`
* `NEXT_PUBLIC_CAMPUS_SERVICE_URL=http://localhost:4002`
* `NEXT_PUBLIC_EVENTS_SERVICE_URL=http://localhost:4003`
