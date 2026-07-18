# 0003 — PostgreSQL + Drizzle ORM (PGlite em dev/testes)

- Status: aceito
- Data: 2026-07-18

## Contexto

Domínio relacional e pesado em agregações (diário alimentar, séries, estatísticas semanais). Restrição: máquina de dev **sem Docker**. Necessidade de migrations versionadas e testes de integração fiéis.

## Decisão

- **PostgreSQL 17** como banco único (produção: gerenciado — hosting decidido em ADR próprio na fase de deploy).
- **Drizzle ORM** + drizzle-kit para schema/migrations em `packages/db`.
- **PGlite** (Postgres em WASM, in-process) para dev local e testes — Postgres real, zero infraestrutura. `DATABASE_URL` presente ⇒ driver `pg`; ausente ⇒ PGlite em `.data/`.

## Alternativas consideradas

- **Prisma 7** — rust-free e maduro; DX de schema excelente. Não escolhido: mais pesado, menos afinidade com SQL explícito (agregações são o coração do domínio) e integração PGlite inferior à do Drizzle. É o "segundo lugar" válido.
- **MySQL/SQLite server-side** — Postgres vence em tipos (numeric, date/timestamptz), extensões futuras (pgvector para IA) e ecossistema de hosting.
- **Postgres nativo instalado no Windows** — funciona, mas setup manual por dev; PGlite é zero-setup e idêntico nos testes/CI.
- **Mock de banco nos testes** — proibido; PGlite dá Postgres real barato.

## Consequências

- (+) Dev/CI sem Docker; testes de integração contra Postgres verdadeiro; SQL explícito onde importa; ORM de ~57 KB.
- (−) PGlite é single-connection/in-process — nunca usar para ambiente compartilhado; staging/produção usam Postgres de verdade.
- (−) Drizzle relational queries menos ergonômicas que includes do Prisma em aninhamentos profundos — aceitável, agregações serão SQL de qualquer forma.
