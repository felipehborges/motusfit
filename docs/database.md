# Banco de Dados — MotusFit

PostgreSQL 17. Schema gerido por **Drizzle ORM** em `packages/db` com migrations SQL versionadas (drizzle-kit). Dev/testes: **PGlite** (sem Docker). Produção: Postgres gerenciado.

## Convenções

- Tabelas e colunas em `snake_case`; nomes de tabela no plural.
- PK: `id` UUID v7 (ordenável por tempo — bom para índices) gerado na aplicação.
- Todas as tabelas: `created_at`, `updated_at` (`timestamptz`, default now, trigger/ORM para update).
- Soft delete **não** é padrão; exclusão é real, exceto onde o histórico exige (nenhum caso no MVP).
- FKs sempre com índice; `on delete` explícito por relação (nunca default implícito).
- Quantidades/cargas: `numeric(8,2)`; macros por porção: `numeric(8,2)`; kcal: `numeric(8,1)`.
- Datas de diário: `date` (dia no fuso do usuário — o cliente envia a data local); instantes: `timestamptz`.

## Schema (MVP)

```
users                    (Better Auth: users, sessions, accounts, verifications)
user_profiles            id, user_id UQ→users, display_name, body_weight_kg numeric(5,2) NULL,
                         timezone text default 'America/Sao_Paulo', unit_system text default 'metric'

foods                    id, owner_id→users NULL (NULL = catálogo futuro), source text ('user'|'catalog'),
                         name, brand NULL, serving_size numeric(8,2), serving_unit text ('g'|'ml'|'unit'),
                         kcal, protein_g, carbs_g, fat_g (por porção base)
                         IX (owner_id, name)
food_favorites           user_id→users, food_id→foods, PK composta, created_at
diary_entries            id, user_id→users, date date, meal_slot text ('breakfast'|'lunch'|'dinner'|'snack'),
                         food_id→foods (on delete restrict), quantity numeric(8,2), logged_at timestamptz
                         IX (user_id, date)
nutrition_goals          id, user_id→users, kcal, protein_g, carbs_g, fat_g,
                         effective_from date, effective_to date NULL   -- NULL = vigente
                         UQ parcial: um vigente por user

exercises                id, owner_id→users NULL, source, name, muscle_group text, equipment text NULL
                         UQ (owner_id, name) parcial p/ custom
routines                 id, user_id→users, name, notes NULL, archived_at NULL
routine_exercises        id, routine_id→routines (cascade), exercise_id→exercises (restrict),
                         position int, target_sets int, target_reps_min int, target_reps_max int,
                         rest_seconds int
                         UQ (routine_id, exercise_id), UQ (routine_id, position)
workout_sessions         id, user_id→users, routine_id→routines NULL (treino livre), title,
                         started_at, finished_at NULL, body_weight_kg_snapshot NULL, notes NULL
                         IX (user_id, started_at)
workout_sets             id, session_id→workout_sessions (cascade), exercise_id→exercises (restrict),
                         position int, reps int, weight_kg numeric(6,2), rest_seconds int NULL,
                         completed bool default true
```

Decisões notáveis:

- **Recentes** de alimentos não têm tabela: derivados de `diary_entries` (`DISTINCT ON food_id ORDER BY logged_at DESC LIMIT 20`).
- **Totais do dia e volume não são armazenados** — calculados na leitura (volume MVP não justifica denormalização; repositories isolam a query para otimizar depois).
- `body_weight_kg_snapshot` na sessão congela o peso usado na estimativa de kcal (perfil pode mudar depois).
- Metas com vigência (`effective_from/to`) preservam histórico para gráficos futuros.
- Tabelas do Better Auth são geradas pelo adapter Drizzle e vivem no mesmo schema.

## Migrations

- `drizzle-kit generate` a partir do schema TS → SQL em `packages/db/migrations/`; **migrations commitadas e imutáveis** após merge.
- Aplicação: `drizzle-kit migrate` (dev) / passo de deploy (produção). Nunca `db push` fora de protótipo local.
- Toda mudança de schema acompanha a feature que a exige (mesmo PR/commit).

## Ambientes

| Ambiente | Banco |
|---|---|
| Testes (unit/integration) | PGlite in-memory por suíte (migrations aplicadas no setup) |
| Dev local | PGlite persistido em `.data/` (default, zero setup) ou `DATABASE_URL` para Postgres real |
| CI | PGlite (mesmo caminho dos testes locais) |
| Produção | Postgres 17 gerenciado via `DATABASE_URL` |
