# Build em CI/produção — dev local não usa Docker (ADR 0003 / docs/deployment.md)
FROM node:24-slim AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc package.json ./
COPY apps/api/package.json apps/api/
COPY packages ./packages
COPY tools/package.json tools/
RUN pnpm install --frozen-lockfile --filter @motusfit/api...
COPY apps/api ./apps/api
# Sem bundle: tsx interpreta TS direto também em produção (escala atual não justifica bundler dedicado)
RUN pnpm --filter @motusfit/api exec tsx --version

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo /repo
USER node
EXPOSE 3001
CMD ["pnpm", "--filter", "@motusfit/api", "exec", "tsx", "src/server.ts"]
