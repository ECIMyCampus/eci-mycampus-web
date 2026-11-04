FROM node:22-alpine AS builder
WORKDIR /app
# Next.js resuelve los rewrites al compilar: la URL del backend se fija en esta etapa.
ARG INTERNAL_API_URL=http://localhost:4000
ENV INTERNAL_API_URL=$INTERNAL_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Sin esto, el servidor standalone solo escucha en la interfaz del contenedor y fallan las sondas.
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER node
EXPOSE 3000
CMD ["node", "server.js"]
