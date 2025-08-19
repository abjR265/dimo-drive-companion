import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Car, 
  Wrench, 
  Route,
  Battery,
  Fuel,
  AlertTriangle,
  CheckCircle,
  Brain,
  Clock,
  Sparkles,
  FileText,
  Plus
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
  odometer: number;
  lastService: string;
  aiInsight: string;
  tokenId?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  telemetry?: {
    powertrainCombustionEngineSpeed?: { value: number };
    powertrainCombustionEngineECT?: { value: number };
    obdEngineLoad?: { value: number };
    powertrainCombustionEngineTPS?: { value: number };
    obdIntakeTemp?: { value: number };
    obdBarometricPressure?: { value: number };
    obdRunTime?: { value: number };
    obdDTCList?: { value: string };
    exteriorAirTemperature?: { value: number };
    isIgnitionOn?: { value: boolean };
    speed?: { value: number };
  };
}

interface VehicleCardProps {
  vehicle: DimoVehicle;
  onAIAnalysisComplete?: (analysis: any) => void;
  showFullFeatures?: boolean;
}

export function VehicleCard({ vehicle, onAIAnalysisComplete, showFullFeatures = true }: VehicleCardProps) {
  const [lastAIInsight, setLastAIInsight] = useState<any>(null);




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

  // Format engine runtime from seconds to HH:MM:SS
  const formatEngineRuntime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };



  const StatusIcon = getStatusIcon(vehicle.status);
  const HealthIcon = getHealthIcon(vehicle.healthScore);

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{vehicle.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={vehicle.status === 'optimal' ? 'default' : 'secondary'}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {vehicle.status}
            </Badge>
            {vehicle.tokenId && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  try { localStorage.setItem('activeVehicleTokenId', String(vehicle.tokenId)); } catch {}
                  window.location.href = `/ai-chat?tokenId=${vehicle.tokenId}`;
                }}
                className="flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" />
                Ask AI
              </Button>
            )}
          </div>
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
              <Progress value={vehicle.batteryLevel} className="h-2" />
              <span className="text-xs">{Math.round(vehicle.batteryLevel)}%</span>
            </div>
          )}
          
          {vehicle.type !== 'electric' && vehicle.fuelLevel !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Fuel className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Fuel</span>
              </div>
              <Progress value={vehicle.fuelLevel} className="h-2" />
              <span className="text-xs">{Math.round(vehicle.fuelLevel)}%</span>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Route className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-muted-foreground">Odometer</span>
            </div>
            <span className="text-sm font-medium">{vehicle.odometer.toLocaleString()} km</span>
          </div>
        </div>

        {/* Diagnostic & Engine Details */}
        {vehicle.telemetry && (
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Diagnostic & Engine</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Engine RPM */}
              {vehicle.telemetry.powertrainCombustionEngineSpeed?.value !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Engine RPM:</span>
                  <span className="font-medium">
                    {Math.round(vehicle.telemetry.powertrainCombustionEngineSpeed.value)} rpm
                  </span>
                </div>
              )}
              
              {/* Coolant Temperature */}
              {vehicle.telemetry.powertrainCombustionEngineECT?.value !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coolant Temp:</span>
                  <span className="font-medium">
                    {Math.round(vehicle.telemetry.powertrainCombustionEngineECT.value)}°C
                  </span>
                </div>
              )}
              

              
              {/* Engine Runtime */}
              {vehicle.telemetry.obdRunTime?.value !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Engine Runtime:</span>
                  <span className="font-medium">
                    {formatEngineRuntime(vehicle.telemetry.obdRunTime.value)}
                  </span>
                </div>
              )}
              
              {/* Intake Temperature */}
              {vehicle.telemetry.obdIntakeTemp?.value !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Intake Temp:</span>
                  <span className="font-medium">
                    {Math.round(vehicle.telemetry.obdIntakeTemp.value)}°C
                  </span>
                </div>
              )}
              
              {/* Barometric Pressure */}
              {vehicle.telemetry.obdBarometricPressure?.value !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Baro Pressure:</span>
                  <span className="font-medium">
                    {Math.round(vehicle.telemetry.obdBarometricPressure.value)} kPa
                  </span>
                </div>
              )}
              
              {/* Exterior Air Temperature */}
              {vehicle.telemetry.exteriorAirTemperature?.value !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Outside Temp:</span>
                  <span className="font-medium">
                    {Math.round(vehicle.telemetry.exteriorAirTemperature.value)}°C
                  </span>
                </div>
              )}
              
              {/* Ignition Status */}
              {vehicle.telemetry.isIgnitionOn?.value !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ignition:</span>
                  <span className={`font-medium ${vehicle.telemetry.isIgnitionOn.value ? 'text-green-500' : 'text-red-500'}`}>
                    {vehicle.telemetry.isIgnitionOn.value ? 'ON' : 'OFF'}
                  </span>
                </div>
              )}
              
              {/* Current Speed */}
              {vehicle.telemetry.speed?.value !== undefined && vehicle.telemetry.speed.value > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Speed:</span>
                  <span className="font-medium">
                    {Math.round(vehicle.telemetry.speed.value)} km/h
                  </span>
                </div>
              )}
              

              
              {/* Diagnostic Trouble Codes */}
              {vehicle.telemetry.obdDTCList?.value && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DTC Codes:</span>
                  <span className="font-medium text-red-500">
                    {vehicle.telemetry.obdDTCList.value}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}


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

        {/* Document Upload Section */}
        <div className="bg-muted/20 rounded-lg p-3 mt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Documents</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Navigate to document upload page with vehicle info
                window.location.href = `/documents?vehicle=${encodeURIComponent(vehicle.name)}&tokenId=${vehicle.tokenId || ''}`;
              }}
              className="flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Add
            </Button>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-4 flex-shrink-0"></div>
            <p className="text-xs text-muted-foreground text-justify">
              Upload maintenance records, service history, or other vehicle documents
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 