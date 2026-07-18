# 0001 — Monorepo com pnpm workspaces + Turborepo

- Status: aceito
- Data: 2026-07-18

## Contexto

Três apps (API, web Next.js, mobile Expo) precisam compartilhar domínio, contratos e cliente de API com type safety ponta a ponta, em TypeScript, com um time pequeno.

## Decisão

Monorepo único gerido por **pnpm 10 workspaces** (com **catalogs** para centralizar versões) e **Turborepo 2.x** para orquestração de tarefas e cache. TypeScript **5.9 strict** com project references; pacotes internos exportam **source** (`./src/index.ts`) — sem builds internos para `dist` (Next/Metro/tsx transformam TS diretamente). `.npmrc` com `node-linker=hoisted` (exigência do Metro/Expo).

## Alternativas consideradas

- **Nx** — mais recursos (generators, boundaries, CI IA), mas curva e complexidade desproporcionais ao tamanho do time; Turborepo é o default da comunidade para monorepos de apps em 2026.
- **pnpm puro (sem task runner)** — sem cache nem grafo de tarefas; CI lento cedo demais.
- **moonrepo** — nicho; diferencial (pin de toolchain) não é dor nossa.
- **Bun como package manager** — instalação mais rápida, mas hoisting não-estrito e compatibilidade Expo/EAS mais fraca; pnpm é a escolha segura para monorepo de time.
- **Polyrepo** — inviabiliza contratos compartilhados tipados sem publicar pacotes.
- **TypeScript 7 (Go) imediato** — GA em jul/2026, mas sem API programática até a 7.1; adiado (revisar no fim de 2026).

## Consequências

- (+) Cache e `--affected` no CI; versões únicas via catalog; refactors atômicos cross-app.
- (−) Turborepo não impõe fronteiras de import — disciplina via revisão/convenção (dependency-cruiser se necessário).
- (−) `node-linker=hoisted` abre mão do isolamento estrito do pnpm — preço do suporte a Metro.
