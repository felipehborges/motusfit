# 0008 — Billing premium com Stripe via plugin do Better Auth

- Status: aceito
- Data: 2026-07-18

## Contexto

O produto precisa de um caminho para monetização (Fase 7 do [roadmap](../roadmap.md)) sem comprometer o MVP gratuito. Requisitos: cobrança recorrente (assinatura mensal/anual), gating de features por plano, e o mínimo de superfície de PCI/compliance construída por nós — nenhum dado de cartão deve tocar nosso backend.

## Decisão

- **Stripe** como processador de pagamento (Checkout + Billing Portal hospedados — nenhum campo de cartão em nossa UI).
- **`@better-auth/stripe`** como plugin de integração, já que a autenticação é Better Auth ([ADR 0004](0004-auth.md)). O plugin:
  - cria e gerencia a tabela `subscription` (linkada por `referenceId` = `user.id`) via o mesmo adapter Drizzle já configurado;
  - expõe endpoints (`/api/auth/subscription/*`) para criar Checkout Session, redirecionar ao Billing Portal e processar webhooks;
  - mantém o Stripe como fonte da verdade de cobrança — nosso banco só espelha `status`/`plan` via webhook.
- **Entitlements**: um único campo derivado `plan: 'free' | 'premium'` (calculado a partir de `subscription.status`), consumido por um helper (`packages/auth`) que os handlers da API chamam para gating. Sem tabela de features/flags no MVP de premium — YAGNI até existir a primeira feature paga.
- **Segredos**: `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` são variáveis de ambiente obrigatórias apenas quando o billing está habilitado (`BILLING_ENABLED=true`); ausentes em dev, o app roda normalmente com todo mundo em `free`.

## Alternativas consideradas

- **Implementar billing do zero (Stripe SDK direto, sem plugin)** — mais controle, mas reimplementa parsing de webhook, criação de customer, sincronização de status — exatamente o que o plugin já testa e mantém. Rejeitado por YAGNI.
- **Paddle/LemonSqueezy (merchant of record)** — cuidam de imposto/compliance internacional, mas Stripe é o padrão de mercado com melhor suporte a testes e ecossistema; reavaliar se/quando o produto vender internacionalmente com complexidade fiscal real.
- **Tabela de planos/features rica desde já** — adiado: a Fase 7.3 (primeira feature premium) ainda não foi definida por dados de uso; construir o motor de flags antes de saber a feature é overengineering.

## Consequências

- (+) Nenhum dado de cartão passa pelo nosso backend (Checkout hospedado); menor superfície de compliance.
- (+) Reaproveita 100% da infra de auth existente (adapter Drizzle, contexto de sessão nos handlers oRPC).
- (+) Dev local funciona sem chaves Stripe — billing é opt-in via env.
- (−) Acoplamento ao Better Auth para billing: trocar de provedor de auth exigiria também revisar billing (aceitável, ambos são decisões já tomadas juntas).
- (−) Nova dependência externa (`stripe` SDK + `@better-auth/stripe`), versão pinada e testada como todo o resto do stack.
