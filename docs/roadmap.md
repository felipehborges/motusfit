# Roadmap — MotusFit

Fases sequenciais; dentro de cada fase, tarefas pequenas e independentes (1 tarefa ≈ 1 commit). Uma feature só começa com a anterior "done" ([contributing.md](contributing.md)).

## Fase 1 — Infraestrutura ✅ quando: monorepo builda, testa e linta no CI

1.1 Monorepo pnpm + Turborepo (workspaces, catalogs, turbo.json)
1.2 `packages/config` (tsconfig base) + TypeScript strict em tudo
1.3 Biome (lint+format raiz) e scripts `check`
1.4 Vitest raiz + primeiro teste em `packages/core`
1.5 lefthook + commitlint (Conventional Commits)
1.6 `.env.example` + validação de env com Zod
1.7 GitHub Actions CI (lint/typecheck/test/build --affected)
1.8 Dockerfile da API (build em CI; dev local sem Docker)
1.9 Esqueletos: `apps/api` (Hono hello + healthcheck), `apps/web` (Next), `apps/mobile` (Expo)
1.10 `packages/db` (Drizzle + PGlite factory + primeira migration vazia)

## Fase 2 — Autenticação ✅ quando: signup/login/logout funcionam em web e mobile

2.1 `packages/auth` (Better Auth + adapter Drizzle; tabelas via migration)
2.2 Rotas `/api/auth/*` na API + middleware de sessão no oRPC
2.3 `user_profiles` (perfil: nome, peso, timezone) + contrato `identity.profile.*`
2.4 Web: telas signup/login/logout + guarda de rotas
2.5 Mobile: plugin Expo + telas de auth + SecureStore
2.6 Testes: fluxo de auth (integração) + escopo por usuário

## Fase 3 — Nutrição

3.1 Contratos `nutrition.*` + migration (foods, diary_entries, goals, favorites)
3.2 `core`: cálculo de macros/totais do dia (+ testes de borda)
3.3 API: CRUD foods (busca por nome)
3.4 API: diário (entradas por dia/slot) + totais
3.5 API: metas diárias (vigência)
3.6 API: favoritos + recentes
3.7 Web: busca/cadastro de alimentos
3.8 Web: diário do dia (entradas, totais × meta)
3.9 Mobile: idem 3.7–3.8
3.10 E2E web: registrar refeição

## Fase 4 — Treinos

4.1 Contratos `workout.*` + migration (exercises, routines, sessions, sets)
4.2 `core`: volume, kcal estimada (MET), semana ISO (+ testes)
4.3 API: exercícios (catálogo seed + custom)
4.4 API: rotinas (CRUD + ordenação)
4.5 API: sessões (iniciar de rotina/livre, registrar sets, concluir; `clientId` idempotente)
4.6 API: histórico + detalhe de sessão
4.7 Web: rotinas + execução de treino (sugestão da última sessão, timer de descanso)
4.8 Web: histórico
4.9 Mobile: idem 4.7–4.8
4.10 E2E web: executar treino

## Fase 5 — Dashboard

5.1 Contrato `stats.today` (kcal consumidas × meta − gasto estimado; macros; treino do dia)
5.2 API: agregação do dia
5.3 Web + Mobile: tela de dashboard (home)
5.4 Deploy de produção (ADR de hosting; ativar pipeline)

## Fase 6 — Estatísticas

6.1 Contrato `stats.weekly` (sessões, volume total, séries por grupo muscular, kcal)
6.2 API: agregação semanal (semana ISO, fuso do usuário)
6.3 Web + Mobile: tela de estatísticas semanais
6.4 Gráficos simples (kcal/dia da semana, volume/semana)

## Fase 7 — Premium (pós-MVP)

7.1 ADR billing + plugin Stripe do Better Auth
7.2 Entitlements (`plan` no user; gating por contrato)
7.3 Primeira feature premium (a definir com dados de uso)

## Backlog futuro (sem fase)

Gráficos avançados · progresso corporal + fotos · notificações · Apple Health / Health Connect · wearables · IA · comunidade · offline-first completo · base pública de alimentos (Open Food Facts/TACO) · unidades imperiais.
