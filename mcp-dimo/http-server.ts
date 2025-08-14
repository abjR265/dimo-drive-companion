#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { DIMO } from '@dimo-network/data-sdk';
import { z } from 'zod';

// Extend Express Request interface to include startTime
declare global {
  namespace Express {
    interface Request {
      startTime: number;
    }
  }
}

// At the top, define the hardcoded URLs for identity and telemetry
const IDENTITY_URL = "https://identity-api.dimo.zone/query";
const TELEMETRY_URL = "https://telemetry-api.dimo.zone/query";
const DEVICES_API_URL = "https://devices-api.dimo.zone";

interface VehicleJwtCacheEntry {
  token: any;
  privileges: number[];
  expiresAt: number; // Unix timestamp in ms
}


interface AuthState {
  dimo?: DIMO;
  developerJwt?: any;
  vehicleJwts: Map<number, VehicleJwtCacheEntry>;
}

const IdentityQuerySchema = z.object({
  query: z.string(),
  variables: z.record(z.string(), z.string()).optional()
});

const TelemetryQuerySchema = z.object({
  query: z.string(),
  variables: z.record(z.string(), z.string()).optional(),
  tokenId: z.number()
});

const VinOperationSchema = z.object({
  operation: z.enum(['decode', 'get']),
  vin: z.string().optional(),
  countryCode: z.string().default("USA"),
  tokenId: z.number().optional()
});

const AttestationCreateSchema = z.object({
  tokenId: z.number(),
  type: z.enum(["pom", "vin"]),
  force: z.boolean().default(false)
});

const SearchVehiclesSchema = z.object({
  query: z.string().optional(),
  makeSlug: z.string().optional(),
  year: z.number().optional(),
  model: z.string().optional()
});

const authState: AuthState = {
  vehicleJwts: new Map()
};

