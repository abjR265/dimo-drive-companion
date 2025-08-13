import { router } from '../trpc';
import { aiRouter } from './ai';
import { dimoMcpRouter } from './dimoMcp';
import { aiMcpRouter } from './aiMcp';

/**
 * Main app router combining all sub-routers
 * This router type is used for tRPC client type inference
 */
export const appRouter = router({
  ai: aiRouter,
  dimoMcp: dimoMcpRouter,
  aiMcp: aiMcpRouter,
  // Future routers can be added here:
  // vehicles: vehiclesRouter,
  // users: usersRouter,
  // analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter; 