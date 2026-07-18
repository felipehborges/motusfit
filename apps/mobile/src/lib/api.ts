import { createApiClient, createApiQueryUtils } from '@motusfit/api-client';
import { authClient } from './auth-client';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export const apiClient = createApiClient({
  apiUrl,
  // No mobile a sessão vive no SecureStore; o plugin Expo expõe o cookie
  headers: () => ({ cookie: authClient.getCookie() }),
});

export const api = createApiQueryUtils(apiClient);
