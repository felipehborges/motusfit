# Estrutura de Pastas — MotusFit

```
motusfit/
├── apps/
│   ├── api/                    # Hono + oRPC (Node 24)
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── identity/   # perfil (auth em packages/auth)
│   │       │   ├── nutrition/
│   │       │   ├── workout/
│   │       │   └── stats/
│   │       ├── middleware/     # auth, logging, error mapping
│   │       ├── router.ts       # junta routers dos módulos → /api/v1
│   │       └── server.ts       # bootstrap Hono/Node
│   ├── web/                    # Next.js 16 (App Router)
│   │   └── src/
│   │       ├── app/            # rotas (App Router)
│   │       ├── features/       # componentes/hooks por feature (diary/, workout/, ...)
│   │       └── lib/            # setup api-client, providers
│   └── mobile/                 # Expo SDK 55
│       └── src/
│           ├── app/            # Expo Router
│           ├── features/
│           └── lib/
├── packages/
│   ├── core/                   # domínio puro: cálculos, invariantes, constantes (zero deps)
│   ├── contracts/              # contratos oRPC + schemas Zod (fonte da verdade da API)
│   ├── api-client/             # cliente oRPC tipado + helpers TanStack Query
│   ├── db/                     # schema Drizzle, migrations, client factory (pg + pglite)
│   ├── auth/                   # configuração Better Auth (server) + client plugins
│   └── config/                 # tsconfig base, presets compartilhados
├── tools/                      # scripts de repo (seed, geração)
├── docs/                       # esta documentação + adr/
├── .github/workflows/          # CI
├── turbo.json
├── pnpm-workspace.yaml         # inclui catalogs (versões centralizadas)
├── biome.json
├── lefthook.yml
└── commitlint.config.mjs
```

## Convenções

- Pacotes internos publicam **source**: `"exports": { ".": "./src/index.ts" }` — nada de build interno para `dist` (Next/Metro/tsx consomem TS direto). Build só em deploy da API (tsdown) e nos apps.
- Nome dos pacotes: escopo `@motusfit/*` (`@motusfit/core`, `@motusfit/contracts`, ...). Dependências internas via `workspace:*`.
- Versões de dependências externas: **sempre** via `catalog:` no `pnpm-workspace.yaml`; nunca versão solta em package.json.
- Dentro de `features/` (web/mobile): componente + hook + teste da feature juntos; nada de pastas globais `components/` gigantes (só `ui/` para primitivos de design system do app).
- Testes co-localizados: `foo.test.ts` ao lado de `foo.ts`. E2E web em `apps/web/e2e/`.
- `packages/core` não importa **nada** de fora (nem Zod) — garante portabilidade total (roda no device, no edge, em worker).
- Direção de imports validada por convenção + revisão (se violações virarem problema, adotar dependency-cruiser — ADR antes).
