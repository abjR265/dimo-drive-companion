import { createTRPCReact } from '@trpc/react-query';
import { createTRPCProxyClient, httpBatchLink, loggerLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '../server/routers/_app';

// React Query integration
export const trpc = createTRPCReact<AppRouter>();

// Vanilla client for server-side usage
export const trpcClient = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === 'development' ||
        (opts.direction === 'down' && opts.result instanceof Error),
    }),
    httpBatchLink({
      url: '/api/trpc',
      headers() {
        return {
          'Content-Type': 'application/json',
        };
      },
    }),
  ],
});

// tRPC client configuration for React Query
export const trpcClientConfig = {
  transformer: superjson,
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === 'development' ||
        (opts.direction === 'down' && opts.result instanceof Error),
    }),
    httpBatchLink({
      url: '/api/trpc',
      headers() {
        return {
          'Content-Type': 'application/json',
        };
      },
    }),
  ],
}; 