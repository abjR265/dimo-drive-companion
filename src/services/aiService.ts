// AI Service with DIMO MCP Integration
// Provides intelligent vehicle analysis using OpenAI GPT-4 with MCP tools

import { dimoMcpClient, type DimoMcpResponse } from './dimoMcpClient';

export interface AIVehicleQuery {
  query: string;
  vehicleTokenId?: number;
  context?: {
    location?: { latitude: number; longitude: number };
    userPreferences?: Record<string, any>;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  };
}

export interface AIVehicleResponse {
  success: boolean;
  analysis: {
    summary: string;
    insights: string[];
    recommendations: Array<{
      type: 'maintenance' | 'trip' | 'cost' | 'safety' | 'optimization';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      title: string;
      description: string;
      actionable: boolean;
      estimatedCost?: number;
      timeframe?: string;
    }>;
    healthScore: number;
    confidence: number;
  };
  dataSources: {
    telemetry?: any;
    identity?: any;
    vin?: any;
    search?: any;
  };
  followUpQuestions: string[];
  error?: string;
}

export interface VehicleHealthAssessment {
  overallScore: number;
  systems: {
    engine: { score: number; status: string; issues: string[] };
    battery: { score: number; status: string; issues: string[] };
    tires: { score: number; status: string; issues: string[] };
    fluids: { score: number; status: string; issues: string[] };
    diagnostics: { score: number; status: string; issues: string[] };
  };
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'urgent';
    action: string;
    cost?: number;
    timeframe: string;
  }>;
}

export interface TripReadinessAssessment {
  isReady: boolean;
  readinessScore: number;
  checks: {
    fuel: { status: string; level?: number; range?: number };
    battery: { status: string; level?: number; range?: number };
    tires: { status: string; pressure?: Record<string, number> };
    fluids: { status: string; issues: string[] };
    diagnostics: { status: string; codes?: string[] };
  };
  blockers: string[];
  warnings: string[];
  recommendations: string[];
}

class AIVehicleService {
  private openaiApiKey: string;
  private openaiEndpoint: string;

  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.openaiEndpoint = import.meta.env.VITE_OPENAI_ENDPOINT || 'https://api.openai.com/v1';
    
