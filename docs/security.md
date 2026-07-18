# Segurança — MotusFit

## Autenticação e sessão

- **Better Auth** self-hosted na API (`/api/auth/*`), tabelas no nosso Postgres.
- Web: cookie de sessão `HttpOnly`, `Secure`, `SameSite=Lax`.
- Mobile: plugin Expo do Better Auth (token em SecureStore; nunca AsyncStorage).
- Senhas: hash padrão do Better Auth (scrypt); política mínima de 8 caracteres, validada no contrato Zod.
- E-mail de verificação e reset de senha: previstos na Fase 2 (provider de e-mail configurável; em dev, log no console).
- 2FA/passkeys: plugins do Better Auth, pós-MVP.

## Autorização

- Todo procedimento oRPC é **autenticado por padrão**; público é exceção anotada no contrato.
- Escopo por dono: repositories filtram por `user_id` em toda query — a regra é estrutural, não por endpoint. Teste de integração padrão: usuário B não lê/edita recurso do usuário A (obrigatório em toda feature com recurso).
- Não há papéis/admin no MVP; quando existir, será claim explícita, não flag no cliente.

## Dados e entrada

- Validação de entrada 100% via Zod no contrato (limites de tamanho em strings, `positive()` em números) — nada chega ao use case sem validar.
- SQL: exclusivamente via Drizzle (parametrizado). SQL bruto só em repository, com `sql` template tag.
- Segredos: apenas variáveis de ambiente (`.env` local **não commitado**; `.env.example` documentado). Validação das envs com Zod no bootstrap (`apps/api/src/env.ts`) — app não sobe com env inválida.
- PII mínima: e-mail, nome, peso corporal. Sem dados de saúde sensíveis no MVP; quando integrações de saúde chegarem, novo review de privacidade + ADR (LGPD).
- Logs nunca contêm senha, token ou corpo de requisição de auth.

## Transporte e cabeçalhos

- HTTPS obrigatório em produção (TLS no edge/load balancer).
- CORS: allowlist explícita de origens (web app); mobile não usa CORS.
- Rate limiting: middleware na API para rotas de auth (login/signup) desde o MVP; global pós-MVP conforme tráfego.
- Cabeçalhos de segurança no web (Next.js headers): CSP básica, `X-Content-Type-Options`, `Referrer-Policy`.

## Supply chain

- Versões centralizadas (pnpm catalogs) + `pnpm-lock.yaml` commitado; `pnpm audit` no CI (não bloqueante, reportado).
- Dependabot/Renovate: habilitar Renovate após o setup inicial.
- CI com permissões mínimas (`permissions: contents: read` default).
