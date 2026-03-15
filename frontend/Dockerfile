FROM oven/bun:1.3.9-debian AS build
WORKDIR /app

COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

FROM gcr.io/distroless/nodejs22-debian12:nonroot
WORKDIR /app

COPY --from=build --chown=65532:65532 /app/.next/standalone/ ./
COPY --from=build --chown=65532:65532 /app/.next/static/ ./.next/static/
COPY --from=build --chown=65532:65532 /app/public/ ./public/
COPY --from=build --chown=65532:65532 /app/messages/ ./messages/

USER 65532:65532
EXPOSE 3000
CMD ["server.js"]
