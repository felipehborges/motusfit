# @motusfit/auth

Configuração do Better Auth (ADR 0004): adapter Drizzle no Postgres do projeto, e-mail+senha no MVP. A API monta `auth.handler` em `/api/auth/*`; clientes usam `better-auth/client` (web) e o plugin Expo (mobile).