// Helper function to ensure vehicle JWT exists
async function ensureVehicleJwt(tokenId: number, privileges: number[] = [1]): Promise<any> {
  if (!authState.dimo) {
    throw new Error("DIMO not initialized.");
  }
  if (!authState.developerJwt) {
    throw new Error("Not authenticated.");
  }

  const cacheEntry = authState.vehicleJwts.get(tokenId);
  const now = Date.now();
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer before expiry

  // Check if we have a valid cached JWT with required privileges
  if (
    cacheEntry &&
    cacheEntry.expiresAt > (now + bufferTime) && // Add buffer time
    privileges.every(p => cacheEntry.privileges.includes(p))
  ) {
    console.log(`Using cached JWT for vehicle ${tokenId}`);
    return cacheEntry.token;
  }

  // Clear expired or insufficient JWT
  if (cacheEntry) {
    console.log(`Refreshing JWT for vehicle ${tokenId} (expired or insufficient privileges)`);
    authState.vehicleJwts.delete(tokenId);
  }

  try {
    // Get new JWT with required privileges
    console.log(`Requesting new JWT for vehicle ${tokenId} with privileges: [${privileges.join(', ')}]`);
    const vehicleJwt = await authState.dimo.tokenexchange.getVehicleJwt({
      ...authState.developerJwt,
      tokenId: tokenId
    });

    // Cache the JWT with longer expiry (2 hours instead of 1)
    const expiryTime = now + (2 * 60 * 60 * 1000); // 2 hours
    authState.vehicleJwts.set(tokenId, {
      token: vehicleJwt,
      privileges: privileges,
      expiresAt: expiryTime
    });

    console.log(`Successfully cached new JWT for vehicle ${tokenId}, expires at ${new Date(expiryTime).toISOString()}`);
    return vehicleJwt;
  } catch (error) {
    console.error(`Failed to get JWT for vehicle ${tokenId}:`, error);
    throw new Error(`Failed to get vehicle JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dimo_initialized: !!authState.dimo,
    developer_authenticated: !!authState.developerJwt
  });
});

// JWT refresh endpoint
app.post('/refresh-jwt/:tokenId', async (req, res) => {
  try {
    const tokenId = parseInt(req.params.tokenId);
    const privileges = req.body.privileges || [1, 2, 3, 4, 5];
    
    // Force refresh by clearing cache
    authState.vehicleJwts.delete(tokenId);
    
    const vehicleJwt = await ensureVehicleJwt(tokenId, privileges);
    
    res.json({
      success: true,
      message: `JWT refreshed for vehicle ${tokenId}`,
      expiresAt: authState.vehicleJwts.get(tokenId)?.expiresAt
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'JWT refresh failed'
    });
  }
});

// MCP Tools endpoints
app.post('/mcp/tools/identity_query', async (req, res) => {
  try {
    const { params } = req.body;
    const validatedParams = IdentityQuerySchema.parse(params);

    const response = await fetch(IDENTITY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: validatedParams.query,
        variables: validatedParams.variables || {}
      })
    });

    if (!response.ok) {
      throw new Error(`Identity API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    res.json({
      success: true,
      data: data.data,
      metadata: {
        processingTime: Date.now() - req.startTime,
        operation: 'identity_query',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Identity query failed',
      metadata: {
        processingTime: Date.now() - req.startTime,
        operation: 'identity_query',
        timestamp: new Date().toISOString()
      }
    });
  }
});

app.post('/mcp/tools/telemetry_query', async (req, res) => {
  try {
    const { params } = req.body;
    const validatedParams = TelemetryQuerySchema.parse(params);

    // Ensure we have vehicle JWT
    const vehicleJwt = await ensureVehicleJwt(validatedParams.tokenId);

    const response = await fetch(TELEMETRY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': vehicleJwt.headers.Authorization
      },
      body: JSON.stringify({
        query: validatedParams.query,
        variables: validatedParams.variables || {}
      })
    });

    if (!response.ok) {
      throw new Error(`Telemetry API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    res.json({
      success: true,
      data: data.data,
      metadata: {
        processingTime: Date.now() - req.startTime,
        operation: 'telemetry_query',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Telemetry query failed',
      metadata: {
        processingTime: Date.now() - req.startTime,
        operation: 'telemetry_query',
        timestamp: new Date().toISOString()
      }
    });
  }
});

app.post('/mcp/tools/vin_operations', async (req, res) => {
  try {
    const { params } = req.body;
    const validatedParams = VinOperationSchema.parse(params);

    if (validatedParams.operation === 'decode' && !validatedParams.vin) {
      throw new Error('VIN is required for decode operation');
    }

    if (validatedParams.operation === 'get' && !validatedParams.tokenId) {
      throw new Error('TokenId is required for get operation');
    }

    let result;
    if (validatedParams.operation === 'decode') {
      // For decode, we'll use a simple VIN decoder API or return mock data
      result = {
        vin: validatedParams.vin,
        make: 'Honda',
        model: 'Civic',
        year: 2003,
        countryCode: validatedParams.countryCode
      };
    } else {
      // For get, we need to query the vehicle's VIN
      const vehicleJwt = await ensureVehicleJwt(validatedParams.tokenId!);
      
      const response = await fetch(IDENTITY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `{ vehicle(tokenId: ${validatedParams.tokenId}) { vin } }`
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get VIN: ${response.statusText}`);
      }

      const data = await response.json();
      result = data.data.vehicle;
    }
    
    res.json({
      success: true,
      data: result,
      metadata: {
        processingTime: Date.now() - req.startTime,
        operation: 'vin_operations',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'VIN operation failed',
      metadata: {
        processingTime: Date.now() - req.startTime,
        operation: 'vin_operations',
        timestamp: new Date().toISOString()
      }
    });
  }
});

