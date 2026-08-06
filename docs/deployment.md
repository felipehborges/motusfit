# Deploy — MotusFit

## Ambientes

| Ambiente | Conteúdo |
|---|---|
| Local | PGlite (sem Docker — restrição da máquina de dev); apps via `pnpm dev` |
| CI | GitHub Actions; testes com PGlite; builds afetados via Turborepo |
| Produção | API no Render (Docker) + Postgres no Neon; web na Vercel; mobile ainda não publicado (uso via web, ADR 0008) |

Decisão de hosting registrada em [ADR 0008](adr/0008-hospedagem.md): Vercel (web) + Render (API) + Neon (Postgres), todos free tier sem cartão de crédito — adequado para uso pessoal de um usuário. Mobile via EAS/lojas é adiado até o web estar validado no dia a dia (ver ADR 0006).

## Deploy de produção (passo a passo)

1. **Neon**: criar projeto free → copiar a connection string → acrescentar `?sslmode=require`.
2. **Render**: "New +" → "Blueprint" → apontar para este repo (usa [render.yaml](../render.yaml), que já referencia o `Dockerfile` de `apps/api`) → preencher `DATABASE_URL` (do Neon), `BETTER_AUTH_URL` (a própria URL pública que o Render atribui ao serviço, ex. `https://motusfit-api.onrender.com`) e `CORS_ORIGINS` (URL da Vercel, preenchida depois do passo 3). `BETTER_AUTH_SECRET` é gerado automaticamente pelo Blueprint.
3. **Vercel**: importar o repo → Root Directory = `apps/web` (monorepo pnpm/Turborepo detectado automaticamente) → env var `API_URL` (não `NEXT_PUBLIC_*`) = URL do Render.
4. Voltar no Render e atualizar `CORS_ORIGINS` com a URL final da Vercel; redeploy.
5. No celular: abrir a URL da Vercel, "Adicionar à tela de início" para um atalho tipo app.

Sem passo de migration manual: `applyMigrations` roda no boot da API (mesmo código do PGlite em dev), então cada deploy já aplica migrations pendentes.

## Artefatos

- **API**: `Dockerfile` multi-stage em `apps/api` (`node:24-slim`, non-root, roda `tsx src/server.ts` sem bundle — suficiente na escala atual; bundler dedicado é otimização futura, não bloqueia o deploy). Buildado pelo próprio Render a cada push (dev local não precisa de Docker).
- **Web**: build Next.js na Vercel (zero config, preview deployments automáticos por PR).
- **Mobile**: EAS Build (perfis `development`, `preview`, `production` em `eas.json`); distribuição TestFlight/Play Internal; OTA via EAS Update para mudanças JS.

## CI (GitHub Actions)

Workflow `ci.yml` em todo PR e push na `master`:

1. checkout (`fetch-depth: 0` para detecção de afetados) → pnpm/action-setup → setup-node 24 com cache pnpm → `pnpm install --frozen-lockfile`.
2. `turbo run lint typecheck test build --affected` (na `master`, sem `--affected`).
3. Job e2e (Playwright) separado, condicionado a mudanças em web/api/packages.
4. Remote cache do Turborepo: ativar quando houver time (secrets `TURBO_TOKEN`/`TURBO_TEAM`); por ora, cache local do runner.

## Migrations

`applyMigrations` roda no boot da API (dev e produção, mesmo código) — sem passo de deploy dedicado. Migrations continuam precisando ser backward-compatible com a versão anterior (expand → migrate → contract para mudanças destrutivas), já que o Render sobe a nova versão antes de desligar a antiga.

## Variáveis de ambiente

`.env.example` na raiz; validação Zod no bootstrap (`apps/api/src/env.ts`). Principais: `DATABASE_URL` (ausente ⇒ PGlite local; produção exige `sslmode=require` no Neon), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGINS`, `API_URL` (proxy do web, servidor apenas)/`EXPO_PUBLIC_API_URL` (mobile, chama a API direto). `PORT` (convenção do Render) tem prioridade sobre `API_PORT` quando presente.

Web e API em domínios distintos (Vercel + Render): o Next.js proxeia `/api/*` pra API através do próprio domínio do web (`apps/web/next.config.ts`, rewrite usando `API_URL`) — o navegador nunca fala com o Render diretamente, então o cookie de sessão é first-party de verdade. Sem isso, Safari/iOS bloqueia o cookie via ITP mesmo com `sameSite=none; secure` (que `packages/auth` também aplica, como defesa em profundidade, mas sozinho não bastou no Safari). Mobile não usa esse proxy — fala com a API direto via `EXPO_PUBLIC_API_URL`, sem esse problema (não é cookie de navegador).
