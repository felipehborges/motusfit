'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

function isUnauthorized(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: unknown; status?: unknown };
  return candidate.code === 'UNAUTHORIZED' || candidate.status === 401;
}

function redirectExpiredSession(error: unknown) {
  if (
    isUnauthorized(error) &&
    typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/app')
  ) {
    window.location.assign('/login?reason=session-expired');
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: redirectExpiredSession }),
        mutationCache: new MutationCache({ onError: redirectExpiredSession }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => !isUnauthorized(error) && failureCount < 1,
          },
        },
      }),
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
