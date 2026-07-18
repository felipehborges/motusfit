# Estratégia de Testes — MotusFit

Testes existem **desde a primeira feature**. Pirâmide pragmática: muitos unit no domínio, integração de API contra Postgres real (PGlite), e2e fino nos fluxos críticos.

## Camadas

| Camada | Ferramenta | Escopo | Onde |
|---|---|---|---|
| Unit (domínio) | Vitest 4 | `packages/core`: cálculos de macro, volume, kcal, semana ISO — cobertura alta obrigatória | co-localizado |
| Unit (use cases) | Vitest | use cases com repository fake em memória | co-localizado |
| Integração (API) | Vitest + **PGlite** | rota oRPC → use case → repository → Postgres real (WASM), migrations aplicadas no setup; um banco limpo por arquivo de teste | co-localizado |
| Component (web) | Vitest Browser Mode (Playwright provider) | componentes críticos de feature | co-localizado |
| E2E (web) | Playwright | fluxos críticos: signup/login, registrar refeição, executar treino, dashboard | `apps/web/e2e/` |
| Mobile | — no MVP | lógica compartilhada já coberta nos packages; e2e Maestro pós-MVP | — |

## Regras

1. Feature só é "pronta" com testes passando (`turbo run test`) — parte do Definition of Done ([contributing.md](contributing.md)).
2. Regra de cálculo nova em `core` exige casos de borda: quantidade fracionária, zero, fronteira de semana ISO, fuso.
3. Testes de integração **não mockam o banco** — PGlite é Postgres de verdade; mock de banco é proibido.
4. Repositories fakes (para unit de use case) implementam a mesma interface do repository real e vivem ao lado dele.
5. E2E roda contra build de produção do web + API com PGlite semeado (`tools/seed`).
6. Sem meta de cobertura numérica global (métrica de vaidade); cobertura é revisada por módulo — `core` perto de 100%, handlers finos podem ter pouca.

## Execução

- `pnpm test` (raiz) → `turbo run test` com cache; CI usa `--affected`.
- Watch local: `pnpm --filter @motusfit/core test -- --watch`.
- E2E: job separado no CI (`playwright install --with-deps`, headless), só nos PRs que afetam web/API.
