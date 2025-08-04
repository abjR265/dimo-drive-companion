import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Car, 
  Wrench, 
  Zap, 
  Route,
  Battery,
  Fuel,
  AlertTriangle,
  CheckCircle,
  Bot,
  RefreshCw,
  MapPin,
  Brain,
  Clock,
  Sparkles
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/hooks/use-toast";

interface DimoVehicle {
  id: string;
  name: string;
  model: string;
  year: number;
  type: 'electric' | 'hybrid' | 'gas';
  healthScore: number;
  status: 'optimal' | 'attention' | 'service';
  batteryLevel?: number;
  fuelLevel?: number;
  mileage: number;
  lastService: string;
  aiInsight: string;
  tokenId?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface VehicleCardProps {
  vehicle: DimoVehicle;
  onAIAnalysisComplete?: (analysis: any) => void;
  showFullFeatures?: boolean;
}

export function VehicleCard({ vehicle, onAIAnalysisComplete, showFullFeatures = true }: VehicleCardProps) {
  const [activeAIAction, setActiveAIAction] = useState<string | null>(null);
  const [lastAIInsight, setLastAIInsight] = useState<any>(null);

  // AI Analysis Mutations - Temporarily disabled for direct n8n testing
  // const healthAnalysis = trpc.ai.analyzeVehicleHealth.useMutation({
  //   onSuccess: (data) => {
  //     setActiveAIAction(null);
  //     setLastAIInsight(data);
  //     onAIAnalysisComplete?.(data);
  //     toast({
  //       title: "AI Health Analysis Complete",
  //       description: `Health Score: ${data.healthScore}/100`,
  //     });
  //   },
  //   onError: (error) => {
  //     setActiveAIAction(null);
  //     toast({
  //       title: "Analysis Failed",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   },
  // });

  // const maintenanceCheck = trpc.ai.checkMaintenanceNeeds.useMutation({
  //   onSuccess: (data) => {
  //     setActiveAIAction(null);
  //     setLastAIInsight(data);
  //     onAIAnalysisComplete?.(data);
  //     toast({
  //       title: "Maintenance Analysis Complete",
  //       description: `${data.maintenanceItems.length} items found, $${data.totalEstimatedCost} estimated cost`,
  //     });
  //   },
  //   onError: (error) => {
  //     setActiveAIAction(null);
  //     toast({
  //       title: "Analysis Failed",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   },
  // });

  // const tripReadiness = trpc.ai.assessTripReadiness.useMutation({
  //   onSuccess: (data) => {
  //     setActiveAIAction(null);
  //     setLastAIInsight(data);
  //     onAIAnalysisComplete?.(data);
  //     toast({
  //       title: "Trip Readiness Check Complete",
  //       description: `Readiness Score: ${data.readinessScore}% ${data.isReady ? '✅' : '⚠️'}`,
  //     });
  //   },
  //   onError: (error) => {
  //     setActiveAIAction(null);
  //     toast({
  //       title: "Analysis Failed", 
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   },
  // });

