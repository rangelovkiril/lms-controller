FROM oven/bun:1.3.9-debian AS build
WORKDIR /app

COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

COPY tsconfig.json middleware.ts ./
COPY src/ src/

RUN bun build src/index.ts \
    --outfile server \
    --target bun \
    --compile \
    --bytecode \
    --minify-syntax \
    --minify-whitespace \
    --tree-shaking

FROM gcr.io/distroless/cc-debian12:nonroot
WORKDIR /app

COPY --from=build --chown=65532:65532 /app/server .

USER 65532:65532
EXPOSE 3000
ENTRYPOINT ["/app/server"]
