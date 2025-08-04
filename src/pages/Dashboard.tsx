import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { VehicleCard } from "@/components/VehicleCard";
import { McpTest } from "@/components/McpTest";
import { 
  Car, 
  Wrench, 
  Zap, 
  Route,
  Plus,
  Battery,
  Fuel,
  AlertTriangle,
  CheckCircle,
  Bot,
  RefreshCw,
  Sparkles,
  MapPin,
  TestTube
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/hooks/use-toast";
// Mock vehicle data interface
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

interface UserAuthData {
  tokenId: number;
  vehicleId: string;
  permissions: string[];
  jwt?: string;
  walletAddress?: string;
}

// Mock service for vehicle data
const mockVehicleService = {
  getVehicles(): DimoVehicle[] {
    return [
      {
        id: 'mercedes-c-class-2014',
        name: 'Mercedes-Benz C-Class',
        model: 'C-Class',
        year: 2014,
        type: 'gas',
        healthScore: 85,
        status: 'optimal',
        fuelLevel: 0.60,
        mileage: 45000,
        lastService: '2024-01-10',
        aiInsight: 'Your Mercedes-Benz C-Class is running smoothly. Regular maintenance schedule is up to date.',
        tokenId: 8,
        location: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
      },
      {
        id: 'tesla-model-3',
        name: 'Tesla Model 3',
        model: 'Model 3',
        year: 2023,
        type: 'electric',
        healthScore: 92,
        status: 'optimal',
        batteryLevel: 0.85,
        mileage: 12500,
        lastService: '2024-01-15',
        aiInsight: 'Your Tesla is performing excellently. Battery health is optimal and no maintenance is required.',
        tokenId: 8,
        location: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
      },
      {
        id: 'bmw-i4',
        name: 'BMW i4',
        model: 'i4',
        year: 2024,
        type: 'electric',
        healthScore: 78,
        status: 'attention',
        batteryLevel: 0.65,
        mileage: 8900,
        lastService: '2024-02-01',
        aiInsight: 'BMW i4 shows slight battery degradation. Consider scheduling a diagnostic check.',
        tokenId: 8,
        location: { latitude: 40.7128, longitude: -74.0060 }, // New York
      },
      {
        id: 'honda-civic',
        name: 'Honda Civic',
        model: 'Civic',
        year: 2022,
        type: 'gas',
        healthScore: 88,
        status: 'optimal',
        fuelLevel: 0.75,
        mileage: 18500,
        lastService: '2024-01-20',
        aiInsight: 'Honda Civic is in great condition. Next oil change recommended in 2,000 miles.',
        tokenId: 8,
        location: { latitude: 34.0522, longitude: -118.2437 }, // Los Angeles
      }
    ];
  },

  getVehiclesForUser(userAuthData: UserAuthData): Promise<DimoVehicle[]> {
    // Ensure all vehicles use the authenticated user's token ID
    const vehicles = this.getVehicles();
    return Promise.resolve(vehicles.map(vehicle => ({
      ...vehicle,
      tokenId: userAuthData.tokenId || 8
    })));
  }
};

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<DimoVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authData, setAuthData] = useState<any>(null);
  const [selectedAIAnalysis, setSelectedAIAnalysis] = useState<any>(null);

  // AI System Status Query - will be enabled once tRPC server is set up
  // const { data: aiStatus } = trpc.ai.getSystemStatus.useQuery();

  // Load vehicles for authenticated user
  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get auth data from localStorage
      const storedAuth = localStorage.getItem('dimoAuth');
      let userAuthData: UserAuthData | null = null;

      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        setAuthData(parsedAuth);
        
        userAuthData = {
          tokenId: parsedAuth.tokenId || 8,
          vehicleId: parsedAuth.vehicles?.[0]?.id || '',
          permissions: parsedAuth.permissions || [],
          jwt: parsedAuth.jwt,
          walletAddress: parsedAuth.walletAddress // Add wallet address from stored auth data
        };
      }

      if (userAuthData && userAuthData.jwt) {
        // Use real authenticated data
        console.log('Using authenticated user data:', userAuthData);
        const vehicleData = await mockVehicleService.getVehiclesForUser(userAuthData);
        setVehicles(vehicleData);
      } else {
        // Fallback to mock data for unauthenticated users
        console.log('No auth data found, using mock data');
        const vehicleData = mockVehicleService.getVehicles();
        setVehicles(vehicleData);
      }
    } catch (err) {
      setError('Failed to load vehicles. Using mock data as fallback.');
      console.error('Error loading vehicles:', err);
      // Load mock data as fallback
      const vehicleData = mockVehicleService.getVehicles();
      setVehicles(vehicleData);
    } finally {
      setLoading(false);
    }
  };

  // Load vehicles on component mount
  useEffect(() => {
    loadVehicles();
  }, []);

  // Refresh vehicles data
  const handleRefresh = () => {
    loadVehicles();
  };

  const handleAIAnalysisComplete = (analysis: any) => {
    setSelectedAIAnalysis(analysis);
    toast({
      title: "AI Analysis Complete",
      description: "Vehicle analysis has been completed successfully.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-success';
      case 'attention': return 'text-warning';
      case 'service': return 'text-destructive';
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

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-destructive';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 85) return CheckCircle;
    if (score >= 70) return AlertTriangle;
    return Wrench;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vehicle Dashboard</h1>
          <p className="text-muted-foreground">
            {authData ? 'Connected to DIMO' : 'Demo Mode - Sign in to see your real vehicles'}
          </p>
          {authData && (
            <p className="text-sm text-muted-foreground">
              Token ID: {authData.tokenId} • Vehicles: {vehicles.length}
            </p>
          )}
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* AI Status Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <h3 className="font-medium">AI Vehicle Genius Available</h3>
            <p className="text-sm text-muted-foreground">
              Click AI action buttons on any vehicle card to get intelligent insights, maintenance recommendations, and trip readiness assessments.
            </p>
          </div>
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            onAIAnalysisComplete={handleAIAnalysisComplete}
            showFullFeatures={true}
          />
        ))}
      </div>

      {/* AI Analysis Results */}
      {selectedAIAnalysis && (
        <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Latest AI Analysis Results</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedAIAnalysis.healthScore !== undefined && (
              <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Health Score</span>
                </div>
                <p className="text-2xl font-bold text-green-500 mt-2">
                  {selectedAIAnalysis.healthScore}%
                </p>
              </div>
            )}
            
            {selectedAIAnalysis.readinessScore !== undefined && (
              <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Route className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Trip Ready</span>
                </div>
                <p className={`text-2xl font-bold mt-2 ${selectedAIAnalysis.isReady ? 'text-green-500' : 'text-yellow-500'}`}>
                  {selectedAIAnalysis.readinessScore}%
                </p>
              </div>
            )}
            
            {selectedAIAnalysis.totalEstimatedCost !== undefined && (
              <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-orange-500" />
                  <span className="font-medium">Maintenance Cost</span>
                </div>
                <p className="text-2xl font-bold text-orange-500 mt-2">
                  ${selectedAIAnalysis.totalEstimatedCost}
                </p>
              </div>
            )}
            
            {selectedAIAnalysis.serviceCount !== undefined && (
              <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Services Found</span>
                </div>
                <p className="text-2xl font-bold text-purple-500 mt-2">
                  {selectedAIAnalysis.serviceCount}
                </p>
              </div>
            )}
          </div>
          
          {selectedAIAnalysis.data?.response?.followUpSuggestions && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-medium mb-2">AI Suggestions:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedAIAnalysis.data.response.followUpSuggestions.map((suggestion: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Vehicle Button */}
      <div className="flex justify-center">
        <Button variant="outline" size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* MCP Server Test Section */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <TestTube className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-semibold">DIMO MCP Server Test</h2>
        </div>
        <McpTest />
      </div>
    </div>
  );
}