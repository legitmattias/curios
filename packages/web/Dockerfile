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
RUN pnpm --filter @curios/web build

# Run
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/packages/web/build ./build
COPY --from=build /app/packages/web/package.json ./
EXPOSE 3000
CMD ["node", "build"]
