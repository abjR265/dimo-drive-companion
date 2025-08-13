import { z } from 'zod';
import { router, aiProcedure, publicProcedure } from '../trpc';
import { 
  aiVehicleService,
  type AIVehicleQuery,
  type AIVehicleResponse,
  type VehicleHealthAssessment,
  type TripReadinessAssessment 
} from '../../services/aiService';

// Input validation schemas
const aiVehicleQuerySchema = z.object({
  query: z.string().min(1, 'Query is required'),
  vehicleTokenId: z.number().optional(),
  context: z.object({
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
    userPreferences: z.record(z.any()).optional(),
    conversationHistory: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })).optional(),
  }).optional(),
});

const healthAssessmentSchema = z.object({
  vehicleTokenId: z.number().min(1, 'Vehicle token ID is required'),
});

const tripReadinessSchema = z.object({
  vehicleTokenId: z.number().min(1, 'Vehicle token ID is required'),
  destination: z.string().optional(),
  tripDistance: z.number().optional(),
});

const vehicleDataQuerySchema = z.object({
  vehicleTokenId: z.number().min(1, 'Vehicle token ID is required'),
  dataType: z.enum(['identity', 'telemetry', 'vin', 'all']).default('all'),
});

/**
 * AI MCP Router
 * 
 * Provides intelligent vehicle analysis using OpenAI GPT-4 with DIMO MCP tools.
 * This router integrates the AI service with the DIMO MCP server for comprehensive
 * vehicle intelligence and recommendations.
 */
