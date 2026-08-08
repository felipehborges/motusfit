import { stripe } from '@better-auth/stripe';
import Stripe from 'stripe';

export type BillingOptions = {
  secretKey: string;
  webhookSecret: string;
  premiumMonthlyPriceId: string;
};

/** Nome do único plano pago do MVP (ADR 0008). Mais planos entram quando a Fase 7.3 definir a feature. */
export const PREMIUM_PLAN_NAME = 'premium';

/**
 * Plugin Stripe do Better Auth (ADR 0008). Mantém a tabela `subscription`
 * (linkada por referenceId = user.id) sincronizada via webhook — Stripe é a
 * fonte da verdade de cobrança, nosso banco só espelha o status.
 */
export function createBillingPlugin(options: BillingOptions) {
  const stripeClient = new Stripe(options.secretKey);

  return stripe({
    stripeClient,
    stripeWebhookSecret: options.webhookSecret,
    createCustomerOnSignUp: true,
    subscription: {
      enabled: true,
      plans: [{ name: PREMIUM_PLAN_NAME, priceId: options.premiumMonthlyPriceId }],
    },
  });
}
