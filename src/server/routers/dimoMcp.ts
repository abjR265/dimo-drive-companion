import { z } from 'zod';
import { router, aiProcedure, publicProcedure } from '../trpc';
import { 
  dimoMcpClient,
  type DimoIdentityQuery,
  type DimoTelemetryQuery,
  type DimoVinOperation,
  type DimoVehicleSearch,
  type DimoAttestation,
} from '../../services/dimoMcpClient';

// Input validation schemas
const identityQuerySchema = z.object({
  query: z.string().min(1, 'GraphQL query is required'),
  variables: z.record(z.any()).optional(),
});

const telemetryQuerySchema = z.object({
  query: z.string().min(1, 'GraphQL query is required'),
  variables: z.record(z.any()).optional(),
  tokenId: z.number().positive('Valid vehicle token ID is required'),
});

const vinOperationSchema = z.object({
  operation: z.enum(['decode', 'get']),
  vin: z.string().optional(),
  countryCode: z.string().optional(),
  tokenId: z.number().optional(),
});

const vehicleSearchSchema = z.object({
  query: z.string().optional(),
  makeSlug: z.string().optional(),
  year: z.number().positive().optional(),
  model: z.string().optional(),
});

const attestationSchema = z.object({
  tokenId: z.number().positive('Valid vehicle token ID is required'),
  type: z.enum(['pom', 'vin']),
  force: z.boolean().default(false),
});

/**
 * DIMO MCP Router
 * 
 * Provides direct access to DIMO MCP server operations:
 * - Identity GraphQL queries (public)
 * - Telemetry GraphQL queries (authenticated)
 * - VIN operations (decode/get)
 * - Vehicle search
 * - Attestation creation
 * - Schema introspection
 */
