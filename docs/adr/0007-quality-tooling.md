# 0007 — Qualidade: Biome, Vitest+Playwright, lefthook, CI

- Status: aceito
- Data: 2026-07-18

## Contexto

Monorepo com muitos pacotes exige lint/format/test rápidos, hooks de git com escopo por pacote e CI que só processa o que mudou.

## Decisão

- **Biome 2.5** como linter + formatter único (config raiz `biome.json`), substituindo ESLint+Prettier.
- **Vitest 4** (unit/integração/component via Browser Mode) + **Playwright** (e2e web).
- **lefthook** para git hooks: `pre-commit` (Biome nos staged + typecheck dos pacotes afetados), `commit-msg` (**commitlint** com `@commitlint/config-conventional`).
- **GitHub Actions**: `pnpm install --frozen-lockfile` → `turbo run lint typecheck test build --affected`; e2e em job separado condicionado.

## Alternativas consideradas

- **ESLint 9 + Prettier** — ecossistema maior de plugins, porém ordens de magnitude mais lento no monorepo e duas ferramentas para manter. Gap aceito no Biome: ordenação de classes Tailwind é parcial (`useSortedClasses` não executa config custom).
- **Husky + lint-staged** — pedido inicialmente; **lefthook** cumpre exatamente o mesmo papel com execução paralela, um YAML único e escopo por glob/pacote nativo (sem shell glue). Registrada aqui a divergência consciente do briefing.
- **Jest** — legado; Vitest é o padrão 2026 e compartilha config com Vite.
- **changesets** — adiado: nada é publicado no npm; revisitar se pacotes forem publicados.

## Consequências

- (+) Lint+format do repo inteiro em segundos; um config; hooks rápidos que ninguém desliga; CI proporcional ao diff.
- (−) Plugin exclusivo de ESLint que venha a ser necessário exigiria camada fina de ESLint ao lado do Biome.
- (−) Turborepo remote cache fica desativado até haver time/necessidade (secrets a configurar).
