# Performance — MotusFit

Princípio: **medir antes de otimizar**; a arquitetura garante que os pontos quentes tenham onde ser otimizados sem refatoração.

## Orçamentos (MVP)

| Métrica | Alvo |
|---|---|
| API p95 (endpoints de leitura do diário/sessão) | < 150 ms |
| API p95 (agregações semanais) | < 300 ms |
| Web LCP (dashboard, 4G) | < 2.5 s |
| Mobile: abrir app → diário interativo | < 2 s (dispositivo médio) |
| Registrar série (tap → confirmação otimista) | < 100 ms percebido |

## Backend

- Índices definidos junto com a query que os usa ([database.md](database.md)); toda listagem tem índice cobrindo o filtro principal (`(user_id, date)`, `(user_id, started_at)`).
- Agregações (macros do dia, volume, stats semanais) são **uma query SQL** no repository — nunca N+1 em loop de aplicação. Drizzle relational queries com `with` para composição.
- Paginação cursor-based (offset degrada com histórico grande).
- Sem cache de aplicação no MVP (dados por usuário, leituras baratas); se agregações pesarem, materialized views/denormalização — isolado no repository.
- Node 24 + Hono: overhead de framework desprezível; pool de conexões via driver `pg` (produção).

## Frontend (web e mobile)

- TanStack Query: `staleTime` sensato por recurso (catálogo de alimentos: minutos; diário do dia: curto), invalidação por chave após mutação.
- **Mutações otimistas** nos fluxos quentes (adicionar entrada no diário, marcar série) — a percepção de velocidade importa mais que o p95 do servidor; cálculo otimista de totais usa `packages/core` no cliente.
- Mobile: FlashList para listas longas (histórico, busca de alimentos); imagens via expo-image; Hermes (default).
- Web: App Router com RSC para páginas de leitura; bundle vigiado (`next build` size report no CI, revisão manual).
- Persistência de cache do Query no mobile (MMKV) — abrir o app mostra últimos dados instantaneamente.

## Monitoramento

- MVP: logs estruturados (pino) com duração por request + `request-id`.
- Pós-MVP: OpenTelemetry (Hono tem middleware) + Sentry nos três apps.
