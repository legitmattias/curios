FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10 --activate

# Install dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/api/package.json packages/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared/ packages/shared/
COPY packages/api/ packages/api/

# Run with Bun
FROM oven/bun:1.3-alpine
RUN addgroup -S curios && adduser -S curios -G curios
WORKDIR /app
COPY --chown=curios:curios --from=build /app/node_modules ./node_modules
COPY --chown=curios:curios --from=build /app/packages/api/node_modules ./packages/api/node_modules
COPY --chown=curios:curios --from=build /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --chown=curios:curios --from=build /app/packages/shared/ ./packages/shared/
COPY --chown=curios:curios --from=build /app/packages/api/ ./packages/api/

USER curios
WORKDIR /app/packages/api
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1
CMD ["bun", "run", "src/index.ts"]
