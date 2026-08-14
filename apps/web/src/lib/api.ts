import { createApiClient, createApiQueryUtils } from '@motusfit/api-client';

// @orpc/openapi-client faz `new URL(baseUrl)` internamente — precisa de URL
// absoluta, string vazia/relativa quebra. window.location.origin dá o mesmo
// domínio do web em qualquer ambiente (dev, prod, preview da Vercel), que
// proxeia pra API via rewrite (next.config.ts) — cookie de sessão first-party.
// Fallback só é usado durante SSR (nunca faz request real nesse momento).
const apiUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';

export const apiClient = createApiClient({ apiUrl });

/** Utils TanStack Query tipados por procedimento do contrato. */
export const api = createApiQueryUtils(apiClient);
