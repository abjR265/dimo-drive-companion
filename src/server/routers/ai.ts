import { z } from 'zod';
import { router, aiProcedure, publicProcedure } from '../trpc';
import { 
  n8nClient,
  type VehicleGeniusRequest,
  type VehicleGeniusResponse,
  type ConversationMessage 
} from '../../services/n8nClient';

// Input validation schemas
const vehicleQuestionSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  query: z.string().min(1, 'Question is required'),
  queryType: z.enum(['health', 'maintenance', 'trip', 'general', 'nearby']).optional(),
  context: z.object({
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
    preferences: z.record(z.any()).optional(),
    conversationHistory: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
      timestamp: z.string(),
    })).optional(),
  }).optional(),
});

const vehicleHealthSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  includeHistory: z.boolean().default(false),
  focusAreas: z.array(z.enum(['engine', 'battery', 'tires', 'fluids', 'diagnostics'])).optional(),
});

const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  mileageOverride: z.number().optional(),
  timeframe: z.enum(['immediate', '30_days', '90_days', '6_months']).default('90_days'),
});

const tripReadinessSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  destination: z.string().optional(),
  tripDistance: z.number().optional(),
  departureTime: z.string().optional(),
  preferences: z.object({
    includeCharging: z.boolean().default(true),
    includeFuel: z.boolean().default(true),
    includeWeather: z.boolean().default(true),
  }).optional(),
});

const nearbyServicesSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  serviceType: z.enum(['gas_station', 'mechanic', 'dealer', 'car_wash', 'parking', 'charging', 'any']),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  radius: z.number().min(1).max(50).default(10), // miles
  maxResults: z.number().min(1).max(20).default(10),
});

const conversationSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.string(),
  })),
  context: z.object({
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
    preferences: z.record(z.any()).optional(),
  }).optional(),
});

// DIMO attestation schema
const dimoAttestationSchema = z.object({
  payload: z.object({
    id: z.string(),
    source: z.string(),
    producer: z.string().optional(),
    specversion: z.string(),
    subject: z.string(),
    time: z.string(),
    type: z.string(),
    signature: z.string(),
    data: z.record(z.any()),
  }),
  jwt: z.string(),
});

/**
 * Enhanced AI Router with Vehicle Genius Agent Integration
 * 
 * This router provides access to the sophisticated n8n "Vehicle Genius Agent" 
 * workflow which has access to multiple tools:
 * - OpenAI Chat Model for intelligent analysis
 * - Fetch Telemetry from DIMO APIs  
 * - Nearby Search for services and locations
 * - HTTP Request for external API integration
 */
