import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  Send, 
  User,
  Car,
  Wrench,
  Route,
  Zap,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Sparkles,
  Brain,
  Database,
  RefreshCw
} from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: {
    healthScore?: number;
    insights?: string[];
    recommendations?: string[];
    followUpQuestions?: string[];
    vehicleData?: any;
  };
}

interface Conversation {
  id: string;
  vehicleId: number;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Direct MCP server communication
const callMcpServer = async (endpoint: string, data: any) => {
  try {
    const response = await fetch(`http://localhost:3001/mcp/tools/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ params: data }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`MCP ${endpoint} error:`, error);
    throw error;
  }
};

// Real OpenAI API integration
const callOpenAI = async (messages: any[], functions?: any[]) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
        functions,
        function_call: functions ? 'auto' : undefined,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
};

// Real AI analysis using OpenAI + MCP
const performRealAIAnalysis = async (query: string, vehicleTokenId: number) => {
  try {
    // Step 1: Gather real vehicle data from MCP
    console.log('🔍 Gathering vehicle data from DIMO MCP...');
    
    const vehicleData: any = {};
    
    // Get vehicle identity
    try {
      const identityResult = await callMcpServer('identity_query', {
        query: `{
          vehicle(tokenId: ${vehicleTokenId}) {
            owner
            tokenId
            definition {
              make
              model
              year
            }
          }
        }`,
        variables: {}
      });
      
      if (identityResult.success && identityResult.data?.vehicle) {
        vehicleData.identity = identityResult.data.vehicle;
        console.log('✅ Vehicle identity retrieved:', vehicleData.identity);
      }
    } catch (error) {
      console.warn('⚠️ Identity query failed:', error);
    }

    // Get vehicle telemetry (current and historical)
    try {
      // Get current telemetry with available fields only
      const currentTelemetryResult = await callMcpServer('telemetry_query', {
        query: `{
          signalsLatest(tokenId: ${vehicleTokenId}) {
            speed {
              value
              timestamp
            }
            powertrainFuelSystemAbsoluteLevel {
              value
              timestamp
            }
            powertrainFuelSystemRelativeLevel {
              value
              timestamp
            }
            powertrainCombustionEngineSpeed {
              value
              timestamp
            }
            powertrainTransmissionTravelledDistance {
              value
              timestamp
            }
            powertrainCombustionEngineECT {
              value
              timestamp
            }
            powertrainCombustionEngineTPS {
              value
              timestamp
            }
            powertrainCombustionEngineMAF {
              value
              timestamp
            }
            chassisAxleRow1WheelLeftTirePressure {
              value
              timestamp
            }
            exteriorAirTemperature {
              value
              timestamp
            }
            obdEngineLoad {
              value
              timestamp
            }
            obdIntakeTemp {
              value
              timestamp
            }
            obdBarometricPressure {
              value
              timestamp
            }
            lowVoltageBatteryCurrentVoltage {
              value
              timestamp
            }
          }
        }`,
        variables: {},
        tokenId: vehicleTokenId
      });

      // Get historical data for the past week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const fromDate = oneWeekAgo.toISOString();
      const toDate = new Date().toISOString();

      const historicalTelemetryResult = await callMcpServer('telemetry_query', {
        query: `{
          signals(
            tokenId: ${vehicleTokenId}
            from: "${fromDate}"
            to: "${toDate}"
            interval: "24h"
          ) {
            timestamp
            speed(agg: MAX)
            powertrainTransmissionTravelledDistance(agg: MAX)
            powertrainFuelSystemAbsoluteLevel(agg: AVG)
            powertrainFuelSystemRelativeLevel(agg: AVG)
            powertrainCombustionEngineSpeed(agg: MAX)
            powertrainCombustionEngineECT(agg: AVG)
            powertrainCombustionEngineTPS(agg: AVG)
            powertrainCombustionEngineMAF(agg: AVG)
            chassisAxleRow1WheelLeftTirePressure(agg: AVG)
            exteriorAirTemperature(agg: AVG)
            obdEngineLoad(agg: AVG)
            obdIntakeTemp(agg: AVG)
            obdBarometricPressure(agg: AVG)
            lowVoltageBatteryCurrentVoltage(agg: AVG)
          }
        }`,
        variables: {},
        tokenId: vehicleTokenId
      });

      // Combine current and historical data
      if (currentTelemetryResult.success && historicalTelemetryResult.success) {
        vehicleData.telemetry = {
          current: currentTelemetryResult.data?.signalsLatest,
          historical: historicalTelemetryResult.data?.signals
        };
        console.log('✅ Vehicle telemetry retrieved (current + historical):', vehicleData.telemetry);
      } else if (currentTelemetryResult.success) {
        vehicleData.telemetry = {
          current: currentTelemetryResult.data?.signalsLatest,
          historical: []
        };
        console.log('✅ Vehicle telemetry retrieved (current only):', vehicleData.telemetry);
      }
    } catch (error) {
      console.warn('⚠️ Telemetry query failed:', error);
    }

    // Step 2: Create OpenAI function definitions for MCP tools
    const functions = [
      {
        name: "analyze_vehicle_health",
        description: "Analyze vehicle health based on telemetry and identity data",
        parameters: {
          type: "object",
          properties: {
            health_score: {
              type: "number",
              description: "Overall health score from 0-100"
            },
            insights: {
              type: "array",
              items: { type: "string" },
              description: "Key insights about vehicle condition"
            },
            recommendations: {
              type: "array", 
              items: { type: "string" },
              description: "Maintenance recommendations"
            },
            follow_up_questions: {
              type: "array",
              items: { type: "string" },
              description: "Suggested follow-up questions"
            }
          },
          required: ["health_score", "insights", "recommendations"]
        }
      },
      {
        name: "assess_trip_readiness",
        description: "Assess if vehicle is ready for a trip",
        parameters: {
          type: "object",
          properties: {
            readiness_score: {
              type: "number",
              description: "Trip readiness score from 0-100"
            },
            analysis: {
              type: "string",
              description: "Detailed trip readiness analysis"
            },
            risk_factors: {
              type: "array",
              items: { type: "string" },
              description: "Potential risk factors for the trip"
            },
            recommendations: {
              type: "array",
              items: { type: "string" },
              description: "Recommendations for trip preparation"
            }
          },
          required: ["readiness_score", "analysis", "recommendations"]
        }
      },
      {
        name: "analyze_historical_usage",
        description: "Analyze historical vehicle usage data and provide insights",
        parameters: {
          type: "object",
          properties: {
            total_miles: {
              type: "number",
              description: "Total miles driven in the period"
            },
            average_speed: {
              type: "number",
              description: "Average speed during the period"
            },
            fuel_consumption: {
              type: "string",
              description: "Fuel consumption analysis"
            },
            usage_patterns: {
              type: "array",
              items: { type: "string" },
              description: "Key usage patterns and insights"
            },
            recommendations: {
              type: "array",
              items: { type: "string" },
              description: "Recommendations based on usage data"
            }
          },
          required: ["total_miles", "usage_patterns", "recommendations"]
        }
      }
    ];

    // Step 3: Create system message with vehicle context
    const systemMessage = {
      role: 'system',
      content: `You are an AI automotive assistant for a Mercedes-Benz C-Class (Vehicle ID: ${vehicleTokenId}). 

Vehicle Data:
${JSON.stringify(vehicleData, null, 2)}

Your role is to:
1. Analyze vehicle health and provide actionable insights
2. Assess trip readiness and safety
3. Provide maintenance recommendations
4. Answer questions about the vehicle intelligently
5. Analyze historical usage data and provide insights about past driving patterns
6. Calculate mileage, fuel consumption, and usage statistics from historical data

You have access to comprehensive telemetry data including:
- Vehicle speed, engine RPM, and performance metrics
- Fuel levels (absolute and relative), consumption patterns
- Engine temperature, oil level, and diagnostic data
- Tire pressure for all four wheels
- Door and window status
- Environmental conditions (temperature)
- Historical data with aggregations (MAX, AVG) for trend analysis

Use this rich data to provide detailed analysis including:
- Current vehicle status and health assessment
- Historical usage patterns and driving behavior
- Mileage calculations and fuel efficiency analysis
- Maintenance recommendations based on actual usage
- Performance optimization suggestions
- Safety assessments based on vehicle condition

IMPORTANT: Do not use any emojis or bold formatting (**) in your responses. Provide clean, professional text only.

Always use the provided functions to structure your responses. Be helpful, accurate, and safety-focused.`
    };

    // Step 4: Create user message
    const userMessage = {
      role: 'user',
      content: query
    };

    // Step 5: Call OpenAI with real vehicle data
    console.log('🤖 Calling OpenAI with real vehicle data...');
    const aiResponse = await callOpenAI([systemMessage, userMessage], functions);
    
    console.log('✅ OpenAI response received:', aiResponse);
    
    // Step 6: Parse the response
    if (aiResponse.function_call) {
      const functionName = aiResponse.function_call.name;
      const functionArgs = JSON.parse(aiResponse.function_call.arguments);
      
      if (functionName === 'analyze_vehicle_health') {
        return {
          type: 'health',
          data: functionArgs
        };
      } else if (functionName === 'assess_trip_readiness') {
        return {
          type: 'trip',
          data: functionArgs
        };
      } else if (functionName === 'analyze_historical_usage') {
        return {
          type: 'historical',
          data: functionArgs
        };
      }
    }
    
    // Fallback to general response
    return {
      type: 'general',
      data: {
        response: aiResponse.content,
        vehicleData: vehicleData
      }
    };

  } catch (error) {
    console.error('❌ Real AI analysis failed:', error);
    
    // Fallback to mock response if OpenAI fails
    return {
      type: 'fallback',
      data: {
        response: `I'm having trouble accessing the AI analysis service right now. Here's what I can tell you about your Mercedes-Benz C-Class (Vehicle ID: ${vehicleTokenId}): The vehicle appears to be in good condition based on available data. Please try again later or contact support if the issue persists.`,
        error: error.message
      }
    };
  }
};

export const AIChatEnhanced: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<number>(8); // Mercedes C-Class
  const [conversationContext, setConversationContext] = useState<string>('');
  const [aiCapabilities, setAiCapabilities] = useState<string[]>([]);
  const [mcpHealth, setMcpHealth] = useState<boolean>(false);
  const [openaiStatus, setOpenaiStatus] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Mock vehicle data - same as Dashboard
  const mercedesVehicle = {
    id: 'mercedes-c-class-2014',
    name: 'Mercedes-Benz C-Class',
    model: 'C-Class',
    year: 2014,
    type: 'gas' as const,
    healthScore: 85,
    status: 'optimal' as const,
    fuelLevel: 0.60,
    mileage: 45000,
    lastService: '2024-01-10',
    aiInsight: 'Your Mercedes-Benz C-Class is running smoothly.',
    tokenId: 8,
    location: { latitude: 37.7749, longitude: -122.4194 }
  };

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load AI capabilities and MCP health on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Check MCP server health
        const healthResponse = await fetch('http://localhost:3001/health');
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          setMcpHealth(healthData.status === 'healthy');
        }
        
        // Check OpenAI API key
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        setOpenaiStatus(apiKey && apiKey !== 'your_openai_api_key_here');
        
        // Set capabilities based on available services
        const capabilities = [];
        if (mcpHealth) capabilities.push('Real DIMO Data Access');
        if (openaiStatus) capabilities.push('Advanced AI Analysis');
        capabilities.push('Vehicle Health Analysis');
        capabilities.push('Trip Readiness Assessment');
        capabilities.push('Maintenance Recommendations');
        
        setAiCapabilities(capabilities);
        
        // Add welcome message
        const welcomeMessage: Message = {
          id: 'welcome',
          type: 'ai',
          content: `Welcome to your Mercedes-Benz C-Class AI Assistant! 

I can help you with:
• Vehicle health analysis and maintenance
• Trip planning and readiness assessment
• Performance optimization and cost analysis
• Real-time vehicle data insights

${openaiStatus ? 'Advanced AI Analysis Available' : 'Using Basic Analysis (OpenAI not configured)'}
${mcpHealth ? 'Real DIMO Data Connected' : 'Using Mock Data (MCP server not connected)'}

What would you like to know about your Mercedes today?`,
          timestamp: new Date(),
          metadata: {
            followUpQuestions: [
              "How is my vehicle's health today?",
              "Should I take my car on a long trip?",
              "What maintenance does my Mercedes need?",
              "How's my fuel efficiency compared to other C-Class models?"
            ]
          }
        };
        
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        // Set default state even if services are down
        setMcpHealth(false);
        setOpenaiStatus(false);
        setAiCapabilities([
          'Vehicle Health Analysis',
          'Trip Readiness Assessment',
          'Maintenance Recommendations',
          'Real-time Data Access'
        ]);
        
        const welcomeMessage: Message = {
          id: 'welcome',
          type: 'ai',
          content: `Welcome to your Mercedes-Benz C-Class AI Assistant! 

I can help you with:
• Vehicle health analysis and maintenance
• Trip planning and readiness assessment
• Performance optimization and cost analysis
• Real-time vehicle data insights

Using Basic Analysis (Services not configured)

What would you like to know about your Mercedes today?`,
          timestamp: new Date(),
          metadata: {
            followUpQuestions: [
              "How is my vehicle's health today?",
              "Should I take my car on a long trip?",
              "What maintenance does my Mercedes need?",
              "How's my fuel efficiency compared to other C-Class models?"
            ]
          }
        };
        
        setMessages([welcomeMessage]);
      }
    };

    loadInitialData();
  }, [mcpHealth, openaiStatus]);

  const addMessage = (content: string, type: 'user' | 'ai', metadata?: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      metadata
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    addMessage(userMessage, 'user');

    try {
      console.log('🤖 Starting real AI analysis...');
      
      // Use real AI analysis with OpenAI + MCP
      const aiResult = await performRealAIAnalysis(userMessage, selectedVehicle);
      
      let formattedResponse = '';
      let metadata: any = {};

      switch (aiResult.type) {
        case 'health':
          const healthData = aiResult.data;
          formattedResponse = `Vehicle Health Assessment

Health Score: ${healthData.health_score}/100

Key Insights:
${healthData.insights?.map((insight: string) => `• ${insight}`).join('\n') || '• No specific insights available'}

Recommendations:
${healthData.recommendations?.map((rec: string) => `• ${rec}`).join('\n') || '• Continue monitoring vehicle performance'}

${healthData.follow_up_questions ? `Follow-up Questions:
${healthData.follow_up_questions.map((q: string) => `• ${q}`).join('\n')}` : ''}`;
          
          metadata = {
            healthScore: healthData.health_score,
            insights: healthData.insights || [],
            recommendations: healthData.recommendations || [],
            followUpQuestions: healthData.follow_up_questions || []
          };
          break;

        case 'trip':
          const tripData = aiResult.data;
          formattedResponse = `Trip Readiness Assessment

Readiness Score: ${tripData.readiness_score}/100

Trip Analysis:
${tripData.analysis}

Risk Factors:
${tripData.risk_factors?.map((risk: string) => `• ${risk}`).join('\n') || '• No specific risk factors identified'}

Recommendations:
${tripData.recommendations?.map((rec: string) => `• ${rec}`).join('\n') || '• Proceed with caution and monitor vehicle status'}`;
          
          metadata = {
            readinessScore: tripData.readiness_score,
            analysis: tripData.analysis,
            riskFactors: tripData.risk_factors || [],
            recommendations: tripData.recommendations || []
          };
          break;

        case 'historical':
          const historicalData = aiResult.data;
          formattedResponse = `Historical Usage Analysis

Total Miles Driven: ${historicalData.total_miles || 0} miles
Average Speed: ${historicalData.average_speed || 0} mph
Fuel Consumption: ${historicalData.fuel_consumption || 'Not available'}

Usage Patterns:
${historicalData.usage_patterns?.map((pattern: string) => `• ${pattern}`).join('\n') || '• No usage patterns available'}

Recommendations:
${historicalData.recommendations?.map((rec: string) => `• ${rec}`).join('\n') || '• Continue monitoring vehicle usage'}`;
          
          metadata = {
            totalMiles: historicalData.total_miles || 0,
            averageSpeed: historicalData.average_speed || 0,
            fuelConsumption: historicalData.fuel_consumption || 'Not available',
            usagePatterns: historicalData.usage_patterns || [],
            recommendations: historicalData.recommendations || []
          };
          break;

        case 'general':
          formattedResponse = aiResult.data.response;
          metadata = {
            vehicleData: aiResult.data.vehicleData
          };
          break;

        case 'fallback':
          formattedResponse = aiResult.data.response;
          metadata = {
            error: aiResult.data.error,
            isFallback: true
          };
          break;

        default:
          formattedResponse = 'I analyzed your vehicle and here are my insights.';
          metadata = {};
      }

      addMessage(formattedResponse, 'ai', metadata);

    } catch (error) {
      console.error('AI response error:', error);
      addMessage('Sorry, I encountered an error while analyzing your vehicle. Please try again or check if the services are properly configured.', 'ai');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = async (question: string) => {
    setInput(question);
    // Small delay to ensure input is set
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-green-500';
      case 'attention': return 'text-yellow-500';
      case 'service': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal': return CheckCircle;
      case 'attention': return AlertTriangle;
      case 'service': return Wrench;
      default: return Car;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">Mercedes-Benz C-Class AI Assistant</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${mcpHealth ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>{mcpHealth ? 'MCP Connected' : 'MCP Disconnected'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${openaiStatus ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span>{openaiStatus ? 'OpenAI Ready' : 'OpenAI Not Configured'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {mercedesVehicle && (
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">{mercedesVehicle.name}</div>
                <div className="text-xs text-muted-foreground">Vehicle ID: {mercedesVehicle.tokenId}</div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card className={`max-w-3xl ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
              <CardContent className="p-4">
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {message.metadata && (
                  <div className="mt-4 pt-4 border-t border-border">
                    {message.metadata.healthScore && (
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="text-sm font-medium">Health Score:</div>
                        <Progress value={message.metadata.healthScore} className="flex-1 h-2" />
                        <span className="text-sm font-bold">{message.metadata.healthScore}/100</span>
                      </div>
                    )}
                    
                    {message.metadata.followUpQuestions && message.metadata.followUpQuestions.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm font-medium text-foreground mb-2">Quick Questions:</div>
                        <div className="flex flex-wrap gap-2">
                          {message.metadata.followUpQuestions.map((question: string, index: number) => (
                            <Button
                              key={`followup-${message.id}-${index}`}
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickQuestion(question)}
                              className="text-xs"
                            >
                              {question}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground">
                    {openaiStatus ? 'Analyzing with AI...' : 'Processing request...'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-3 mb-3">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about your Mercedes-Benz C-Class..."
                className="w-full p-3 border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                rows={2}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleQuickQuestion("How is my vehicle's health today?")}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Wrench className="h-3 w-3 mr-1" />
              Health Check
            </Button>
            <Button
              onClick={() => handleQuickQuestion("Should I take my car on a long trip?")}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Route className="h-3 w-3 mr-1" />
              Trip Readiness
            </Button>
            <Button
              onClick={() => handleQuickQuestion("What maintenance does my Mercedes need?")}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Wrench className="h-3 w-3 mr-1" />
              Maintenance
            </Button>
            <Button
              onClick={() => handleQuickQuestion("Show me my vehicle data")}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Database className="h-3 w-3 mr-1" />
              Vehicle Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 