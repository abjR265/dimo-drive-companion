import { inferAsyncReturnType } from '@trpc/server';

/**
 * Creates context for tRPC
 * This context is available in all procedures
 */
export async function createContext() {
  return {
    // Add user authentication context here when available
    userId: null, // Will be populated from DIMO auth
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE || 'development',
  };
}

export type Context = inferAsyncReturnType<typeof createContext>; 