export const aiRouter = router({
  
  /**
   * DIMO Attestation Proxy
   * Handles CORS issues by proxying attestation requests through the backend
   */
  postDimoAttestation: publicProcedure
    .input(dimoAttestationSchema)
    .mutation(async ({ input }) => {
      console.log('Posting DIMO attestation via proxy');
      
      try {
        const response = await fetch('https://attest.dimo.zone/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${input.jwt}`
          },
          body: JSON.stringify(input.payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Attestation proxy failed:', response.status, errorText);
          throw new Error(`Attestation failed: ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Attestation proxy successful:', result);
        return { success: true, data: result };
      } catch (error) {
        console.error('Error in attestation proxy:', error);
        throw new Error('Failed to post attestation via proxy');
      }
    }),

  /**
   * General vehicle question endpoint
   * Sends any vehicle-related question to the AI agent
   */
  askVehicleQuestion: aiProcedure
    .input(vehicleQuestionSchema)
    .mutation(async ({ input, ctx }) => {
      console.log('AI Question Request:', input);
      
      try {
        const request: VehicleGeniusRequest = {
          vehicleId: input.vehicleId,
          query: input.query,
          queryType: input.queryType || 'general',
          context: input.context,
        };

        const response = await n8nClient.askVehicleGenius(request);
        
        // TODO: Store conversation in database for history
        await storeConversationHistory(input.vehicleId, {
          role: 'user',
          content: input.query,
          timestamp: ctx.timestamp,
        }, {
          role: 'assistant', 
          content: response.response.text,
          timestamp: new Date().toISOString(),
        });

        return {
          success: true,
          data: response,
          metadata: {
            processingTime: response.processingTime,
            toolsUsed: response.response.toolResults.map(t => t.toolName),
          },
        };
      } catch (error) {
        console.error('AI Question Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'AI processing failed',
          data: null,
        };
      }
    }),

  /**
   * Comprehensive vehicle health analysis
   * Uses AI agent to analyze all vehicle systems
   */
  analyzeVehicleHealth: aiProcedure
    .input(vehicleHealthSchema)
    .mutation(async ({ input, ctx }) => {
      console.log('Vehicle Health Analysis Request:', input);
      
      try {
        let query = 'Perform a comprehensive health analysis of my vehicle. Check all systems including engine, battery, tires, fluids, and any diagnostic codes.';
        
        if (input.focusAreas && input.focusAreas.length > 0) {
          query += ` Focus specifically on: ${input.focusAreas.join(', ')}.`;
        }
        
        if (input.includeHistory) {
          query += ' Include historical data comparison and trends where available.';
        }
        
        query += ' Provide actionable recommendations prioritized by urgency and cost.';

        const response = await n8nClient.analyzeVehicleHealth(input.vehicleId);
        
        return {
          success: true,
          data: response,
          healthScore: calculateHealthScore(response.response.toolResults),
          urgentIssues: response.response.recommendations.filter(r => r.priority === 'urgent'),
          metadata: {
            analysisTime: response.processingTime,
            dataPoints: response.response.toolResults.length,
          },
        };
      } catch (error) {
        console.error('Health Analysis Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Health analysis failed',
          data: null,
        };
      }
    }),

  /**
   * Maintenance needs assessment
   * AI agent checks service intervals and wear items
   */
  checkMaintenanceNeeds: aiProcedure
    .input(maintenanceSchema)
    .mutation(async ({ input, ctx }) => {
      console.log('Maintenance Check Request:', input);
      
      try {
        let query = `What maintenance does my vehicle need in the next ${input.timeframe.replace('_', ' ')}? Check service intervals, wear items, fluid levels, and upcoming requirements.`;
        
        if (input.mileageOverride) {
          query += ` Use ${input.mileageOverride} miles as the current odometer reading.`;
        }
        
        query += ' Include cost estimates and prioritize by safety and urgency.';

        const response = await n8nClient.checkMaintenanceNeeds(input.vehicleId);
        
        const maintenanceItems = extractMaintenanceItems(response.response.recommendations);
        const totalEstimatedCost = maintenanceItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
        
        return {
          success: true,
          data: response,
          maintenanceItems,
          totalEstimatedCost,
          priorityItems: maintenanceItems.filter(item => item.priority === 'high' || item.priority === 'urgent'),
          metadata: {
            itemCount: maintenanceItems.length,
            timeframe: input.timeframe,
          },
        };
      } catch (error) {
        console.error('Maintenance Check Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Maintenance check failed',
          data: null,
        };
      }
    }),

  /**
   * Trip readiness assessment
   * Comprehensive check for trip preparation
   */
  assessTripReadiness: aiProcedure
    .input(tripReadinessSchema)
    .mutation(async ({ input, ctx }) => {
      console.log('Trip Readiness Request:', input);
      
      try {
        const destination = input.destination || 'a long trip';
        let query = `Is my vehicle ready for a trip to ${destination}? Check fuel/battery levels, tire pressure, fluid levels, and any potential issues.`;
        
        if (input.tripDistance) {
          query += ` The trip is approximately ${input.tripDistance} miles.`;
        }
        
        if (input.departureTime) {
          query += ` Departure is planned for ${input.departureTime}.`;
        }
        
        if (input.preferences?.includeWeather) {
          query += ' Include weather considerations for the route.';
        }
        
        query += ' Provide a readiness score and specific action items if needed.';

        const response = await n8nClient.assessTripReadiness(input.vehicleId, input.destination);
        
        const readinessScore = calculateTripReadiness(response.response.toolResults, response.response.recommendations);
        const actionItems = response.response.recommendations.filter(r => r.actionable);
        
        return {
          success: true,
          data: response,
          readinessScore,
          isReady: readinessScore >= 80,
          actionItems,
          blockers: actionItems.filter(item => item.priority === 'urgent'),
          metadata: {
            destination: input.destination,
            checksPerformed: response.response.toolResults.length,
          },
        };
      } catch (error) {
        console.error('Trip Readiness Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Trip readiness check failed',
          data: null,
        };
      }
    }),

  /**
   * Find nearby services using AI agent
   * Leverages nearby search tool with intelligent filtering
   */
  findNearbyServices: aiProcedure
    .input(nearbyServicesSchema)
    .mutation(async ({ input, ctx }) => {
      console.log('Nearby Services Request:', input);
      
      try {
        const serviceTypeMap = {
          gas_station: 'gas stations',
          mechanic: 'auto repair shops',
          dealer: 'car dealerships',
          car_wash: 'car wash services',
          parking: 'parking facilities',
          charging: 'EV charging stations',
          any: 'automotive services',
        };
        
        const serviceDescription = serviceTypeMap[input.serviceType];
        let query = `Find nearby ${serviceDescription} within ${input.radius} miles. Include ratings, prices, current availability, and contact information.`;
        
        query += ` Limit results to ${input.maxResults} best options, prioritized by rating and distance.`;

        const response = await n8nClient.findNearbyServices(
          input.vehicleId, 
          serviceDescription,
          input.location
        );
        
        const services = extractNearbyServices(response.response.toolResults);
        
        return {
          success: true,
          data: response,
          services,
          serviceCount: services.length,
          averageDistance: services.reduce((sum, s) => sum + s.distance, 0) / services.length,
          metadata: {
            searchRadius: input.radius,
            serviceType: input.serviceType,
            resultsRequested: input.maxResults,
          },
        };
      } catch (error) {
        console.error('Nearby Services Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Nearby services search failed',
          data: null,
        };
      }
    }),

  /**
   * Multi-turn conversation with AI agent
   * Maintains context across multiple exchanges
   */
  continueConversation: aiProcedure
    .input(conversationSchema)
    .mutation(async ({ input, ctx }) => {
      console.log('Conversation Continue Request:', input);
      
      try {
        const lastMessage = input.messages[input.messages.length - 1];
        if (lastMessage.role !== 'user') {
          throw new Error('Last message must be from user');
        }

        const request: VehicleGeniusRequest = {
          vehicleId: input.vehicleId,
          query: lastMessage.content,
          queryType: 'general',
          context: {
            ...input.context,
            conversationHistory: input.messages.slice(-10), // Keep last 10 messages for context
          },
        };

        const response = await n8nClient.askVehicleGenius(request);
        
        // Update conversation history
        const updatedMessages = [
          ...input.messages,
          {
            role: 'assistant' as const,
            content: response.response.text,
            timestamp: new Date().toISOString(),
          },
        ];

        return {
          success: true,
          data: response,
          messages: updatedMessages,
          suggestedFollowUps: response.response.followUpSuggestions,
          metadata: {
            conversationLength: updatedMessages.length,
            aiConfidence: response.response.confidence,
          },
        };
      } catch (error) {
        console.error('Conversation Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Conversation failed',
          data: null,
        };
      }
    }),

  /**
   * Get AI agent system status and capabilities
   */
  getSystemStatus: publicProcedure
    .query(async ({ ctx }) => {
      try {
        const healthCheck = await n8nClient.healthCheck();
        
        return {
          available: healthCheck.available,
          latency: healthCheck.latency,
          capabilities: [
            'vehicle_health_analysis',
            'maintenance_scheduling', 
            'trip_readiness',
            'nearby_services',
            'natural_language_chat',
            'telemetry_analysis',
          ],
          toolsAvailable: [
            'openai_chat_model',
            'dimo_telemetry_fetch',
            'nearby_search',
            'http_requests',
          ],
          lastChecked: ctx.timestamp,
        };
      } catch (error) {
        return {
          available: false,
          error: error instanceof Error ? error.message : 'Status check failed',
          capabilities: [],
          toolsAvailable: [],
          lastChecked: ctx.timestamp,
        };
      }
    }),
});

// Helper functions

async function storeConversationHistory(
  vehicleId: string, 
  userMessage: ConversationMessage, 
  assistantMessage: ConversationMessage
): Promise<void> {
  // TODO: Implement database storage
  console.log('Storing conversation:', { vehicleId, userMessage, assistantMessage });
}

function calculateHealthScore(toolResults: any[]): number {
  // Simple health score calculation based on AI findings
  const telemetryResult = toolResults.find(t => t.toolName === 'fetch_telemetry');
  if (!telemetryResult) return 75; // Default score
  
  let score = 100;
  const data = telemetryResult.result;
  
  if (data.diagnosticCodes?.length > 0) score -= 20;
  if (data.fuelLevel < 0.2) score -= 10;
  if (data.batteryLevel < 0.3) score -= 15;
  
  return Math.max(score, 0);
}

function calculateTripReadiness(toolResults: any[], recommendations: any[]): number {
  const urgentIssues = recommendations.filter(r => r.priority === 'urgent').length;
  const highIssues = recommendations.filter(r => r.priority === 'high').length;
  
  let score = 100;
  score -= urgentIssues * 30;
  score -= highIssues * 15;
  
  return Math.max(score, 0);
}

function extractMaintenanceItems(recommendations: any[]): any[] {
  return recommendations.filter(r => r.type === 'maintenance');
}

function extractNearbyServices(toolResults: any[]): any[] {
  const nearbyResult = toolResults.find(t => t.toolName === 'nearby_search');
  return nearbyResult?.result?.services || [];
} 