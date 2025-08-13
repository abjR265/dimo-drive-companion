import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import AIChat from "./pages/AIChat";
import { AIChatEnhanced } from "./components/AIChatEnhanced";
import { DocumentIntelligence } from "./components/DocumentIntelligence";
import AuthLogin from "./pages/AuthLogin";
import NotFound from "./pages/NotFound";
import { AppLayout } from "./components/layout/AppLayout";
import { useEffect, useState } from 'react';
import { initializeDimoSDK, DimoAuthProvider } from '@dimo-network/login-with-dimo';
import { trpc, trpcClientConfig } from '@/lib/trpc';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

const App = () => {
  const [trpcClient] = useState(() => trpc.createClient(trpcClientConfig));

  useEffect(() => {
    console.log('Environment variables:', {
      clientId: import.meta.env.VITE_DIMO_CLIENT_ID,
      redirectUri: import.meta.env.VITE_DIMO_REDIRECT_URI,
      apiKey: import.meta.env.VITE_DIMO_API_KEY ? 'SET' : 'NOT SET',
      n8nWebhook: import.meta.env.VITE_N8N_WEBHOOK_URL ? 'SET' : 'NOT SET'
    });
    
    initializeDimoSDK({
      clientId: import.meta.env.VITE_DIMO_CLIENT_ID || '',
      redirectUri: import.meta.env.VITE_DIMO_REDIRECT_URI || '',
      apiKey: import.meta.env.VITE_DIMO_API_KEY || '',
    });
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <DimoAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/auth/login" element={<AuthLogin />} />
                {/* Protected Routes with Layout */}
                <Route path="/" element={<AppLayout />}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="vehicles" element={<Dashboard />} />
                  <Route path="ai-chat" element={<AIChatEnhanced />} />
                  <Route path="insights" element={<Dashboard />} />
                  <Route path="documents" element={<DocumentIntelligence />} />
                  <Route path="charging" element={<Dashboard />} />
                  <Route path="settings" element={<Dashboard />} />
                </Route>
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </DimoAuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
};

export default App;
