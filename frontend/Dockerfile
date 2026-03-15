FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .

ARG BACKEND_URL=http://backend:3000
ENV BACKEND_URL=${BACKEND_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app

COPY --from=build /app/.next/standalone/ ./
COPY --from=build /app/.next/static/ ./.next/static/
COPY --from=build /app/public/ ./public/
COPY --from=build /app/messages/ ./messages/

EXPOSE 3000
CMD ["bun", "server.js"]
