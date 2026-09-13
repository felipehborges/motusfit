# MotusFit — handoff entre dispositivos

Atualizado em: 2026-09-13 13:19 UTC
Dispositivo: não identificado nesta sessão (Windows)
Branch: `main`, baseada no commit `5c6e14e`; a antiga `master` permanece nesse commit.
Sincronização: commit funcional `fbb5da3` enviado com sucesso a `origin/main`. O workflow ainda apontava para `master`; a correção para `main` está preparada para um segundo commit/push. As alterações visuais pré-existentes em `apps/web/src/app/globals.css` e `apps/web/src/features/dashboard/today-card.tsx` permanecem locais e fora do escopo funcional.

## Objetivo atual

Adotar `main` como branch canônica; reativar e endurecer backend/banco; proteger a área autenticada; melhorar persistência da sessão de treino; automatizar o catálogo; orientar configuração de Render, Vercel, Neon e inspeção de usuários.

## Implementado

- Checkout local alinhado em `main`; `origin/main` era ancestral direto, portanto o alinhamento é fast-forward.
- GitHub Actions foi corrigido para executar em pushes na `main`.
- `render.yaml` fixa `branch: main`. Ainda é necessário selecionar `main` como default branch no GitHub e Production Branch na Vercel pelo dashboard.
- Backend real é padrão; demo só ativa com `NEXT_PUBLIC_DEMO_MODE=true`.
- Produção recusa inicialização sem `DATABASE_URL` e com `AUTH_ENABLED=false`.
- Health/readiness executa consulta no banco.
- Área `/app` consulta sessão antes de renderizar, redireciona visitante para login, trata 401 global como sessão expirada e oferece logout. O topo usa nome/iniciais reais.
- Sets mostram `Salvando…`, `Salvo` ou erro com retry. Retry mantém o mesmo `clientId`, inclusive nas tentativas automáticas.
- Descanso usa o `restSeconds` da rotina, guarda o instante final no `localStorage` e continua após reload/suspensão.
- Nova tabela `session_exercises` congela a prescrição no início da sessão e representa exercícios avulsos sem set âncora. Migração retroativa copia prescrições e exercícios presentes em sets antigos.
- Endpoint `POST /workout/sessions/{sessionId}/exercises` adiciona exercício avulso; clientes antigos que enviam diretamente um set continuam compatíveis.
- Migration `0005_seed_catalog` instala idempotentemente os 60 exercícios em qualquer banco novo ou existente; seed manual continua idempotente, mas não é mais obrigatório no deploy.
- Banco PGlite local atual está migrado e contém apenas seis contas E2E geradas pelas validações. A base anterior permanece preservada em `apps/api/.data/motusfit-backup-20260912-1930`.

## Arquivos funcionais principais

- Auth/web: `apps/web/src/components/app-shell.tsx`, `apps/web/src/lib/providers.tsx`, `apps/web/src/features/auth/auth-form.tsx`, páginas/layout, `backend.css` e E2E.
- Treino: contrato compartilhado, router/repository/testes da API e `session-view.tsx`.
- Banco: schema de workout, migrations `0004`/`0005`, journal/snapshots e documentação.
- Runtime/deploy: `.env.example`, `apps/api/package.json`, validação env, health, `render.yaml` e docs.

## Validações concluídas

- `pnpm --filter @motusfit/api test`: 34/34 testes passaram em 6 arquivos.
- `pnpm typecheck`: 9/9 tarefas passaram, incluindo web, mobile, API, contratos e DB.
- `pnpm --filter web build`: passou com Next.js 16.2.10.
- `pnpm --filter web test:e2e`: 2 fluxos críticos passaram; 1 nutrição ignorado por escopo. O fluxo cobre auth, treino, descanso de 120 s persistido após reload, idempotência observável, conclusão, histórico, logout e bloqueio de `/app`.
- `pnpm --filter @motusfit/core test`: 14/14 passaram.
- Biome passou nos arquivos funcionais alterados; `git diff --check` passou.
- `drizzle-kit check`: schema/migrations consistentes.
- `pnpm db:seed`: confirmou catálogo completo com 60 exercícios, sem duplicar.

## Usuários e produção

- Não foi possível listar usuários do Neon porque `DATABASE_URL` de produção não está disponível neste checkout. Não inferir que as seis contas locais existem em produção.
- Para ver contas: Neon Console → projeto MotusFit → Tables → tabela `users`; ou SQL Editor com `SELECT id, name, email, email_verified, created_at FROM users ORDER BY created_at DESC;`. Não consultar/copiar a coluna `accounts.password`; ela contém hash, não senha recuperável.
- Criar usuário de teste pela tela `/signup` depois do deploy. Nunca registrar a senha neste handoff.
- Render: serviço `motusfit-api` → Settings/Build & Deploy, branch `main`; Environment deve conter `DATABASE_URL`, `BETTER_AUTH_URL`, `CORS_ORIGINS` e segredo de auth.
- Vercel: projeto `motusfit-web` → Settings → Environments → Production → Branch Tracking = `main`; Environment Variables deve conter `API_URL`; `NEXT_PUBLIC_DEMO_MODE` deve estar ausente ou `false`.
- GitHub: repository Settings → Branches/Default branch → `main` após `origin/main` receber o commit.

## Pendências após publicação

1. Alterar default/production branch nos dashboards de GitHub e Vercel; confirmar Render em `main`.
2. Aguardar deploys e validar health direto/proxy.
3. Criar conta de teste em produção e executar signup → rotina → treino → reload → concluir → histórico/estatísticas → logout/login.
4. Consultar `users` no Neon e confirmar a conta; testar isolamento com uma segunda conta.
5. Decidir se as alterações visuais locais devem ser commitadas separadamente.
6. Antes de convidar amigos, configurar backup periódico e uma mensagem simples de beta/privacidade.

## Cuidados duráveis

- Usar `pc-integration` no início/fim de toda tarefa.
- Não registrar secrets, cookies, connection strings ou senhas.
- Não remover a base PGlite de backup sem confirmação explícita.
- Nutrição/billing seguem desativados; mobile continua secundário ao web.
