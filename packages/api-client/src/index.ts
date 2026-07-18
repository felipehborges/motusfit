import { type Contract, contract } from '@motusfit/contracts';
import { createORPCClient } from '@orpc/client';
import type { ContractRouterClient } from '@orpc/contract';
import { OpenAPILink } from '@orpc/openapi-client/fetch';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';

export type ApiClient = ContractRouterClient<Contract>;

export type CreateApiClientOptions = {
  /** URL base da API (ex.: http://localhost:3001). */
  apiUrl: string;
  /** Headers extras por request (ex.: cookie de sessão no mobile). */
  headers?: (() => Record<string, string> | Promise<Record<string, string>>) | undefined;
  fetch?: typeof fetch | undefined;
};

/** Cliente tipado da API v1, derivado do contrato — sem geração de código. */
export function createApiClient(options: CreateApiClientOptions): ApiClient {
  const link = new OpenAPILink(contract, {
    url: `${options.apiUrl}/api/v1`,
    ...(options.headers !== undefined && { headers: options.headers }),
    fetch: (request, init) =>
      (options.fetch ?? globalThis.fetch)(request, { ...init, credentials: 'include' }),
  });
  return createORPCClient(link);
}

/** Utils TanStack Query (queryOptions/mutationOptions por procedimento). */
export function createApiQueryUtils(client: ApiClient) {
  return createTanstackQueryUtils(client);
}
