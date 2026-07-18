# Padrões de Código — MotusFit

Lint e formatação são automatizados (**Biome** — config única na raiz). Este documento cobre o que a ferramenta não impõe.

## TypeScript

- `strict: true` sempre; adicionalmente `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes` no tsconfig base.
- **Proibido** `any` (usar `unknown` + narrowing) e `as` para "fazer compilar" (cast só com comentário justificando a invariante).
- Tipos de dados da API vêm **sempre** de `packages/contracts` (inferidos do Zod) — nunca redeclarar shapes manualmente.
- Preferir `type` a `interface` (exceto declaração merging); união discriminada em vez de enums (`type MealSlot = 'breakfast' | ...`).
- Funções exportadas de `packages/core` são **puras** e com tipos explícitos de retorno.

## Organização

- Feature-based (ver [folder-structure.md](folder-structure.md)); arquivo > 300 linhas é sinal de quebra.
- Nomes: arquivos `kebab-case.ts`; componentes React `PascalCase.tsx`; sufixos `.usecase.ts`, `.repository.ts`, `.handler.ts` na API.
- Barrel files (`index.ts`) só na raiz de cada pacote/módulo — não em cada pasta.
- Imports entre camadas seguem a direção definida em [architecture.md](architecture.md); import de app para app é proibido.

## Regras de negócio

- Cálculo/regra de domínio vive em `packages/core`, nunca inline em componente ou handler.
- Use cases não conhecem HTTP; handlers não conhecem SQL.
- Erros de domínio: classes dedicadas (`FoodNotFoundError`) mapeadas para o formato de erro da API no middleware.

## React (web e mobile)

- Componentes de função; hooks para lógica; sem classe.
- Server state só via TanStack Query (nada de `useEffect + fetch`); client state efêmero em `useState`, compartilhado em Zustand (stores pequenos, por feature).
- Formulários: React Hook Form + resolver Zod usando o **mesmo schema do contrato** (ou refinamento dele).
- Acessibilidade: labels em inputs, roles corretos; Biome a11y ligado.

## Comentários e docs

- Comentário explica **por quê** (invariante, trade-off), nunca o quê.
- Todo pacote tem `README.md` curto (propósito + exemplo de uso).
- Decisão arquitetural nova → ADR **antes** do código ([contributing.md](contributing.md)).

## Commits

Conventional Commits, escopo = pacote/app: `feat(api): ...`, `fix(mobile): ...`, `docs: ...`, `chore(repo): ...`. Validado por commitlint no hook `commit-msg`. Um commit por feature concluída (testes + tipos + lint passando).