export const aiMcpRouter = router({
  
  /**
   * General AI vehicle analysis
   * Uses OpenAI GPT-4 with MCP tools for comprehensive vehicle analysis
   */
  analyzeVehicle: aiProcedure
    .input(aiVehicleQuerySchema)
    .mutation(async ({ input, ctx }) => {
      console.log('AI MCP Analysis Request:', input);
      
      try {
        const query: AIVehicleQuery = {
          query: input.query,
          vehicleTokenId: input.vehicleTokenId,
          context: input.context,
        };

        const response = await aiVehicleService.analyzeVehicle(query);
        
        return {
          success: response.success,
          data: response,
          metadata: {
            processingTime: Date.now() - ctx.timestamp,
            dataSources: Object.keys(response.dataSources),
            aiConfidence: response.analysis.confidence,
          },
        };
      } catch (error) {
        console.error('AI MCP Analysis Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'AI analysis failed',
          data: null,
        };
      }
    }),

  /**
   * Comprehensive vehicle health assessment
   * Analyzes all vehicle systems and provides detailed health scores
   */
  assessVehicleHealth: aiProcedure
    .input(healthAssessmentSchema)
    .mutation(async ({ input, ctx }) => {
      console.log('Vehicle Health Assessment Request:', input);
      
      try {
        const assessment = await aiVehicleService.assessVehicleHealth(input.vehicleTokenId);
        
        return {
          success: true,
          data: assessment,
          metadata: {
            processingTime: Date.now() - ctx.timestamp,
            systemsAnalyzed: Object.keys(assessment.systems).length,
            urgentIssues: assessment.recommendations.filter(r => r.priority === 'urgent').length,
          },
        };
      } catch (error) {
        console.error('Health Assessment Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Health assessment failed',
          data: null,
        };
      }
    }),

  /**
   * Trip readiness assessment
   * Comprehensive check for trip preparation including all vehicle systems
   */
  assessTripReadiness: aiProcedure
    .input(tripReadinessSchema)
    .mutation(async ({ input, ctx }) => {
      console.log('Trip Readiness Assessment Request:', input);
      
      try {
        const assessment = await aiVehicleService.assessTripReadiness(
          input.vehicleTokenId, 
          input.destination
        );
        
        return {
          success: true,
          data: assessment,
          metadata: {
            processingTime: Date.now() - ctx.timestamp,
            destination: input.destination,
            tripDistance: input.tripDistance,
            checksPerformed: Object.keys(assessment.checks).length,
          },
        };
      } catch (error) {
        console.error('Trip Readiness Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Trip readiness assessment failed',
          data: null,
        };
      }
    }),

  /**
   * Get vehicle data using MCP tools
   * Fetches identity, telemetry, VIN, or all data for a vehicle
   */
  getVehicleData: aiProcedure
    .input(vehicleDataQuerySchema)
    .mutation(async ({ input, ctx }) => {
      console.log('Vehicle Data Request:', input);
      
      try {
        const { dimoMcpClient } = await import('../../services/dimoMcpClient');
        const data: any = {};

        if (input.dataType === 'identity' || input.dataType === 'all') {
          const identityResult = await dimoMcpClient.identityQuery({
            query: `{
              vehicle(tokenId: ${input.vehicleTokenId}) {
                id
                tokenId
                make
                model
                year
                vin
                owner {
                  id
                  username
                }
              }
            }`,
          });
          if (identityResult.success) {
            data.identity = identityResult.data;
          }
        }

        if (input.dataType === 'telemetry' || input.dataType === 'all') {
          const telemetryResult = await dimoMcpClient.telemetryQuery({
            tokenId: input.vehicleTokenId,
            query: `{
              vehicle(tokenId: ${input.vehicleTokenId}) {
                signalsLatest {
                  speed {
                    value
                    timestamp
                  }
                  batteryLevel {
                    value
                    timestamp
                  }
                  fuelLevel {
                    value
                    timestamp
                  }
                  odometer {
                    value
                    timestamp
                  }
                  tirePressure {
                    frontLeft { value timestamp }
                    frontRight { value timestamp }
                    rearLeft { value timestamp }
                    rearRight { value timestamp }
                  }
                  engineRpm {
                    value
                    timestamp
                  }
                  coolantTemp {
                    value
                    timestamp
                  }
                  oilPressure {
                    value
                    timestamp
                  }
                }
                diagnosticCodes {
                  code
                  description
                  severity
                }
              }
            }`,
          });
          if (telemetryResult.success) {
            data.telemetry = telemetryResult.data;
          }
        }

        if (input.dataType === 'vin' || input.dataType === 'all') {
          // First get identity to get VIN
          const identityResult = await dimoMcpClient.identityQuery({
            query: `{
              vehicle(tokenId: ${input.vehicleTokenId}) {
                vin
              }
            }`,
          });
          
          if (identityResult.success && identityResult.data?.vehicle?.vin) {
            const vinResult = await dimoMcpClient.decodeVin(identityResult.data.vehicle.vin);
            if (vinResult.success) {
              data.vin = vinResult.data;
            }
          }
        }

        return {
          success: true,
          data,
          metadata: {
            processingTime: Date.now() - ctx.timestamp,
            dataTypes: Object.keys(data),
            vehicleTokenId: input.vehicleTokenId,
          },
        };
      } catch (error) {
        console.error('Vehicle Data Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Vehicle data fetch failed',
          data: null,
        };
      }
    }),

  /**
   * Search for vehicles in DIMO
   * Uses MCP search_vehicles tool
   */
  searchVehicles: aiProcedure
    .input(z.object({
      query: z.string().optional(),
      make: z.string().optional(),
      year: z.number().optional(),
      model: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log('Vehicle Search Request:', input);
      
      try {
        const { dimoMcpClient } = await import('../../services/dimoMcpClient');
        
        const searchResult = await dimoMcpClient.searchVehicles({
          query: input.query,
          makeSlug: input.make,
          year: input.year,
          model: input.model,
        });

        return {
          success: searchResult.success,
          data: searchResult.data,
          metadata: {
            processingTime: Date.now() - ctx.timestamp,
            searchCriteria: Object.keys(input).filter(key => input[key as keyof typeof input]),
          },
        };
      } catch (error) {
        console.error('Vehicle Search Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Vehicle search failed',
          data: null,
        };
      }
    }),

  /**
   * Create verifiable credentials
   * Uses MCP attestation_create tool
   */
  createAttestation: aiProcedure
    .input(z.object({
      vehicleTokenId: z.number().min(1, 'Vehicle token ID is required'),
      type: z.enum(['pom', 'vin']),
      force: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log('Attestation Creation Request:', input);
      
      try {
        const { dimoMcpClient } = await import('../../services/dimoMcpClient');
        
        const attestationResult = await dimoMcpClient.createAttestation({
          tokenId: input.vehicleTokenId,
          type: input.type,
          force: input.force,
        });

        return {
          success: attestationResult.success,
          data: attestationResult.data,
          metadata: {
            processingTime: Date.now() - ctx.timestamp,
            attestationType: input.type,
            vehicleTokenId: input.vehicleTokenId,
          },
        };
      } catch (error) {
        console.error('Attestation Creation Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Attestation creation failed',
          data: null,
        };
      }
    }),

  /**
   * Get MCP server health status
   */
  getMcpHealth: publicProcedure
    .query(async ({ ctx }) => {
      try {
        const { dimoMcpClient } = await import('../../services/dimoMcpClient');
        const healthCheck = await dimoMcpClient.healthCheck();
        
        return {
          available: healthCheck.available,
          latency: healthCheck.latency,
          tools: [
            'identity_query',
            'telemetry_query',
            'vin_decode',
            'search_vehicles',
            'attestation_create',
            'identity_introspect',
            'telemetry_introspect',
          ],
          lastChecked: ctx.timestamp,
        };
      } catch (error) {
        return {
          available: false,
          error: error instanceof Error ? error.message : 'Health check failed',
          tools: [],
          lastChecked: ctx.timestamp,
        };
      }
    }),

  /**
   * Get AI service capabilities
   */
  getAiCapabilities: publicProcedure
    .query(async ({ ctx }) => {
      return {
        capabilities: [
          'vehicle_health_assessment',
          'trip_readiness_analysis',
          'maintenance_recommendations',
          'cost_optimization',
          'safety_analysis',
          'natural_language_queries',
          'predictive_analytics',
        ],
        dataSources: [
          'dimo_identity_api',
          'dimo_telemetry_api',
          'vin_decoding',
          'vehicle_search',
          'verifiable_credentials',
        ],
        aiModels: [
          'openai_gpt4',
          'fallback_analysis',
        ],
        lastChecked: ctx.timestamp,
      };
    }),
}); 