import { createAuthClient } from 'better-auth/react';

// Sem baseURL: o client do Better Auth usa window.location.origin sozinho no
// navegador (getBaseURL em better-auth/utils/url), então fica same-origin e
// passa pelo proxy de next.config.ts — cookie de sessão first-party.
// Passar '/api/auth' explicitamente quebra: ele faz `new URL(baseURL)` em
// valores explícitos, e um path relativo não é uma URL válida sozinho.
export const authClient = createAuthClient({});

export const { signIn, signUp, signOut, useSession } = authClient;
