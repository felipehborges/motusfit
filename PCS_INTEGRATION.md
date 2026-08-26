# MotusFit — handoff entre dispositivos

Atualizado em: 2026-08-26 (America/Sao_Paulo)  
Dispositivo: PC de trabalho (`SWINNT-NOTE0085`)  
Branch: `master`  
Sincronização: todas as alterações locais, incluindo esta integração entre dispositivos, serão incluídas no próximo commit e enviadas para `origin/master`.

## Objetivo atual

Publicar o MotusFit para uso real no navegador do celular durante o treino, com backend e PostgreSQL persistente. O fluxo necessário inclui criar rotinas e exercícios, iniciar uma sessão, registrar séries/repetições/carga, concluir o treino e consultar histórico e estatísticas sem perder dados.

## Estado confirmado

- Stack planejada: web Next.js 16 na Vercel, API Hono/Node 24 no Render e PostgreSQL no Neon.
- O repositório contém `render.yaml`, `apps/api/Dockerfile`, migrations Drizzle e proxy web `/api/*` para a API.
- Build de produção passou.
- Typecheck passou em todos os pacotes aplicáveis.
- Testes passaram: core 14/14 e API 31/31.
- Site e API funcionam localmente com Node 24; web em `:3000` e API em `:3001`.
- O banco local é PGlite; produção deve obrigatoriamente receber `DATABASE_URL` persistente do Neon com SSL.
- A skill portátil `.agents/skills/pc-integration/SKILL.md` e o `AGENTS.md` da raiz foram criados. Todo agente deve ler e atualizar este arquivo em cada tarefa.

## Bloqueador de publicação identificado

Em produção, o Docker define `NODE_ENV=production`, o que ativa autenticação na API. Entretanto, `apps/web/src/app/login/page.tsx` e `apps/web/src/app/signup/page.tsx` redirecionam diretamente para `/app`. Um deploy no estado atual pode abrir a interface, mas não consegue autenticar para gravar recursos protegidos.

A correção recomendada é restaurar as páginas reais usando `apps/web/src/features/auth/auth-form.tsx`, manter autenticação ligada em produção e atualizar os testes E2E. Não publicar com `AUTH_ENABLED=false`, pois isso exporia os dados do usuário a qualquer pessoa com acesso à URL.

## Validação E2E

O Chromium do Playwright foi instalado neste PC. O teste `apps/web/e2e/workout.spec.ts` foi executado, mas expirou esperando o campo `Nome` em `/signup`, confirmando o bloqueador acima: a rota redireciona para `/app`. Não foi uma falha de build ou da API.

O comando `pnpm check` ainda falha no Biome porque o checkout do Windows contém CRLF em dezenas de arquivos e a configuração exige LF. Não foi aplicada uma reformatação global para evitar um diff mecânico fora do escopo. `pnpm typecheck`, `pnpm test` e `pnpm build` passaram separadamente.

## Próximos passos

1. Restaurar login e cadastro na web e garantir navegação correta para usuários sem sessão.
2. Ajustar e executar o E2E completo: cadastro/login → rotina → sessão → séries com reps/carga → conclusão → histórico.
3. Criar o PostgreSQL no Neon e obter a `DATABASE_URL` com `sslmode=require`.
4. Publicar a API no Render e configurar `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` e `CORS_ORIGINS`.
5. Publicar a web na Vercel com `API_URL` apontando para o Render.
6. Atualizar `CORS_ORIGINS` com a URL final da Vercel e testar persistência pelo HTTPS publicado no celular.

## Cuidados

- Antes de continuar em outro dispositivo, executar `git pull --ff-only` e ler este arquivo.
- Não sobrescrever mudanças locais existentes sem inspecionar `git status` e o diff.
- Nunca registrar segredos ou connection strings neste arquivo.
