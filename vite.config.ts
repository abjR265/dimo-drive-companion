import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Connect } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
    },
    // Add custom middleware for DIMO attestation
    setupMiddlewares: (middlewares: Connect.HandleFunction[], devServer: any) => {
      // Add custom middleware before other middlewares
      devServer.middlewares.use('/api/dimo-attestation', async (req: any, res: any, next: any) => {
        if (req.method === 'POST') {
          try {
            console.log('DIMO attestation proxy request received');
            
            // Read the request body
            let body = '';
            req.on('data', (chunk: any) => {
              body += chunk.toString();
            });
            
            req.on('end', async () => {
              try {
                const { payload, jwt } = JSON.parse(body);
                
                // Forward the request to DIMO
                const dimoResponse = await fetch('https://attest.dimo.zone/', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`
                  },
                  body: JSON.stringify(payload)
                });
                
                const responseText = await dimoResponse.text();
                
                // Set CORS headers
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                
                res.status(dimoResponse.status).send(responseText);
              } catch (error) {
                console.error('Error in DIMO attestation proxy:', error);
                res.status(500).json({ error: 'Proxy error' });
              }
            });
          } catch (error) {
            console.error('Error in DIMO attestation middleware:', error);
            res.status(500).json({ error: 'Middleware error' });
          }
        } else if (req.method === 'OPTIONS') {
          // Handle preflight requests
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          res.status(200).end();
        } else {
          next();
        }
      });
      
      return middlewares;
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
