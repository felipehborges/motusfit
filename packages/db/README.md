# @motusfit/db

Schema Drizzle, migrations e fábrica de conexão. `DATABASE_URL` presente ⇒ Postgres (driver `pg`); ausente ⇒ **PGlite** local (dev/testes sem Docker). Convenções e schema lógico em [docs/database.md](../../docs/database.md).

- `pnpm --filter @motusfit/db generate` — gera migration SQL a partir do schema
- Migrations commitadas em `migrations/`, imutáveis após merge
