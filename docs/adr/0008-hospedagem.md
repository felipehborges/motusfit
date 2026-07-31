# 0008 — Hospedagem de produção (Vercel + Render + Neon)

- Status: aceito
- Data: 2026-07-31

## Contexto

MVP validado localmente (fases 1-6); uso é pessoal (um usuário, o autor) e o objetivo imediato é acesso remoto (celular, na academia) sem custo, antes de investir em app mobile nas lojas. `docs/deployment.md` já previa "API containerizada + Postgres gerenciado; web na Vercel" e deixava a escolha de provedor para um ADR na época do deploy — este é esse ADR.

Restrições: custo zero, sem cartão de crédito, sem gerenciar servidor.

## Decisão

- **Web**: **Vercel** (free/Hobby). Zero-config para Next.js 16; monorepo suportado nativamente (Root Directory = `apps/web`, detecta pnpm workspace + Turborepo).
- **API**: **Render** (free Web Service, tipo Docker, usando o `Dockerfile` já existente em `apps/api`). Único dos três (Render/Railway/Fly.io) sem exigir cartão no free tier em 2026; contrapartida: hiberna após ~15min sem tráfego, acordando em ~30s no request seguinte — aceitável para uso pessoal.
- **Banco**: **Neon** (Postgres free tier, serverless, scale-to-zero). Sem cartão; `DATABASE_URL` com `?sslmode=require`.
- **Migrations**: sem passo dedicado — `server.ts` já chama `applyMigrations(db)` no boot (mesmo caminho do PGlite em dev), então a API aplica migrations pendentes automaticamente a cada deploy/restart no Render.
- **CI**: inalterado. Deploy acontece via integração nativa GitHub → Vercel / GitHub → Render (push em `master` dispara build), sem job novo em `ci.yml`.

## Alternativas consideradas

- **Railway** — melhor DX de deploy, mas exige cartão mesmo no trial (2026); descartado pelo requisito de custo zero sem cartão.
- **Fly.io** — reduziu o free tier a um trial de 2h para contas novas em 2026 e também exige cartão; descartado.
- **Supabase** (no lugar de Neon) — plataforma completa (auth/storage/functions), mas já temos Better Auth; Neon é mais simples por ser só banco, com scale-to-zero mais agressivo (idle timeout configurável) contra a pausa semanal do Supabase free.
- **VPS gratuito (Oracle Cloud Free Tier etc.)** — grátis "para sempre" mas exige gerenciar SO/patching/TLS manualmente; fora do escopo de "sem gerenciar servidor" para um projeto pessoal.

## Consequências

- (+) Custo zero, sem cartão, sem servidor para administrar; deploy automático a cada push.
- (+) `Dockerfile` e `applyMigrations` já existentes funcionam sem alteração estrutural — só variáveis de ambiente.
- (−) Cold start de ~30s na API após inatividade (Render free hiberna) — perceptível na primeira requisição do dia; aceitável para uso pessoal, revisitar se virar multi-usuário.
- (−) Free tier do Neon e do Render têm limites de storage/compute que não escalam para produção multi-usuário — o dia que isso for necessário, é upgrade de plano nos mesmos provedores, não migração.
- Env vars de produção (Render): `DATABASE_URL` (Neon, com `sslmode=require`), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (URL pública da API no Render), `CORS_ORIGINS` (URL pública do web na Vercel). Env vars da Vercel: `NEXT_PUBLIC_API_URL` (URL pública da API no Render).
