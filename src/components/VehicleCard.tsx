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