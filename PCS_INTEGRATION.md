# MotusFit — handoff entre dispositivos

Atualizado em: 2026-09-01 14:42 UTC
Dispositivo: não identificado nesta sessão
Branch: `master`
Sincronização: a correção de autenticação e o handoff foram enviados para `origin/master` até o commit `25b2a0a`. Permanece uma alteração local pré-existente e staged em `apps/api/package.json`, não incluída neste trabalho.

## Objetivo atual

Preparar uma publicação segura do MotusFit, com acesso pelo celular fora da rede/local.

## Estado confirmado

- Stack planejada: web Next.js 16 na Vercel, API Hono/Node 24 no Render e PostgreSQL no Neon.
- O repositório contém `render.yaml`, `apps/api/Dockerfile`, migrations Drizzle e proxy web `/api/*` para a API.
- Não há URL de produção registrada no repositório, e a documentação/handoff indicam que o deploy ainda não foi realizado. Portanto, o site não está confirmado como acessível publicamente; atualmente o acesso confirmado é somente local (`http://localhost:3000`).
- Vercel: sessão autenticada na equipe pessoal `felipehborges-projects`, mas ainda não há projeto MotusFit criado. Neon e Render pedem login nesta sessão.
- Build de produção da web passou após a correção de autenticação.
- Typecheck da web passou.
- E2E da web passou: 2 testes críticos (cadastro → treino → histórico e cadastro → treino → estatísticas) passaram; 1 teste de diário permanece intencionalmente ignorado porque nutrição está desativada.
- Testes passaram: core 14/14 e API 31/31.
- Site e API funcionam localmente com Node 24; web em `:3000` e API em `:3001`.
- O banco local é PGlite; produção deve obrigatoriamente receber `DATABASE_URL` persistente do Neon com SSL.
- A skill portátil `.agents/skills/pc-integration/SKILL.md` e o `AGENTS.md` da raiz foram criados. Todo agente deve ler e atualizar este arquivo em cada tarefa.
- Foi preparado um prompt curto para replicar a mesma skill, `AGENTS.md` e arquivo de handoff nos outros projetos do usuário.

## Bloqueador de publicação resolvido

Em produção, o Docker define `NODE_ENV=production`, ativando autenticação na API. As páginas `apps/web/src/app/login/page.tsx` e `apps/web/src/app/signup/page.tsx` agora exibem `apps/web/src/features/auth/auth-form.tsx` em vez de redirecionar para `/app`. O Playwright sobe a API com `NODE_ENV=test`, portanto testa cadastro real e sessão autenticada.

## Validação E2E

O Chromium do Playwright foi instalado/atualizado neste PC. Os testes `apps/web/e2e/workout.spec.ts` e `apps/web/e2e/stats.spec.ts` foram atualizados para a interface atual e passaram. A suíte tem 2 testes aprovados e 1 ignorado (nutrição desativada).

O comando `pnpm check` ainda falha no Biome porque o checkout do Windows contém CRLF em dezenas de arquivos e a configuração exige LF. Não foi aplicada uma reformatação global para evitar um diff mecânico fora do escopo. `pnpm typecheck`, `pnpm test` e `pnpm build` passaram separadamente.

## Próximos passos

1. Criar o PostgreSQL no Neon e obter a `DATABASE_URL` com `sslmode=require`.
2. Publicar a API no Render e configurar `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` e `CORS_ORIGINS`.
3. Publicar a web na Vercel com `API_URL` apontando para o Render.
4. Atualizar `CORS_ORIGINS` com a URL final da Vercel e testar persistência pelo HTTPS publicado no celular.

## Cuidados

- Antes de continuar em outro dispositivo, executar `git pull --ff-only` e ler este arquivo.
- Não sobrescrever mudanças locais existentes sem inspecionar `git status` e o diff.
- Nunca registrar segredos ou connection strings neste arquivo.

## Verificação desta sessão

- Validação realizada: inspeção de `docs/deployment.md`, `render.yaml`, remotes Git e estado do checkout.
- Resultado: deploy planejado para Vercel (web), Render (API) e Neon (PostgreSQL), mas não há evidência de URL ou publicação ativa. Nenhuma configuração de hosting foi alterada.
- Próxima ação recomendada: concluir a correção de autenticação e então realizar os passos de deploy documentados; após isso, registrar as URLs públicas (sem segredos) neste arquivo.

## Orientação da retomada

- A correção de autenticação está em `origin/master` (commits `0af7f01` e `25b2a0a`). Não restam alterações locais deste trabalho; há somente a alteração do usuário em `apps/api/package.json`.
- A publicação exige login no Neon e no Render. Vercel já está autenticada, mas criar o projeto e configurar variáveis ainda não foi feito. Nenhum segredo ou URL pública foi criado nesta sessão.
