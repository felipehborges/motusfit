# Deploy — MotusFit

## Ambientes

| Ambiente | Conteúdo |
|---|---|
| Local | PGlite (sem Docker — restrição da máquina de dev); apps via `pnpm dev` |
| CI | GitHub Actions; testes com PGlite; builds afetados via Turborepo |
| Produção (quando ativada) | API containerizada + Postgres gerenciado; web na Vercel; mobile via EAS |

O MVP prioriza o pipeline de CI; o deploy de produção é ativado ao final da Fase 5 (dashboard) — decisões de hosting (Neon vs Supabase vs RDS; Fly/Railway para a API) serão registradas em ADR próprio na época, sem impacto no código (tudo via `DATABASE_URL`/envs).

## Artefatos

- **API**: `Dockerfile` multi-stage em `apps/api` (pnpm fetch → build com tsdown → imagem `node:24-slim`, non-root). Buildado no CI (o dev local não precisa de Docker).
- **Web**: build Next.js — alvo primário Vercel (zero config, preview deployments); o `output: 'standalone'` mantém a opção de container.
- **Mobile**: EAS Build (perfis `development`, `preview`, `production` em `eas.json`); distribuição TestFlight/Play Internal; OTA via EAS Update para mudanças JS.

## CI (GitHub Actions)

Workflow `ci.yml` em todo PR e push na `master`:

1. checkout (`fetch-depth: 0` para detecção de afetados) → pnpm/action-setup → setup-node 24 com cache pnpm → `pnpm install --frozen-lockfile`.
2. `turbo run lint typecheck test build --affected` (na `master`, sem `--affected`).
3. Job e2e (Playwright) separado, condicionado a mudanças em web/api/packages.
4. Remote cache do Turborepo: ativar quando houver time (secrets `TURBO_TOKEN`/`TURBO_TEAM`); por ora, cache local do runner.

## Migrations em produção

Passo de deploy dedicado: `drizzle-kit migrate` roda **antes** da nova versão da API subir; migrations são backward-compatible com a versão anterior (expand → migrate → contract para mudanças destrutivas).

## Variáveis de ambiente

`.env.example` na raiz e por app; validação Zod no bootstrap. Principais: `DATABASE_URL` (ausente ⇒ PGlite local), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `API_URL` (clientes), `CORS_ORIGINS`.
