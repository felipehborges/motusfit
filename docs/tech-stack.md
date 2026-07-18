# Tech Stack — MotusFit

Decisões tomadas em **julho/2026**, com base em pesquisa de documentação oficial e consenso da comunidade. Cada decisão estrutural tem um ADR correspondente em [adr/](adr/). Versões são geridas via **pnpm catalogs** ([pnpm-workspace.yaml](../pnpm-workspace.yaml)).

## Resumo

| Camada | Escolha | Versão | ADR |
|---|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | pnpm 10 / turbo 2.x | [0001](adr/0001-monorepo.md) |
| Linguagem | TypeScript (strict) | 5.9 → migração planejada p/ 7.x | [0001](adr/0001-monorepo.md) |
| API | Hono (Node 24 LTS) + oRPC | Hono 4 / oRPC 1 | [0002](adr/0002-api.md) |
| Banco | PostgreSQL 17 + Drizzle ORM (PGlite em dev/testes) | drizzle-orm 0.4x | [0003](adr/0003-database.md) |
| Auth | Better Auth (+ plugin Expo) | 1.x | [0004](adr/0004-auth.md) |
| Web | Next.js App Router + Tailwind CSS 4 | Next 16 | [0005](adr/0005-web.md) |
| Mobile | Expo SDK 55 (RN 0.83, New Architecture) + Expo Router + NativeWind 4 | — | [0006](adr/0006-mobile.md) |
| Server state | TanStack Query | 5 | [0005](adr/0005-web.md) |
| Client state | Zustand | 5 | [0005](adr/0005-web.md) |
| Formulários | React Hook Form + Zod | RHF 7 / Zod 4 | [0005](adr/0005-web.md) |
| Validação | Zod (compartilhado em `packages/contracts`) | 4 | [0002](adr/0002-api.md) |
| Lint/format | Biome | 2.5 | [0007](adr/0007-quality-tooling.md) |
| Testes | Vitest 4 + Playwright (e2e web) | — | [0007](adr/0007-quality-tooling.md) |
| Git hooks | lefthook + commitlint (Conventional Commits) | — | [0007](adr/0007-quality-tooling.md) |
| CI | GitHub Actions + `turbo --affected` | — | [0007](adr/0007-quality-tooling.md) |

## Justificativas (resumo — detalhe nos ADRs)

- **pnpm + Turborepo** — padrão de mercado 2026 para monorepos de apps TS; Turborepo faz orquestração + cache sem impor estrutura (Nx seria overkill para o tamanho do time). pnpm **catalogs** centralizam versões; `node-linker=hoisted` é obrigatório para o Metro (Expo).
- **Hono em vez de NestJS/Fastify** — Web Standards, portátil entre runtimes (Node hoje; edge/serverless amanhã, útil para webhooks de wearables), inferência de tipos excelente e integração de primeira classe com Zod. NestJS resolveria estrutura via framework, mas ao custo de abstração pesada; nossa estrutura vem da arquitetura documentada, não do framework.
- **oRPC em vez de tRPC/REST puro** — type safety ponta a ponta para web e mobile **com OpenAPI nativo no core** (tRPC depende de add-on de terceiros frágil). Isso atende "API versionada + documentação automática" hoje e API pública futura sem reescrita. Risco (lib jovem, v1 em dez/2025) mitigado pelo design contract-first: o contrato OpenAPI é a saída de emergência.
- **Drizzle em vez de Prisma** — SQL-first combina com domínio pesado em dados/agregações (diário, séries, estatísticas); leve (~57 KB, sem engine); suporte de primeira classe a **PGlite**, que resolve dev/testes **sem Docker** (restrição da máquina local). Prisma 7 (rust-free) é hoje uma segunda opção válida — não foi escolhido por peso e menor afinidade com SQL explícito.
- **Better Auth em vez de Clerk/Auth.js** — Auth.js está em manutenção (time absorvido pelo Better Auth em 2025). Better Auth é MIT, self-hosted no nosso Postgres (adapter Drizzle), com plugins de Expo (mobile), 2FA, passkeys e **Stripe (premium futuro)**. Clerk tem ótima DX, mas lock-in SaaS e custo alto em escala.
- **Next.js 16 para web + Expo para nativo, compartilhando lógica e não UI** — consenso 2026: react-native-web para todo o site penaliza SEO/semântica; compartilhar domínio, contratos, api-client e hooks cobre a maior parte do ganho com risco muito menor. Tailwind 4 (web) e NativeWind 4 (mobile) compartilham o modelo mental e tokens de design; NativeWind 5 (Tailwind 4 nativo) será adotado quando GA.
- **Biome em vez de ESLint+Prettier** — binário único, ~ordens de magnitude mais rápido no monorepo, cobre regras de React hooks/a11y/typescript-eslint. Gap conhecido: ordenação de classes Tailwind é parcial (`useSortedClasses`) — aceito.
- **lefthook em vez de Husky** — pedido original citava Husky; lefthook cumpre a mesma função (hooks + commitlint) com execução paralela, um único YAML e escopo por pacote nativo, sem shell glue. Divergência registrada no [ADR 0007](adr/0007-quality-tooling.md).
- **Vitest 4 + Playwright** — Vitest para unit/component (Browser Mode estável), Playwright para e2e dos fluxos críticos web. App mobile: lógica testada nos packages; e2e mobile (Maestro) fica pós-MVP.
- **Node 24 LTS** — Ativo até 2027; Bun ganha em microbenchmark, mas em API com I/O de banco a diferença é <3% e o ecossistema/N-API do Node vence. Hono nos mantém portáteis se isso mudar.
- **TypeScript 5.9 agora, 7.x depois** — TS 7 (compilador Go) saiu em jul/2026 **sem API programática** (necessária para partes do ecossistema). Ficamos em 5.9 strict e migramos quando 7.1 estabilizar a API. Config: project references, pacotes internos exportam **source** (`exports` → `./src/index.ts`) — Next/Metro/Vite transformam TS diretamente; ninguém builda `dist` interno.

## O que deliberadamente NÃO usamos (por ora)

- **NestJS, CQRS frameworks, event bus** — overengineering para o tamanho atual; pontos de extensão previstos em [architecture.md](architecture.md).
- **Microservices** — monólito modular; contextos isolados permitem extração futura.
- **Offline-first completo** — MVP usa TanStack Query com persistência de cache; caminho de evolução: expo-sqlite + Drizzle (+ sync engine tipo PowerSync). Ver [architecture.md](architecture.md).
- **Docker em dev local** — máquina de dev sem Docker; PGlite cobre dev/testes. Dockerfiles existem para **produção/CI** ([deployment.md](deployment.md)).
