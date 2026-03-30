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
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=build /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=build /app/packages/shared/ ./packages/shared/
COPY --from=build /app/packages/api/ ./packages/api/

WORKDIR /app/packages/api
EXPOSE 4000
CMD ["bun", "run", "src/index.ts"]
