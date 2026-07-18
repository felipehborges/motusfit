# Contribuindo — MotusFit

## Setup

```bash
# Pré-requisitos: Node ≥ 24, pnpm ≥ 10 (corepack enable)
pnpm install          # instala tudo + registra hooks (lefthook)
pnpm dev              # sobe api + web (mobile: pnpm --filter mobile dev)
pnpm test             # turbo run test
pnpm check            # lint + typecheck
```

Sem Docker necessário em dev: o banco local é PGlite (arquivo em `.data/`). Para usar Postgres real, defina `DATABASE_URL` no `.env`.

## Fluxo de trabalho (Spec Driven)

1. **Spec primeiro**: a feature deve existir em [product.md](product.md)/[roadmap.md](roadmap.md). Se não existe, documente antes.
2. **Decisão arquitetural nova → ADR antes do código** (`docs/adr/NNNN-titulo.md`, template abaixo).
3. Contrato (`packages/contracts`) → domínio (`packages/core` se houver regra) → API (use case/repository/handler + testes) → UI.
4. Um commit por unidade concluída, Conventional Commits (`feat(api): ...`). O hook valida formato, lint e tipos.

## Definition of Done

- [ ] Testes da feature passando (`pnpm test`)
- [ ] `pnpm check` limpo (Biome + tsc)
- [ ] Documentação atualizada se comportamento/arquitetura mudou
- [ ] Teste de autorização (usuário B não acessa recurso de A) para todo recurso novo
- [ ] Commit Conventional Commits

## ADR — template

```markdown
# NNNN — Título

- Status: aceito | substituído por NNNN
- Data: AAAA-MM-DD

## Contexto
## Decisão
## Alternativas consideradas
## Consequências
```

ADRs são imutáveis: mudou a decisão, escreve-se um novo que substitui o antigo.
