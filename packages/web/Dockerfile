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

# PUBLIC_* vars get baked into the client bundle at build time by SvelteKit
# ($env/static/public); they're public anyway. SENTRY_ORG / SENTRY_PROJECT
# are public identifiers — fine as ARG. SENTRY_AUTH_TOKEN is a real
# credential, so we mount it as a build-time secret instead of an ARG/ENV
# (otherwise it ends up in image-layer metadata).
ARG PUBLIC_API_URL=http://localhost:4000
ARG PUBLIC_SENTRY_DSN=
ARG PUBLIC_SENTRY_ENV=
ARG PUBLIC_SENTRY_RELEASE=
ARG SENTRY_ORG=
ARG SENTRY_PROJECT=
ENV PUBLIC_API_URL=${PUBLIC_API_URL}
ENV PUBLIC_SENTRY_DSN=${PUBLIC_SENTRY_DSN}
ENV PUBLIC_SENTRY_ENV=${PUBLIC_SENTRY_ENV}
ENV PUBLIC_SENTRY_RELEASE=${PUBLIC_SENTRY_RELEASE}
ENV SENTRY_ORG=${SENTRY_ORG}
ENV SENTRY_PROJECT=${SENTRY_PROJECT}
RUN --mount=type=secret,id=sentry_auth_token \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token 2>/dev/null || true)" \
    pnpm --filter @curios/web build

# Run
FROM node:22-alpine
RUN addgroup -S curios && adduser -S curios -G curios
WORKDIR /app

COPY --from=build /app/packages/web/build ./build

# Install runtime dependencies needed for SSR (separate from workspace package.json)
RUN echo '{"dependencies":{"marked":"^18.0.0","dompurify":"^3.3.3","@sentry/sveltekit":"^10.50.0"}}' > package.json \
    && npm install \
    && chown -R curios:curios /app

USER curios
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000 || exit 1
CMD ["node", "build"]