export const dimoMcpRouter = router({
  
  /**
   * Query DIMO Identity GraphQL API (public)
   */
  identityQuery: aiProcedure
    .input(identityQuerySchema)
    .mutation(async ({ input, ctx }) => {
      console.log('DIMO Identity Query:', input);
      
      try {
        const request: DimoIdentityQuery = {
          query: input.query,
          variables: input.variables,
        };

        const response = await dimoMcpClient.identityQuery(request);
        
        return {
          success: response.success,
          data: response.data,
          error: response.error,
          metadata: {
            ...response.metadata,
            operation: 'identity_query',
            timestamp: ctx.timestamp,
          },
        };
      } catch (error) {
        console.error('DIMO Identity Query Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Identity query failed',
          data: null,
        };
      }
    }),

  /**
   * Query DIMO Telemetry GraphQL API (authenticated)
   */
  telemetryQuery: aiProcedure
    .input(telemetryQuerySchema)
    .mutation(async ({ input, ctx }) => {
      console.log('DIMO Telemetry Query:', input);
      
      try {
        const request: DimoTelemetryQuery = {
          query: input.query,
          variables: input.variables,
          tokenId: input.tokenId,
        };

        const response = await dimoMcpClient.telemetryQuery(request);
        
        return {
          success: response.success,
          data: response.data,
          error: response.error,
          metadata: {
            ...response.metadata,
            operation: 'telemetry_query',
            timestamp: ctx.timestamp,
          },
        };
      } catch (error) {
        console.error('DIMO Telemetry Query Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Telemetry query failed',
          data: null,
        };
      }
    }),

  /**
   * VIN operations (decode or get)
   */
  vinOperations: aiProcedure
    .input(vinOperationSchema)
    .mutation(async ({ input, ctx }) => {
      console.log('DIMO VIN Operation:', input);
      
      try {
        const request: DimoVinOperation = {
          operation: input.operation,
          ...(input.vin && { vin: input.vin }),
          ...(input.countryCode && { countryCode: input.countryCode }),
          ...(input.tokenId && { tokenId: input.tokenId }),
        };

        const response = await dimoMcpClient.vinOperations(request);
        
        return {
          success: response.success,
          data: response.data,
          error: response.error,
          metadata: {
            ...response.metadata,
            operation: 'vin_operations',
            timestamp: ctx.timestamp,
          },
        };
      } catch (error) {
        console.error('DIMO VIN Operation Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'VIN operation failed',
          data: null,
        };
      }
    }),

  /**
   * Search for vehicles in DIMO
   */
  searchVehicles: aiProcedure
    .input(vehicleSearchSchema)
    .mutation(async ({ input, ctx }) => {
      console.log('DIMO Vehicle Search:', input);
      
      try {
        const request: DimoVehicleSearch = {
          ...(input.query && { query: input.query }),
          ...(input.makeSlug && { makeSlug: input.makeSlug }),
          ...(input.year && { year: input.year }),
          ...(input.model && { model: input.model }),
        };

        const response = await dimoMcpClient.searchVehicles(request);
        
        return {
          success: response.success,
          data: response.data,
          error: response.error,
          metadata: {
            ...response.metadata,
            operation: 'search_vehicles',
            timestamp: ctx.timestamp,
          },
        };
      } catch (error) {
        console.error('DIMO Vehicle Search Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Vehicle search failed',
          data: null,
        };
      }
    }),

  /**
   * Create verifiable credentials
   */
  createAttestation: aiProcedure
    .input(attestationSchema)
    .mutation(async ({ input, ctx }) => {
      console.log('DIMO Attestation Create:', input);
      
      try {
        const request: DimoAttestation = {
          tokenId: input.tokenId,
          type: input.type,
          force: input.force,
        };

        const response = await dimoMcpClient.createAttestation(request);
        
        return {
          success: response.success,
          data: response.data,
          error: response.error,
          metadata: {
            ...response.metadata,
            operation: 'attestation_create',
            timestamp: ctx.timestamp,
          },
        };
      } catch (error) {
        console.error('DIMO Attestation Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Attestation creation failed',
          data: null,
        };
      }
    }),

  /**
   * Get Identity API schema
   */
  getIdentitySchema: publicProcedure
    .query(async ({ ctx }) => {
      try {
        const response = await dimoMcpClient.getIdentitySchema();
        
        return {
          success: response.success,
          data: response.data,
          error: response.error,
          metadata: {
            ...response.metadata,
            operation: 'identity_introspect',
            timestamp: ctx.timestamp,
          },
        };
      } catch (error) {
        console.error('DIMO Identity Schema Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Schema introspection failed',
          data: null,
        };
      }
    }),

  /**
   * Get Telemetry API schema
   */
  getTelemetrySchema: publicProcedure
    .query(async ({ ctx }) => {
      try {
        const response = await dimoMcpClient.getTelemetrySchema();
        
        return {
          success: response.success,
          data: response.data,
          error: response.error,
          metadata: {
            ...response.metadata,
            operation: 'telemetry_introspect',
            timestamp: ctx.timestamp,
          },
        };
      } catch (error) {
        console.error('DIMO Telemetry Schema Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Schema introspection failed',
          data: null,
        };
      }
    }),

  /**
   * Convenience methods for common operations
   */
  
  /**
   * Get vehicle information by token ID
   */
  getVehicleInfo: aiProcedure
    .input(z.object({
      tokenId: z.number().positive('Valid vehicle token ID is required'),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log('Get Vehicle Info:', input);
      
      try {
        const response = await dimoMcpClient.getVehicleInfo(input.tokenId);
        
        return {
          success: response.success,
          data: response.data,
          error: response.error,
          metadata: {
            ...response.metadata,
            operation: 'get_vehicle_info',
            timestamp: ctx.timestamp,
          },
        };
      } catch (error) {
        console.error('Get Vehicle Info Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Vehicle info retrieval failed',
          data: null,
        };
      }
    }),

  /**
   * Get vehicle telemetry by token ID
   */
  getVehicleTelemetry: aiProcedure
    .input(z.object({
      tokenId: z.number().positive('Valid vehicle token ID is required'),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log('Get Vehicle Telemetry:', input);
      
      try {
        const response = await dimoMcpClient.getVehicleTelemetry(input.tokenId);
        
        return {
          success: response.success,
          data: response.data,
          error: response.error,
          metadata: {
            ...response.metadata,
            operation: 'get_vehicle_telemetry',
            timestamp: ctx.timestamp,
          },
        };
      } catch (error) {
        console.error('Get Vehicle Telemetry Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Telemetry retrieval failed',
          data: null,
        };
      }
    }),

  /**
   * Decode VIN
   */
  decodeVin: aiProcedure
    .input(z.object({
      vin: z.string().min(1, 'VIN is required'),
      countryCode: z.string().default('USA'),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log('Decode VIN:', input);
      
      try {
        const response = await dimoMcpClient.decodeVin(input.vin, input.countryCode);
        
        return {
          success: response.success,
          data: response.data,
          error: response.error,
          metadata: {
            ...response.metadata,
            operation: 'decode_vin',
            timestamp: ctx.timestamp,
          },
        };
      } catch (error) {
        console.error('Decode VIN Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'VIN decoding failed',
          data: null,
        };
      }
    }),

  /**
   * Search Tesla vehicles
   */
  searchTeslaVehicles: aiProcedure
    .input(z.object({
      year: z.number().positive().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log('Search Tesla Vehicles:', input);
      
      try {
        const response = await dimoMcpClient.searchTeslaVehicles(input.year);
        
        return {
          success: response.success,
          data: response.data,
          error: response.error,
          metadata: {
            ...response.metadata,
            operation: 'search_tesla_vehicles',
            timestamp: ctx.timestamp,
          },
        };
      } catch (error) {
        console.error('Search Tesla Vehicles Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Tesla vehicle search failed',
          data: null,
        };
      }
    }),

  /**
   * Create Proof of Movement attestation
   */
  createProofOfMovement: aiProcedure
    .input(z.object({
      tokenId: z.number().positive('Valid vehicle token ID is required'),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log('Create Proof of Movement:', input);
      
      try {
        const response = await dimoMcpClient.createProofOfMovement(input.tokenId);
        
        return {
          success: response.success,
          data: response.data,
          error: response.error,
          metadata: {
            ...response.metadata,
            operation: 'create_proof_of_movement',
            timestamp: ctx.timestamp,
          },
        };
      } catch (error) {
        console.error('Create Proof of Movement Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Proof of Movement creation failed',
          data: null,
        };
      }
    }),

  /**
   * Get MCP server health status
   */
  getHealthStatus: publicProcedure
    .query(async ({ ctx }) => {
      try {
        const healthCheck = await dimoMcpClient.healthCheck();
        
        return {
          available: healthCheck.available,
          latency: healthCheck.latency,
          capabilities: [
            'identity_query',
            'telemetry_query',
            'vin_operations',
            'search_vehicles',
            'attestation_create',
            'schema_introspection',
          ],
          lastChecked: ctx.timestamp,
        };
      } catch (error) {
        return {
          available: false,
          error: error instanceof Error ? error.message : 'Health check failed',
          capabilities: [],
          lastChecked: ctx.timestamp,
        };
      }
    }),
}); 