// N8N Vehicle Genius Agent Client
// Integrates with the sophisticated n8n workflow that has AI Agent with multiple tools

export interface VehicleGeniusRequest {
  vehicleId: string;
  query: string;
  queryType?: 'health' | 'maintenance' | 'trip' | 'general' | 'nearby';
  context?: {
    location?: {
      latitude: number;
      longitude: number;
    };
    preferences?: Record<string, any>;
    conversationHistory?: ConversationMessage[];
  };
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIToolResult {
  toolName: 'openai_chat' | 'fetch_telemetry' | 'nearby_search' | 'http_request';
  result: any;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface VehicleGeniusResponse {
  success: boolean;
  conversationId: string;
  response: {
    text: string;
    insights: string[];
    recommendations: Array<{
      type: 'maintenance' | 'trip' | 'cost' | 'safety';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      title: string;
      description: string;
      actionable: boolean;
      estimatedCost?: number;
    }>;
    toolResults: AIToolResult[];
    confidence: number;
    followUpSuggestions: string[];
  };
  executionId: string;
  processingTime: number;
  error?: string;
}

export interface TelemetryData {
  vehicleId: string;
  timestamp: string;
  odometer?: number;
  fuelLevel?: number;
  batteryLevel?: number;
  tirePressure?: Record<string, number>;
  engineHealth?: Record<string, any>;
  diagnosticCodes?: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface NearbyService {
  name: string;
  type: 'gas_station' | 'mechanic' | 'dealer' | 'car_wash' | 'parking';
  address: string;
  distance: number;
  rating?: number;
  priceLevel?: 1 | 2 | 3 | 4;
  isOpen: boolean;
  phone?: string;
}

class N8NVehicleGeniusClient {
  private baseUrl: string;
  private apiKey?: string;
  private webhookUrl: string;
  private timeout: number = 30000; // 30 seconds

  constructor() {
    this.webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
    this.apiKey = import.meta.env.VITE_N8N_API_KEY;
    this.baseUrl = import.meta.env.VITE_N8N_BASE_URL || 'https://app.n8n.cloud';
    
    if (!this.webhookUrl) {
      console.warn('N8N_WEBHOOK_URL not configured. Vehicle Genius features will be disabled.');
    }
  }

  /**
   * Trigger the Vehicle Genius Agent workflow
   */
  async askVehicleGenius(request: VehicleGeniusRequest): Promise<VehicleGeniusResponse> {
    if (!this.webhookUrl) {
      throw new Error('N8N webhook URL not configured');
    }

    try {
      const payload = {
        vehicleId: request.vehicleId,
        query: request.query,
        queryType: request.queryType || 'general',
        context: {
          timestamp: new Date().toISOString(),
          ...request.context,
        },
        metadata: {
          source: 'dimo-ai-web',
          version: '1.0.0',
        },
      };

      console.log('Triggering Vehicle Genius Agent:', payload);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`N8N workflow failed: ${response.status} ${response.statusText}`);
      }

      const rawResult = await response.json();
      
      // Parse the AI Agent response which may contain multiple tool results
      return this.parseVehicleGeniusResponse(rawResult);

    } catch (error) {
      console.error('Vehicle Genius Agent error:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('AI Agent request timed out. Please try again.');
      }
      
      throw new Error(`AI Agent unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse complex AI Agent response with multiple tool results
   */
  private parseVehicleGeniusResponse(rawResult: any): VehicleGeniusResponse {
    const startTime = Date.now();
    
    try {
      // Handle different response structures from n8n workflow
      const agentResult = rawResult.aiAgent || rawResult.response || rawResult;
      
      const toolResults: AIToolResult[] = [];
      const insights: string[] = [];
      const recommendations: any[] = [];
      let mainResponse = '';
      let confidence = 0.8; // Default confidence

      // Parse OpenAI Chat Model results
      if (agentResult.openaiChat || agentResult.chatResponse) {
        const chatResult = agentResult.openaiChat || agentResult.chatResponse;
        mainResponse = chatResult.content || chatResult.message || '';
        
        toolResults.push({
          toolName: 'openai_chat',
          result: chatResult,
          confidence: 0.9,
        });
      }

      // Parse Telemetry Data results
      if (agentResult.telemetryData || agentResult.vehicleData) {
        const telemetryResult = agentResult.telemetryData || agentResult.vehicleData;
        
        toolResults.push({
          toolName: 'fetch_telemetry',
          result: telemetryResult,
          confidence: 0.95,
          metadata: { source: 'dimo_api' },
        });

        // Extract insights from telemetry
        this.extractTelemetryInsights(telemetryResult, insights, recommendations);
      }

      // Parse Nearby Search results
      if (agentResult.nearbyServices || agentResult.locationData) {
        const nearbyResult = agentResult.nearbyServices || agentResult.locationData;
        
        toolResults.push({
          toolName: 'nearby_search',
          result: nearbyResult,
          confidence: 0.85,
        });
      }

      // Parse HTTP Request results (external APIs)
      if (agentResult.externalData || agentResult.httpResults) {
        const httpResult = agentResult.externalData || agentResult.httpResults;
        
        toolResults.push({
          toolName: 'http_request',
          result: httpResult,
          confidence: 0.8,
        });
      }

      // Generate follow-up suggestions based on results
      const followUpSuggestions = this.generateFollowUpSuggestions(toolResults, agentResult.queryType);

      return {
        success: true,
        conversationId: agentResult.conversationId || `conv_${Date.now()}`,
        response: {
          text: mainResponse || agentResult.summary || 'AI analysis completed',
          insights,
          recommendations,
          toolResults,
          confidence,
          followUpSuggestions,
        },
        executionId: agentResult.executionId || rawResult.executionId || `exec_${Date.now()}`,
        processingTime: Date.now() - startTime,
      };

    } catch (error) {
      console.error('Error parsing Vehicle Genius response:', error);
      
      return {
        success: false,
        conversationId: `error_${Date.now()}`,
        response: {
          text: 'Unable to process AI response',
          insights: [],
          recommendations: [],
          toolResults: [],
          confidence: 0,
          followUpSuggestions: [],
        },
        executionId: `error_${Date.now()}`,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
      };
    }
  }

  /**
   * Extract actionable insights from telemetry data
   */
  private extractTelemetryInsights(
    telemetryData: any, 
    insights: string[], 
    recommendations: any[]
  ): void {
    if (!telemetryData) return;

    // Fuel level insights
    if (telemetryData.fuelLevel !== undefined) {
      if (telemetryData.fuelLevel < 0.2) {
        insights.push(`Low fuel level: ${Math.round(telemetryData.fuelLevel * 100)}%`);
        recommendations.push({
          type: 'trip',
          priority: 'medium',
          title: 'Refuel Soon',
          description: 'Your fuel level is low. Consider refueling before your next trip.',
          actionable: true,
        });
      }
    }

    // Battery level insights (for EVs)
    if (telemetryData.batteryLevel !== undefined) {
      if (telemetryData.batteryLevel < 0.3) {
        insights.push(`Battery level: ${Math.round(telemetryData.batteryLevel * 100)}%`);
        recommendations.push({
          type: 'trip',
          priority: 'high',
          title: 'Charge Vehicle',
          description: 'Battery level is low. Plan for charging before long trips.',
          actionable: true,
        });
      }
    }

    // Diagnostic codes insights
    if (telemetryData.diagnosticCodes && telemetryData.diagnosticCodes.length > 0) {
      insights.push(`${telemetryData.diagnosticCodes.length} diagnostic code(s) detected`);
      recommendations.push({
        type: 'maintenance',
        priority: 'high',
        title: 'Diagnostic Codes Detected',
        description: 'Vehicle has active diagnostic codes that may need attention.',
        actionable: true,
      });
    }

    // Odometer-based maintenance
    if (telemetryData.odometer) {
      const mileage = telemetryData.odometer;
      if (mileage % 5000 < 100) { // Near 5k mile intervals
        recommendations.push({
          type: 'maintenance',
          priority: 'medium',
          title: 'Maintenance Due Soon',
          description: `Vehicle approaching ${Math.ceil(mileage / 5000) * 5000} miles. Consider scheduling service.`,
          actionable: true,
          estimatedCost: 150,
        });
      }
    }
  }

  /**
   * Generate contextual follow-up suggestions
   */
  private generateFollowUpSuggestions(toolResults: AIToolResult[], queryType?: string): string[] {
    const suggestions: string[] = [];

    const hasTelemetry = toolResults.some(t => t.toolName === 'fetch_telemetry');
    const hasNearby = toolResults.some(t => t.toolName === 'nearby_search');

    if (hasTelemetry) {
      suggestions.push('Show detailed vehicle diagnostics');
      suggestions.push('Compare with last month\'s data');
    }

    if (hasNearby) {
      suggestions.push('Get directions to recommended service');
      suggestions.push('Compare prices at nearby locations');
    }

    if (queryType === 'maintenance') {
      suggestions.push('Create maintenance schedule');
      suggestions.push('Estimate upcoming costs');
    }

    if (queryType === 'trip') {
      suggestions.push('Plan optimal route');
      suggestions.push('Check weather conditions');
    }

    // Always include general options
    suggestions.push('Ask another question');
    suggestions.push('Share this analysis');

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }

  /**
   * Health check for n8n workflow availability
   */
  async healthCheck(): Promise<{ available: boolean; latency?: number }> {
    if (!this.webhookUrl) {
      return { available: false };
    }

    try {
      const startTime = Date.now();
      const response = await fetch(this.webhookUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      
      const latency = Date.now() - startTime;
      return { 
        available: response.ok, 
        latency: response.ok ? latency : undefined 
      };
    } catch {
      return { available: false };
    }
  }

  /**
   * Specialized methods for different AI agent capabilities
   */
  async analyzeVehicleHealth(vehicleId: string): Promise<VehicleGeniusResponse> {
    return this.askVehicleGenius({
      vehicleId,
      query: 'Perform a comprehensive health analysis of my vehicle. Check all systems and provide actionable recommendations.',
      queryType: 'health',
    });
  }

  async checkMaintenanceNeeds(vehicleId: string): Promise<VehicleGeniusResponse> {
    return this.askVehicleGenius({
      vehicleId,
      query: 'What maintenance does my vehicle need? Check service intervals, wear items, and upcoming requirements.',
      queryType: 'maintenance',
    });
  }

  async assessTripReadiness(vehicleId: string, destination?: string): Promise<VehicleGeniusResponse> {
    const query = destination 
      ? `Is my vehicle ready for a trip to ${destination}? Check fuel, battery, tire pressure, and any potential issues.`
      : 'Is my vehicle ready for a long trip? Perform a comprehensive readiness check.';
      
    return this.askVehicleGenius({
      vehicleId,
      query,
      queryType: 'trip',
    });
  }

  async findNearbyServices(
    vehicleId: string, 
    serviceType: string,
    location?: { latitude: number; longitude: number }
  ): Promise<VehicleGeniusResponse> {
    return this.askVehicleGenius({
      vehicleId,
      query: `Find nearby ${serviceType} services. Include ratings, prices, and current availability.`,
      queryType: 'nearby',
      context: { location },
    });
  }
}

// Export singleton instance
export const n8nClient = new N8NVehicleGeniusClient();

// Export types for use in other components
export type {
  VehicleGeniusRequest,
  VehicleGeniusResponse,
  AIToolResult,
  TelemetryData,
  NearbyService,
  ConversationMessage,
}; 