    if (!this.openaiApiKey) {
      console.warn('OpenAI API key not configured. AI features will be limited.');
    }
  }

  /**
   * Main AI analysis method using MCP tools
   */
  async analyzeVehicle(query: AIVehicleQuery): Promise<AIVehicleResponse> {
    try {
      // Step 1: Gather vehicle data using MCP tools
      const vehicleData = await this.gatherVehicleData(query.vehicleTokenId);
      
      // Step 2: Analyze with OpenAI
      const analysis = await this.performAIAnalysis(query, vehicleData);
      
      // Step 3: Generate recommendations and insights
      const recommendations = this.generateRecommendations(vehicleData, analysis);
      
      // Step 4: Calculate health score
      const healthScore = this.calculateHealthScore(vehicleData, analysis);
      
      // Step 5: Generate follow-up questions
      const followUpQuestions = this.generateFollowUpQuestions(query, analysis);
      
      return {
        success: true,
        analysis: {
          summary: analysis.summary,
          insights: analysis.insights,
          recommendations,
          healthScore,
          confidence: analysis.confidence,
        },
        dataSources: vehicleData,
        followUpQuestions,
      };
    } catch (error) {
      console.error('AI Vehicle Analysis Error:', error);
      return {
        success: false,
        analysis: {
          summary: 'Unable to analyze vehicle at this time.',
          insights: [],
          recommendations: [],
          healthScore: 0,
          confidence: 0,
        },
        dataSources: {},
        followUpQuestions: [],
        error: error instanceof Error ? error.message : 'Analysis failed',
      };
    }
  }

  /**
   * Gather comprehensive vehicle data using MCP tools
   */
  private async gatherVehicleData(tokenId?: number): Promise<any> {
    const data: any = {};

    if (tokenId) {
      // Get vehicle identity information
      try {
        const identityResult = await dimoMcpClient.identityQuery({
          query: `{
            vehicle(tokenId: ${tokenId}) {
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
      } catch (error) {
        console.warn('Failed to fetch vehicle identity:', error);
      }

      // Get vehicle telemetry data
      try {
        const telemetryResult = await dimoMcpClient.telemetryQuery({
          tokenId,
          query: `{
            vehicle(tokenId: ${tokenId}) {
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
      } catch (error) {
        console.warn('Failed to fetch vehicle telemetry:', error);
      }

      // Decode VIN if available
      if (data.identity?.vehicle?.vin) {
        try {
          const vinResult = await dimoMcpClient.decodeVin(data.identity.vehicle.vin);
          if (vinResult.success) {
            data.vin = vinResult.data;
          }
        } catch (error) {
          console.warn('Failed to decode VIN:', error);
        }
      }
    }

    return data;
  }

  /**
   * Perform AI analysis using OpenAI GPT-4
   */
  private async performAIAnalysis(query: AIVehicleQuery, vehicleData: any): Promise<any> {
    if (!this.openaiApiKey) {
      // Fallback to basic analysis without OpenAI
      return this.performBasicAnalysis(query, vehicleData);
    }

    try {
      const systemPrompt = `You are an expert automotive AI assistant with access to real vehicle data. 
      
Your capabilities include:
- Analyzing vehicle health and performance
- Providing maintenance recommendations
- Assessing trip readiness
- Optimizing vehicle usage and costs
- Interpreting diagnostic codes and telemetry data

Always provide:
1. Clear, actionable insights
2. Prioritized recommendations
3. Cost estimates when relevant
4. Safety considerations
5. Specific timeframes for actions

IMPORTANT: Do not use any emojis or bold formatting (**) in your responses. Provide clean, professional text only.

UNIT CONVERSION RULES:
- All odometer readings (powertrainTransmissionTravelledDistance) are in KILOMETERS
- When asked for miles, convert from kilometers: 1 kilometer = 0.621371 miles
- Speed values are typically in km/h, convert to mph when needed: 1 km/h = 0.621371 mph
- Always specify the unit (km, miles, km/h, mph) in your responses

Use the vehicle data provided to give accurate, helpful advice.`;

      const userPrompt = `Vehicle Query: "${query.query}"

Vehicle Data:
${JSON.stringify(vehicleData, null, 2)}

Context: ${JSON.stringify(query.context, null, 2)}

Please provide a comprehensive analysis including:
1. Summary of current vehicle status
2. Key insights from the data
3. Specific recommendations with priorities
4. Health score assessment (0-100)
5. Confidence level in your analysis (0-100)`;

      const response = await fetch(`${this.openaiEndpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      const analysis = result.choices[0].message.content;

      // Parse the AI response
      return this.parseAIAnalysis(analysis);
    } catch (error) {
      console.error('OpenAI analysis failed:', error);
      return this.performBasicAnalysis(query, vehicleData);
    }
  }

  /**
   * Fallback basic analysis without OpenAI
   */
  private performBasicAnalysis(query: AIVehicleQuery, vehicleData: any): any {
    const telemetry = vehicleData.telemetry?.vehicle?.signalsLatest;
    const identity = vehicleData.identity?.vehicle;
    
    let healthScore = 85; // Default score for Mercedes-Benz C-Class
    let insights: string[] = [];
    let recommendations: any[] = [];

    // Mercedes-Benz C-Class specific analysis
    const isMercedes = identity?.make?.toLowerCase().includes('mercedes') || 
                      identity?.model?.toLowerCase().includes('c-class');

    if (isMercedes) {
      insights.push('Mercedes-Benz C-Class detected - premium vehicle analysis active');
      
      // Mercedes-specific recommendations
      if (telemetry?.odometer?.value > 40000) {
        insights.push('Approaching major service interval for Mercedes-Benz');
        recommendations.push({
          type: 'maintenance',
          priority: 'medium',
          title: 'Mercedes-Benz Service Due',
          description: 'Your C-Class is approaching 50,000 miles. Schedule a comprehensive service check.',
          actionable: true,
          estimatedCost: 300,
        });
      }
    }

    // Analyze telemetry data
    if (telemetry) {
      if (telemetry.fuelLevel?.value < 0.2) {
        insights.push('Low fuel level detected');
        recommendations.push({
          type: 'trip',
          priority: 'medium',
          title: 'Refuel Soon',
          description: 'Fuel level is low. Consider refueling before your next trip.',
          actionable: true,
        });
        healthScore -= 10;
      }

      if (telemetry.batteryLevel?.value < 0.3) {
        insights.push('Low battery level detected');
        recommendations.push({
          type: 'trip',
          priority: 'high',
          title: 'Charge Vehicle',
          description: 'Battery level is low. Plan for charging before long trips.',
          actionable: true,
        });
        healthScore -= 15;
      }

      // Check tire pressure
      const tirePressure = telemetry.tirePressure;
      if (tirePressure) {
        const pressures = [tirePressure.frontLeft, tirePressure.frontRight, tirePressure.rearLeft, tirePressure.rearRight];
        const lowPressure = pressures.some(p => p?.value < 30);
        if (lowPressure) {
          insights.push('Low tire pressure detected');
          recommendations.push({
            type: 'safety',
            priority: 'high',
            title: 'Check Tire Pressure',
            description: 'One or more tires have low pressure. Check and inflate as needed.',
            actionable: true,
          });
          healthScore -= 10;
        }
      }
    }

    // Check diagnostic codes
    const diagnosticCodes = vehicleData.telemetry?.vehicle?.diagnosticCodes;
    if (diagnosticCodes && diagnosticCodes.length > 0) {
      insights.push(`${diagnosticCodes.length} diagnostic code(s) detected`);
      recommendations.push({
        type: 'maintenance',
        priority: 'high',
        title: 'Diagnostic Codes Detected',
        description: 'Vehicle has active diagnostic codes that may need attention.',
        actionable: true,
      });
      healthScore -= 20;
    }

    return {
      summary: `Analysis of ${identity?.make} ${identity?.model} (${identity?.year})`,
      insights,
      confidence: 0.8,
    };
  }

  /**
   * Parse AI analysis response
   */
  private parseAIAnalysis(analysis: string): any {
    // Simple parsing - in production, you'd want more sophisticated parsing
    const lines = analysis.split('\n');
    const summary = lines[0] || 'Vehicle analysis completed';
    const insights = lines.filter(line => line.startsWith('-') || line.startsWith('•')).map(line => line.replace(/^[-•]\s*/, ''));
    
    return {
      summary,
      insights,
      confidence: 0.9,
    };
  }

  /**
   * Generate recommendations based on data and analysis
   */
  private generateRecommendations(vehicleData: any, analysis: any): any[] {
    const recommendations: any[] = [];
    
    // Add recommendations from analysis
    if (analysis.recommendations) {
      recommendations.push(...analysis.recommendations);
    }

    // Add data-driven recommendations
    const telemetry = vehicleData.telemetry?.vehicle?.signalsLatest;
    if (telemetry?.odometer?.value) {
      const mileage = telemetry.odometer.value;
      if (mileage % 5000 < 100) {
        recommendations.push({
          type: 'maintenance',
          priority: 'medium',
          title: 'Maintenance Due Soon',
          description: `Vehicle approaching ${Math.ceil(mileage / 5000) * 5000} miles. Consider scheduling service.`,
          actionable: true,
          estimatedCost: 150,
          timeframe: '30 days',
        });
      }
    }

    return recommendations;
  }

  /**
   * Calculate overall health score
   */
  private calculateHealthScore(vehicleData: any, analysis: any): number {
    let score = 100;
    
    const telemetry = vehicleData.telemetry?.vehicle?.signalsLatest;
    if (telemetry) {
      if (telemetry.fuelLevel?.value < 0.2) score -= 10;
      if (telemetry.batteryLevel?.value < 0.3) score -= 15;
      
      // Check tire pressure
      const tirePressure = telemetry.tirePressure;
      if (tirePressure) {
        const pressures = [tirePressure.frontLeft, tirePressure.frontRight, tirePressure.rearLeft, tirePressure.rearRight];
        const lowPressure = pressures.some(p => p?.value < 30);
        if (lowPressure) score -= 10;
      }
    }

    // Check diagnostic codes
    const diagnosticCodes = vehicleData.telemetry?.vehicle?.diagnosticCodes;
    if (diagnosticCodes && diagnosticCodes.length > 0) {
      score -= diagnosticCodes.length * 5;
    }

    return Math.max(score, 0);
  }

  /**
   * Generate contextual follow-up questions
   */
  private generateFollowUpQuestions(query: AIVehicleQuery, analysis: any): string[] {
    const questions: string[] = [];
    
    if (query.query.toLowerCase().includes('health')) {
      questions.push('Show detailed diagnostic information');
      questions.push('Compare with last month\'s health data');
    }
    
    if (query.query.toLowerCase().includes('maintenance')) {
      questions.push('Schedule maintenance appointment');
      questions.push('Get cost estimates for recommended services');
    }
    
    if (query.query.toLowerCase().includes('trip')) {
      questions.push('Plan optimal route');
      questions.push('Check weather conditions for trip');
    }
    
    // Always include general options
    questions.push('Ask another question');
    questions.push('Get detailed vehicle report');
    
    return questions.slice(0, 4);
  }

  /**
   * Specialized health assessment
   */
  async assessVehicleHealth(tokenId: number): Promise<VehicleHealthAssessment> {
    const query: AIVehicleQuery = {
      query: 'Perform a comprehensive health assessment of my vehicle. Check all systems and provide detailed analysis.',
      vehicleTokenId: tokenId,
    };

    const result = await this.analyzeVehicle(query);
    
    if (!result.success) {
      throw new Error(result.error || 'Health assessment failed');
    }

    // Parse the analysis into structured health assessment
    return this.parseHealthAssessment(result);
  }

  /**
   * Trip readiness assessment
   */
  async assessTripReadiness(tokenId: number, destination?: string): Promise<TripReadinessAssessment> {
    const query: AIVehicleQuery = {
      query: destination 
        ? `Is my vehicle ready for a trip to ${destination}? Check all systems for trip readiness.`
        : 'Is my vehicle ready for a long trip? Perform comprehensive readiness check.',
      vehicleTokenId: tokenId,
    };

    const result = await this.analyzeVehicle(query);
    
    if (!result.success) {
      throw new Error(result.error || 'Trip readiness assessment failed');
    }

    return this.parseTripReadiness(result);
  }

  /**
   * Parse health assessment from AI analysis
   */
  private parseHealthAssessment(result: AIVehicleResponse): VehicleHealthAssessment {
    const telemetry = result.dataSources.telemetry?.vehicle?.signalsLatest;
    
    const systems = {
      engine: { score: 85, status: 'Good', issues: [] },
      battery: { score: 90, status: 'Good', issues: [] },
      tires: { score: 80, status: 'Good', issues: [] },
      fluids: { score: 85, status: 'Good', issues: [] },
      diagnostics: { score: 95, status: 'Good', issues: [] },
    };

    // Analyze each system based on telemetry
    if (telemetry) {
      if (telemetry.engineRpm?.value > 3000) {
        systems.engine.score -= 10;
        systems.engine.issues.push('High engine RPM detected');
      }
      
      if (telemetry.coolantTemp?.value > 220) {
        systems.engine.score -= 15;
        systems.engine.issues.push('High coolant temperature');
      }
      
      if (telemetry.batteryLevel?.value < 0.3) {
        systems.battery.score -= 20;
        systems.battery.issues.push('Low battery level');
      }
      
      if (telemetry.fuelLevel?.value < 0.2) {
        systems.fluids.score -= 10;
        systems.fluids.issues.push('Low fuel level');
      }
    }

    // Check diagnostic codes
    const diagnosticCodes = result.dataSources.telemetry?.vehicle?.diagnosticCodes;
    if (diagnosticCodes && diagnosticCodes.length > 0) {
      systems.diagnostics.score -= diagnosticCodes.length * 10;
      systems.diagnostics.issues.push(`${diagnosticCodes.length} diagnostic code(s) active`);
    }

    // Convert recommendations to the expected format
    const recommendations = result.analysis.recommendations.map(rec => ({
      priority: rec.priority,
      action: rec.title,
      cost: rec.estimatedCost,
      timeframe: rec.timeframe || '30 days'
    }));

    return {
      overallScore: result.analysis.healthScore,
      systems,
      recommendations,
    };
  }

  /**
   * Parse trip readiness from AI analysis
   */
  private parseTripReadiness(result: AIVehicleResponse): TripReadinessAssessment {
    const telemetry = result.dataSources.telemetry?.vehicle?.signalsLatest;
    
    const checks = {
      fuel: { status: 'Good', level: telemetry?.fuelLevel?.value },
      battery: { status: 'Good', level: telemetry?.batteryLevel?.value },
      tires: { status: 'Good', pressure: telemetry?.tirePressure },
      fluids: { status: 'Good', issues: [] },
      diagnostics: { status: 'Good', codes: result.dataSources.telemetry?.vehicle?.diagnosticCodes },
    };

    const blockers: string[] = [];
    const warnings: string[] = [];

    // Check fuel/battery
    if (telemetry?.fuelLevel?.value < 0.2) {
      checks.fuel.status = 'Low';
      warnings.push('Low fuel level');
    }
    
    if (telemetry?.batteryLevel?.value < 0.3) {
      checks.battery.status = 'Low';
      warnings.push('Low battery level');
    }

    // Check tire pressure
    if (telemetry?.tirePressure) {
      const pressures = [telemetry.tirePressure.frontLeft, telemetry.tirePressure.frontRight, telemetry.tirePressure.rearLeft, telemetry.tirePressure.rearRight];
      const lowPressure = pressures.some(p => p?.value < 30);
      if (lowPressure) {
        checks.tires.status = 'Low Pressure';
        warnings.push('Low tire pressure detected');
      }
    }

    // Check diagnostic codes
    if (checks.diagnostics.codes && checks.diagnostics.codes.length > 0) {
      checks.diagnostics.status = 'Issues Detected';
      blockers.push(`${checks.diagnostics.codes.length} diagnostic code(s) active`);
    }

    const readinessScore = result.analysis.healthScore;
    const isReady = readinessScore >= 80 && blockers.length === 0;

    return {
      isReady,
      readinessScore,
      checks,
      blockers,
      warnings,
      recommendations: result.analysis.recommendations.map(r => r.description),
    };
  }
}

// Export singleton instance
export const aiVehicleService = new AIVehicleService(); 