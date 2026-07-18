# Build em CI/produção — dev local não usa Docker (ADR 0003 / docs/deployment.md)
FROM node:24-slim AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc package.json ./
COPY apps/api/package.json apps/api/
COPY packages ./packages
RUN pnpm install --frozen-lockfile --filter @motusfit/api...
COPY apps/api ./apps/api
# Sem build step: Node 24 roda TS via tsx apenas em dev; produção usa bundle
RUN pnpm --filter @motusfit/api exec tsx --version

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo /repo
USER node
EXPOSE 3001
CMD ["pnpm", "--filter", "@motusfit/api", "exec", "tsx", "src/server.ts"]
