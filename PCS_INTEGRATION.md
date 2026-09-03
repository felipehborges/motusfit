# MotusFit — handoff entre dispositivos

Atualizado em: 2026-09-03 02:20 UTC
Dispositivo: não identificado nesta sessão
Branch: `master`
Sincronização: `master` foi enviado com sucesso para `origin` no commit `bf8b4d5`; a alteração local pré-existente em `apps/api/package.json` permanece fora dos commits e sem stage.

## Objetivo atual

Validar a UX e as regras visuais do web com dados locais, sem qualquer requisição ao backend, preservando Next.js/Vercel e sem alterar `apps/mobile` ou contratos funcionais.

## Estado desta sessão

- shadcn/ui foi inicializado em `apps/web` com Tailwind CSS v4 e alias `@/`; `components.json` e `src/lib/utils.ts` foram adicionados.
- Componentes instalados: `button`, `card`, `badge`, `input`, `label`, `separator` e `skeleton`. A configuração adicionou `class-variance-authority`, `clsx`, `radix-ui`, `tailwind-merge` e `tw-animate-css` ao app web.
- `src/app/globals.css` agora define tokens neobrutalistas (superfícies creme, lima e laranja, bordas pretas de 3 px, sombras deslocadas e foco visível) e aplica a mesma linguagem aos primitives shadcn e aos compostos específicos do produto.
- Login e cadastro foram convertidos para `Card`, `Input`, `Label` e `Button` shadcn. Dashboard, treinos, sessão ativa, estatísticas e perfil passaram a usar `Card`, `Button` e `Badge` shadcn nas superfícies e ações migradas.
- `src/components/ui.tsx` deixou de definir `Card` próprio e `StatusPill`; agora apenas reexporta o `Card` shadcn e mantém cabeçalhos/métricas como composições específicas de apresentação, sem substituir regras de negócio.
- Nenhum arquivo de `apps/mobile` foi alterado. A alteração local e staged em `apps/api/package.json` foi preservada e não foi incluída neste trabalho.
- O web agora está deliberadamente em modo de demonstração (`DEMO_MODE = true` em `apps/web/src/lib/mock-api.ts`). Todas as chamadas do cliente tipado são interceptadas localmente com dados de treino, rotinas, sessão, perfil e estatísticas; login e cadastro apenas navegam para a demonstração. Não há requisições à API nesse modo.
- As miniaturas remotas da biblioteca de exercícios também foram substituídas por placeholders locais no modo de demonstração, evitando chamadas externas durante a revisão de UI.
- Para religar o backend após a aprovação da UI, mudar `DEMO_MODE` para `false` e restaurar autenticação real no fluxo de `AuthForm`; não alterar os contratos nem os endpoints.

## Validação desta sessão

- `pnpm --filter web typecheck`: passou.
- `pnpm --filter web build`: passou (Next.js 16.2.10).
- Após a introdução do modo de demonstração: `pnpm --filter web typecheck` e `pnpm --filter web build` passaram novamente.
- Preview local compilou em `http://localhost:3001/login`; a abertura foi enviada ao painel do Codex.
- E2E: não concluiu nesta máquina. A porta `3000`, exigida por `apps/web/playwright.config.ts`, está ocupada por outro projeto (`personal-finance-app`); o Playwright reutilizou esse servidor e ficou bloqueado. Não foi interrompido nenhum processo do usuário. Para validar, liberar a porta 3000 ou tornar a porta do Playwright configurável e executar `pnpm --filter web test:e2e`.

## Estado confirmado

- Stack planejada: web Next.js 16 na Vercel, API Hono/Node 24 no Render e PostgreSQL no Neon.
- O repositório contém `render.yaml`, `apps/api/Dockerfile`, migrations Drizzle e proxy web `/api/*` para a API.
- A publicação existe e está acessível em `https://motusfit-web.vercel.app`; o cadastro público abre em `/signup`.
- Infraestrutura confirmada: projeto `motusfit` no Neon (São Paulo), API `motusfit-api` no Render e projeto `motusfit-web` na Vercel.
- O health check público funciona tanto diretamente no Render quanto através do proxy da Vercel (`/api/v1/health`, HTTP 200).
- Validação autenticada em produção concluída com uma conta de teste descartável: cadastro, login, criação de rotina/exercício, duas séries (10×60 kg e 8×65 kg), conclusão, histórico e estatísticas persistiram no Neon. O histórico e as estatísticas confirmaram 2 séries, 1.120 kg e 1 sessão concluída.
- O Render acompanhava a branch `main`, enquanto a Vercel acompanhava `master`. As branches foram alinhadas em `179a35f` para evitar novos deploys defasados.
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

1. Testar o fluxo no celular e, se desejado, adicionar `https://motusfit-web.vercel.app` à tela inicial.
2. Opcional: apagar os dados de teste de produção. Há uma rotina concluída válida de teste e uma sessão vazia “Em andamento”, originada pela retomada do navegador; não remover sem confirmação explícita do usuário.

## Cuidados

- Antes de continuar em outro dispositivo, executar `git pull --ff-only` e ler este arquivo.
- Não sobrescrever mudanças locais existentes sem inspecionar `git status` e o diff.
- Nunca registrar segredos ou connection strings neste arquivo.

## Verificação desta sessão

- Validação realizada: inspeção de `docs/deployment.md`, `render.yaml`, remotes Git e estado do checkout.
- Resultado: deploy planejado para Vercel (web), Render (API) e Neon (PostgreSQL), mas não há evidência de URL ou publicação ativa. Nenhuma configuração de hosting foi alterada.
- Próxima ação recomendada: concluir a correção de autenticação e então realizar os passos de deploy documentados; após isso, registrar as URLs públicas (sem segredos) neste arquivo.

## Orientação da retomada

- A correção de autenticação está publicada na Vercel: `https://motusfit-web.vercel.app/signup` exibe o formulário de cadastro.
- Nenhum segredo foi revelado ou alterado. Há somente a alteração local do usuário em `apps/api/package.json`.
- Verificação de UI: o projeto não usa shadcn/ui. Há componentes próprios em `apps/web/src/components/ui.tsx` (`Card`, `PageHeader`, `SectionHeader`, `Metric` e `StatusPill`), estilizados por classes `mf-*`; não há dependências ou configuração do shadcn/Radix.
- Decisão de arquitetura: shadcn/ui pode substituir os componentes da aplicação web Next.js (`apps/web`) e manter boa experiência no navegador/celular como PWA. Não é compatível diretamente com o app Expo/React Native em `apps/mobile`; uma futura UI nativa deve usar componentes próprios React Native ou uma biblioteca nativa equivalente.
