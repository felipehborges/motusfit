# Diretrizes de API — MotusFit

A API é **contract-first**: todo endpoint nasce como procedimento oRPC em `packages/contracts` (input/output Zod). O OpenAPI 3.1 e a documentação (Scalar em `/api/v1/docs`) são gerados do contrato.

## Estrutura

- Base path: `/api/v1` (oRPC) e `/api/auth/*` (Better Auth).
- Procedimentos nomeados por contexto e ação: `nutrition.foods.create`, `nutrition.diary.listByDay`, `workout.sessions.finish`, `stats.weekly.get`.
- Na projeção OpenAPI, oRPC mapeia para rotas REST-like (`method` + `path` definidos no contrato): `POST /v1/nutrition/foods`, `GET /v1/nutrition/diary/{date}` etc. Verbos e status codes seguem semântica HTTP normal.

## Regras de contrato

1. **Todo input e output tem schema Zod** — nada de `z.any()`; campos de dinheiro/medidas com `.positive()`/`.nonnegative()` explícitos.
2. **Outputs não vazam o banco**: schemas de resposta são definidos no contrato, não inferidos do Drizzle. Campos internos (ex.: `owner_id`) não saem sem decisão consciente.
3. **Paginação**: cursor-based (`cursor` + `limit ≤ 100`) em toda listagem potencialmente crescente (histórico, diário não — é por dia).
4. **Datas**: dias como `YYYY-MM-DD` (string, fuso do usuário); instantes como ISO-8601 UTC.
5. **Compatibilidade em `v1`**: permitido adicionar campos opcionais e novos procedimentos; proibido remover/renomear/mudar tipo. Breaking → `/api/v2` + ADR.
6. **Erros**: formato único
   ```json
   { "code": "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN" | "VALIDATION" | "CONFLICT" | "INTERNAL", "message": "...", "details"?: { ... } }
   ```
   Erros de domínio (exceções tipadas de `core`/use cases) são mapeados no middleware — handlers não montam erro HTTP manualmente. Mensagens nunca expõem internals.
7. **Autorização**: procedimentos são autenticados por padrão (middleware injeta `user`); todo acesso a recurso filtra por `user_id` **no repository** (nunca confiar em ID vindo do cliente sem escopo do dono).
8. **Idempotência**: mutações de criação em fluxo offline-prone (sets, diary entries) aceitam `clientId` (UUID gerado no cliente) com unique constraint — retry seguro.

## Fluxo para criar um endpoint

1. Definir/estender o procedimento em `packages/contracts` (schema + method/path OpenAPI).
2. Implementar use case + repository na API; testes.
3. Cliente ganha o método tipado automaticamente via `packages/api-client` (helpers TanStack Query).
4. Docs OpenAPI atualizam sozinhas.
