FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10 --activate

# Install dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/web/package.json packages/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY packages/shared/ packages/shared/
COPY packages/web/ packages/web/

# PUBLIC_API_URL is baked in at build time by SvelteKit ($env/static/public)
ARG PUBLIC_API_URL=http://localhost:4000
ENV PUBLIC_API_URL=${PUBLIC_API_URL}
RUN pnpm --filter @curios/web build

# Run
FROM node:22-alpine
RUN addgroup -S curios && adduser -S curios -G curios
WORKDIR /app

COPY --from=build /app/packages/web/build ./build
COPY --from=build /app/packages/web/package.json ./

# Install runtime dependencies needed for SSR (workspace:^ deps are build-only)
RUN npm install marked dompurify && chown -R curios:curios /app

USER curios
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1
CMD ["node", "build"]
