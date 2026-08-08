import { oc } from '@orpc/contract';
import { z } from 'zod';

export const profileSchema = z.object({
  displayName: z.string().min(1).max(100),
  bodyWeightKg: z.number().positive().max(500).nullable(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'esperado YYYY-MM-DD')
    .nullable(),
  timezone: z.string().min(1).max(64),
  unitSystem: z.enum(['metric', 'imperial']),
});

export type Profile = z.infer<typeof profileSchema>;

export const profileInputSchema = profileSchema.partial().extend({
  displayName: z.string().min(1).max(100),
});

// Billing (ADR 0008): checkout/portal são chamados direto no cliente Better
// Auth (plugin stripe-client) — aqui expomos só a leitura do entitlement,
// fonte única usada tanto pela UI (mostrar badge/CTA) quanto pelo gating
// de procedimentos premium no backend.
export const planSchema = z.enum(['free', 'premium']);
export type Plan = z.infer<typeof planSchema>;

export const billingPlanSchema = z.object({ plan: planSchema });

export const identityContract = {
  profile: {
    get: oc
      .route({ method: 'GET', path: '/identity/profile', tags: ['identity'] })
      .output(profileSchema.nullable()),
    upsert: oc
      .route({ method: 'PUT', path: '/identity/profile', tags: ['identity'] })
      .input(profileInputSchema)
      .output(profileSchema),
  },
  billing: {
    getPlan: oc
      .route({ method: 'GET', path: '/identity/billing/plan', tags: ['identity'] })
      .output(billingPlanSchema),
  },
};