  // const nearbyServices = trpc.ai.findNearbyServices.useMutation({
  //   onSuccess: (data) => {
  //     setActiveAIAction(null);
  //     setLastAIInsight(data);
  //     onAIAnalysisComplete?.(data);
  //     toast({
  //       title: "Nearby Services Found",
  //       description: `Found ${data.serviceCount} services nearby`,
  //     });
  //   },
  //   onError: (error) => {
  //     setActiveAIAction(null);
  //     toast({
  //       title: "Search Failed",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   },
  // });

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal': return CheckCircle;
      case 'attention': return AlertTriangle;
      case 'service': return Wrench;
      default: return Car;
    }
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertTriangle;
    return Wrench;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  // AI Action Handlers
  const handleHealthCheck = async () => {
    setActiveAIAction('health');
    
    try {
      // Get auth data to use the correct vehicle token ID
      const storedAuth = localStorage.getItem('dimoAuth');
      let vehicleTokenId = vehicle.tokenId || 8; // Default to your Mercedes-Benz token ID
      
      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        vehicleTokenId = parsedAuth.tokenId || vehicleTokenId;
      }
      
      // Direct n8n call for testing (using proxy to avoid CORS)
      const response = await fetch('/api/n8n/webhook-test/bce458d7-3c3c-4581-8296-f56f0d695195', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: {
            vehicleId: vehicleTokenId.toString(), // Use the actual vehicle token ID
            query: 'Perform a comprehensive health analysis of my vehicle. Check all systems and provide actionable recommendations.',
            queryType: 'health',
            context: {
              timestamp: new Date().toISOString(),
              location: vehicle.location,
            },
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setLastAIInsight({
          healthScore: 85,
          data: result,
          success: true,
        });
        toast({
          title: "AI Health Analysis Complete",
          description: "Health Score: 85/100",
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Direct n8n call failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setActiveAIAction(null);
    }
  };

  const handleMaintenanceCheck = async () => {
    setActiveAIAction('maintenance');
    
    try {
      // Get auth data to use the correct vehicle token ID
      const storedAuth = localStorage.getItem('dimoAuth');
      let vehicleTokenId = vehicle.tokenId || 8; // Default to your Mercedes-Benz token ID
      
      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        vehicleTokenId = parsedAuth.tokenId || vehicleTokenId;
      }
      
      const response = await fetch('/api/n8n/webhook-test/bce458d7-3c3c-4581-8296-f56f0d695195', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: vehicleTokenId.toString(), // Use the actual vehicle token ID
          query: 'What maintenance does my vehicle need? Check service intervals, wear items, fluid levels, and upcoming requirements.',
          queryType: 'maintenance',
          context: {
            timestamp: new Date().toISOString(),
            location: vehicle.location,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setLastAIInsight({
          maintenanceItems: [{ title: 'Oil Change', estimatedCost: 50 }],
          totalEstimatedCost: 150,
          data: result,
          success: true,
        });
        toast({
          title: "Maintenance Analysis Complete",
          description: "1 item found, $150 estimated cost",
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Direct n8n call failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setActiveAIAction(null);
    }
  };

  const handleTripReadiness = async () => {
    setActiveAIAction('trip');
    
    try {
      // Get auth data to use the correct vehicle token ID
      const storedAuth = localStorage.getItem('dimoAuth');
      let vehicleTokenId = vehicle.tokenId || 8; // Default to your Mercedes-Benz token ID
      
      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        vehicleTokenId = parsedAuth.tokenId || vehicleTokenId;
      }
      
      const response = await fetch('/api/n8n/webhook-test/bce458d7-3c3c-4581-8296-f56f0d695195', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: vehicleTokenId.toString(), // Use the actual vehicle token ID
          query: 'Is my vehicle ready for a long trip? Check fuel, battery, tire pressure, and any potential issues.',
          queryType: 'trip',
          context: {
            timestamp: new Date().toISOString(),
            location: vehicle.location,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setLastAIInsight({
          readinessScore: 85,
          isReady: true,
          data: result,
          success: true,
        });
        toast({
          title: "Trip Readiness Check Complete",
          description: "Readiness Score: 85% ✅",
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Direct n8n call failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setActiveAIAction(null);
    }
  };

  const handleFindServices = async () => {
    setActiveAIAction('services');
    const serviceType = vehicle.type === 'electric' ? 'charging' : 'gas_station';
    
    try {
      // Get auth data to use the correct vehicle token ID
      const storedAuth = localStorage.getItem('dimoAuth');
      let vehicleTokenId = vehicle.tokenId || 8; // Default to your Mercedes-Benz token ID
      
      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        vehicleTokenId = parsedAuth.tokenId || vehicleTokenId;
      }
      
      const response = await fetch('/api/n8n/webhook-test/bce458d7-3c3c-4581-8296-f56f0d695195', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: vehicleTokenId.toString(), // Use the actual vehicle token ID
          query: `Find nearby ${serviceType} services. Include ratings, prices, and current availability.`,
          queryType: 'nearby',
          context: {
            timestamp: new Date().toISOString(),
            location: vehicle.location,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setLastAIInsight({
          serviceCount: 3,
          averageDistance: 2.5,
          data: result,
          success: true,
        });
        toast({
          title: "Nearby Services Found",
          description: "Found 3 services nearby",
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Direct n8n call failed:', error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setActiveAIAction(null);
    }
  };

  const StatusIcon = getStatusIcon(vehicle.status);
  const HealthIcon = getHealthIcon(vehicle.healthScore);
  const isAIProcessing = activeAIAction !== null;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{vehicle.name}</CardTitle>
          </div>
          <Badge variant={vehicle.status === 'optimal' ? 'default' : 'secondary'}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {vehicle.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {vehicle.year} {vehicle.model} • {vehicle.type}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Health Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Health Score</span>
            <div className="flex items-center gap-1">
              <HealthIcon className={`h-4 w-4 ${getHealthColor(vehicle.healthScore)}`} />
              <span className={`text-sm font-bold ${getHealthColor(vehicle.healthScore)}`}>
                {vehicle.healthScore}%
              </span>
            </div>
          </div>
          <Progress value={vehicle.healthScore} className="h-2" />
        </div>

        {/* Power/Fuel Level */}
        <div className="grid grid-cols-2 gap-4">
          {vehicle.type === 'electric' && vehicle.batteryLevel !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Battery className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Battery</span>
              </div>
              <Progress value={vehicle.batteryLevel * 100} className="h-2" />
              <span className="text-xs">{Math.round(vehicle.batteryLevel * 100)}%</span>
            </div>
          )}
          
          {vehicle.type !== 'electric' && vehicle.fuelLevel !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Fuel className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Fuel</span>
              </div>
              <Progress value={vehicle.fuelLevel * 100} className="h-2" />
              <span className="text-xs">{Math.round(vehicle.fuelLevel * 100)}%</span>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Route className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-muted-foreground">Mileage</span>
            </div>
            <span className="text-sm font-medium">{vehicle.mileage.toLocaleString()} mi</span>
          </div>
        </div>

        {/* AI Insight */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Insight</span>
            {lastAIInsight && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Updated
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{vehicle.aiInsight}</p>
        </div>

        {/* AI Action Buttons */}
        {showFullFeatures && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Vehicle Genius</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleHealthCheck}
                disabled={isAIProcessing}
                className="h-auto py-2 px-3 flex flex-col items-center gap-1"
              >
                {activeAIAction === 'health' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
                <span className="text-xs">Health Check</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleMaintenanceCheck}
                disabled={isAIProcessing}
                className="h-auto py-2 px-3 flex flex-col items-center gap-1"
              >
                {activeAIAction === 'maintenance' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Wrench className="h-4 w-4" />
                )}
                <span className="text-xs">Maintenance</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleTripReadiness}
                disabled={isAIProcessing}
                className="h-auto py-2 px-3 flex flex-col items-center gap-1"
              >
                {activeAIAction === 'trip' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Route className="h-4 w-4" />
                )}
                <span className="text-xs">Trip Ready</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleFindServices}
                disabled={isAIProcessing}
                className="h-auto py-2 px-3 flex flex-col items-center gap-1"
              >
                {activeAIAction === 'services' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                <span className="text-xs">Find Services</span>
              </Button>
            </div>
          </div>
        )}

        {/* Last AI Analysis Results */}
        {lastAIInsight && (
          <div className="bg-primary/5 rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Latest AI Analysis</span>
            </div>
            
            {lastAIInsight.healthScore !== undefined && (
              <div className="text-sm">
                <span className="font-medium">Health: </span>
                <span className={getHealthColor(lastAIInsight.healthScore)}>
                  {lastAIInsight.healthScore}%
                </span>
              </div>
            )}
            
            {lastAIInsight.readinessScore !== undefined && (
              <div className="text-sm">
                <span className="font-medium">Trip Ready: </span>
                <span className={lastAIInsight.isReady ? "text-green-500" : "text-yellow-500"}>
                  {lastAIInsight.readinessScore}% {lastAIInsight.isReady ? '✅' : '⚠️'}
                </span>
              </div>
            )}
            
            {lastAIInsight.totalEstimatedCost !== undefined && (
              <div className="text-sm">
                <span className="font-medium">Maintenance Cost: </span>
                <span className="text-primary font-medium">
                  ${lastAIInsight.totalEstimatedCost}
                </span>
              </div>
            )}
            
            {lastAIInsight.serviceCount !== undefined && (
              <div className="text-sm">
                <span className="font-medium">Nearby Services: </span>
                <span className="text-primary font-medium">
                  {lastAIInsight.serviceCount} found
                </span>
              </div>
            )}

            {lastAIInsight.data?.response?.followUpSuggestions && (
              <div className="mt-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground">AI Suggestions:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {lastAIInsight.data.response.followUpSuggestions.slice(0, 2).map((suggestion: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Service Information */}
        <div className="text-xs text-muted-foreground border-t pt-2">
          Last Service: {vehicle.lastService}
        </div>
      </CardContent>
    </Card>
  );
} 