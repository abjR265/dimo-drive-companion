import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { type Context } from './context';

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error &&
          error.cause.name === 'ZodError'
            ? error.cause.issues
            : null,
      },
    };
  },
});

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  // For now, we'll allow all requests
  // TODO: Add proper DIMO authentication check
  if (!ctx.userId && ctx.environment === 'production') {
    // In production, require authentication
    // For now, we'll log a warning instead of throwing
    console.warn('Protected procedure accessed without authentication');
  }
  
  return next({
    ctx: {
      ...ctx,
      // Add authenticated user context
    },
  });
});

// Middleware for AI operations that might take longer
export const aiProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const start = Date.now();
  
  const result = await next({
    ctx: {
      ...ctx,
      // Add AI-specific context
      aiStartTime: start,
    },
  });
  
  const duration = Date.now() - start;
  console.log(`AI procedure completed in ${duration}ms`);
  
  return result;
}); 