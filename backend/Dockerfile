FROM oven/bun:1.3.9-debian AS build
WORKDIR /app

COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

COPY tsconfig.json ./
COPY src/ src/

RUN bun build src/index.ts \
    --outfile server \
    --target bun \
    --compile \
    --bytecode \
    --minify-syntax \
    --minify-whitespace \
    --tree-shaking

# Create an empty dir owned by nonroot to copy into distroless
RUN mkdir -p /tmp/empty-data && chown 65532:65532 /tmp/empty-data

FROM gcr.io/distroless/cc-debian12:nonroot
WORKDIR /app

COPY --from=build --chown=65532:65532 /app/server .
COPY --from=build --chown=65532:65532 /tmp/empty-data /app/data

USER 65532:65532
EXPOSE 3000
ENTRYPOINT ["/app/server"]
