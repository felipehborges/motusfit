import { createApiClient, createApiQueryUtils } from '@motusfit/api-client';

export const apiClient = createApiClient({
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
});

/** Utils TanStack Query tipados por procedimento do contrato. */
export const api = createApiQueryUtils(apiClient);