app.post('/mcp/tools/search_vehicles', async (req, res) => {
  try {
    const { params } = req.body;
    const validatedParams = SearchVehiclesSchema.parse(params);

    // Query vehicles with filters
    let query = '{ vehicles(first: 10';
    
    if (validatedParams.makeSlug) {
      query += `, filter: { makeSlug: "${validatedParams.makeSlug}" }`;
    }
    
    query += ') { nodes { tokenId make model year } } }';

    const response = await fetch(IDENTITY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`Vehicle search failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    res.json({
      success: true,
      data: data.data,
      metadata: {
        processingTime: Date.now() - req.startTime,
        operation: 'search_vehicles',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Vehicle search failed',
      metadata: {
        processingTime: Date.now() - req.startTime,
        operation: 'search_vehicles',
        timestamp: new Date().toISOString()
      }
    });
  }
});

app.post('/mcp/tools/attestation_create', async (req, res) => {
  try {
    const { params } = req.body;
    const validatedParams = AttestationCreateSchema.parse(params);

    // Ensure we have vehicle JWT with appropriate privileges
    const privileges = validatedParams.type === 'pom' ? [4] : [5];
    const vehicleJwt = await ensureVehicleJwt(validatedParams.tokenId, privileges);

    // Create attestation (this would call the actual attestation API)
    const result = {
      tokenId: validatedParams.tokenId,
      type: validatedParams.type,
      status: 'created',
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: result,
      metadata: {
        processingTime: Date.now() - req.startTime,
        operation: 'attestation_create',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Attestation creation failed',
      metadata: {
        processingTime: Date.now() - req.startTime,
        operation: 'attestation_create',
        timestamp: new Date().toISOString()
      }
    });
  }
});

app.post('/mcp/tools/identity_introspect', async (req, res) => {
  try {
    const response = await fetch(IDENTITY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query IntrospectionQuery {
            __schema {
              types {
                name
                description
                fields {
                  name
                  description
                  type {
                    name
                  }
                }
              }
            }
          }
        `
      })
    });

    if (!response.ok) {
      throw new Error(`Schema introspection failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    res.json({
      success: true,
      data: data.data,
      metadata: {
        processingTime: Date.now() - req.startTime,
        operation: 'identity_introspect',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Schema introspection failed',
      metadata: {
        processingTime: Date.now() - req.startTime,
        operation: 'identity_introspect',
        timestamp: new Date().toISOString()
      }
    });
  }
});

app.post('/mcp/tools/telemetry_introspect', async (req, res) => {
  try {
    // For telemetry introspection, we need a vehicle JWT
    // This is a simplified version - in practice you'd need a valid tokenId
    const result = {
      message: 'Telemetry schema introspection requires vehicle authentication',
      availableQueries: [
        'vehicle(tokenId: Int!)',
        'signalsLatest',
        'speed',
        'batteryLevel',
        'fuelLevel',
        'odometer',
        'tirePressure'
      ]
    };
    
    res.json({
      success: true,
      data: result,
      metadata: {
        processingTime: Date.now() - req.startTime,
        operation: 'telemetry_introspect',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Telemetry introspection failed',
      metadata: {
        processingTime: Date.now() - req.startTime,
        operation: 'telemetry_introspect',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Middleware to add start time
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Start server
async function main() {
  // Check for environment variables
  const env = process.env;

  // Initialize DIMO with Production environment
  authState.dimo = new DIMO("Production");

  // Auto-authenticate if credentials are provided
  if (env.DIMO_CLIENT_ID && env.DIMO_DOMAIN && env.DIMO_PRIVATE_KEY && env.DIMO_DOMAIN !== 'your_domain.com') {
    try {
      authState.developerJwt = await authState.dimo.auth.getDeveloperJwt({
        client_id: env.DIMO_CLIENT_ID,
        domain: env.DIMO_DOMAIN,
        private_key: env.DIMO_PRIVATE_KEY
      });
      console.log('DIMO developer authentication successful');
    } catch (error) {
      console.error('Failed to auto-authenticate:', error);
      console.log('Continuing without authentication - public endpoints will work');
    }
  } else {
    console.log('DIMO credentials not provided or using placeholder domain. Public endpoints will work.');
  }

  app.listen(PORT, () => {
    console.log(`DIMO MCP HTTP Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

// Handle errors
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
}); 