# MotusFit

App de treino de força — rotinas, registro de séries, histórico e progresso — para Web, iOS e Android a partir de um monorepo TypeScript. O módulo nutricional permanece pausado e pode ser reativado posteriormente.

## Documentação

Projeto **spec-driven**: toda a especificação vive em [docs/](docs/).

- [Visão](docs/vision.md) · [Produto](docs/product.md) · [Roadmap](docs/roadmap.md)
- [Arquitetura](docs/architecture.md) · [Tech stack](docs/tech-stack.md) · [Modelo de domínio](docs/domain-model.md) · [Estrutura de pastas](docs/folder-structure.md)
- [API](docs/api-guidelines.md) · [Banco de dados](docs/database.md) · [Segurança](docs/security.md) · [Performance](docs/performance.md)
- [Padrões de código](docs/coding-standards.md) · [Testes](docs/testing.md) · [Deploy](docs/deployment.md) · [Contribuindo](docs/contributing.md)
- [ADRs](docs/adr/)

## Stack (resumo)

pnpm + Turborepo · Hono + oRPC + Zod 4 (API, Node 24) · PostgreSQL 17 + Drizzle (PGlite em dev — sem Docker local) · Better Auth · Next.js 16 (web) · Expo SDK 55 (mobile) · TanStack Query + Zustand · Biome · Vitest + Playwright · lefthook + Conventional Commits · GitHub Actions.

## Início rápido

```bash
corepack enable      # pnpm 10
pnpm install
pnpm dev             # api + web
pnpm test
pnpm check           # lint + typecheck
```

Detalhes em [docs/contributing.md](docs/contributing.md).
