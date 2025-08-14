import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { VehicleCard } from "@/components/VehicleCard";
import { McpTest } from "@/components/McpTest";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DimoAttestationTest } from "@/components/DimoAttestationTest";
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
  TestTube,
  FileText
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/supabase";
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

// Helper function to convert database vehicle to DimoVehicle format
const convertDbVehicleToDimoVehicle = (dbVehicle: any): DimoVehicle => {
  return {
    id: dbVehicle.id,
    name: dbVehicle.name,
    model: dbVehicle.model,
    year: dbVehicle.year,
    type: dbVehicle.type,
    healthScore: 85, // Default health score
    status: 'optimal' as const,
    fuelLevel: 0.60, // Default fuel level
    mileage: 45000, // Default mileage
    lastService: '2024-01-10', // Default last service
    aiInsight: `Your ${dbVehicle.make} ${dbVehicle.model} is running smoothly. Regular maintenance schedule is up to date.`,
    tokenId: dbVehicle.token_id,
    location: { latitude: 37.7749, longitude: -122.4194 }, // Default location
  };
};

export default function Dashboard() {
  const location = useLocation();
  const [vehicles, setVehicles] = useState<DimoVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authData, setAuthData] = useState<any>(null);
  const [selectedAIAnalysis, setSelectedAIAnalysis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'vehicles' | 'documents' | 'mcp-test' | 'attestation-test'>('vehicles');

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

      // Try to load vehicles from database for authenticated user
      if (userAuthData && userAuthData.walletAddress) {
        try {
          // Loading vehicles for user (wallet address sanitized)
          
          // First, get the user from the database
          const user = await db.getUserByWallet(userAuthData.walletAddress);
          // User retrieved from database
          
          if (user) {
            console.log('✅ Found user in database');
            
            // Load vehicles for this user
            const dbVehicles = await db.getVehiclesByUserId(user.id);
            console.log('🚗 Loaded vehicles from database:', dbVehicles.length);
            
            // Convert to DimoVehicle format
            const vehicleData = dbVehicles.map(convertDbVehicleToDimoVehicle);
            setVehicles(vehicleData);
          } else {
            console.log('❌ User not found in database, using fallback');
            // Create a fallback vehicle for document upload
            const fallbackVehicle: DimoVehicle = {
              id: '550e8400-e29b-41d4-a716-446655440000',
              name: 'Demo Vehicle',
              model: 'Demo Model',
              year: 2024,
              type: 'gas',
              healthScore: 85,
              status: 'optimal',
              fuelLevel: 0.60,
              mileage: 45000,
              lastService: '2024-01-10',
              aiInsight: 'Demo vehicle for testing document upload.',
              tokenId: userAuthData.tokenId,
              location: { latitude: 37.7749, longitude: -122.4194 },
            };
            setVehicles([fallbackVehicle]);
          }
        } catch (dbError) {
          console.error('Database error loading vehicles:', dbError);
          // Fallback to demo vehicle
          const fallbackVehicle: DimoVehicle = {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Demo Vehicle',
            model: 'Demo Model',
            year: 2024,
            type: 'gas',
            healthScore: 85,
            status: 'optimal',
            fuelLevel: 0.60,
            mileage: 45000,
            lastService: '2024-01-10',
            aiInsight: 'Demo vehicle for testing document upload.',
            tokenId: userAuthData.tokenId || 8,
            location: { latitude: 37.7749, longitude: -122.4194 },
          };
          setVehicles([fallbackVehicle]);
        }
      } else {
        // No auth data, use demo vehicle
        console.log('No auth data found, using demo vehicle');
        const fallbackVehicle: DimoVehicle = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Demo Vehicle',
          model: 'Demo Model',
          year: 2024,
          type: 'gas',
          healthScore: 85,
          status: 'optimal',
          fuelLevel: 0.60,
          mileage: 45000,
          lastService: '2024-01-10',
          aiInsight: 'Demo vehicle for testing document upload.',
          tokenId: 8,
          location: { latitude: 37.7749, longitude: -122.4194 },
        };
        setVehicles([fallbackVehicle]);
      }
    } catch (err) {
      setError('Failed to load vehicles. Using mock data as fallback.');
      console.error('Error loading vehicles:', err);
      // Load demo vehicle as fallback
      const fallbackVehicle: DimoVehicle = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Demo Vehicle',
        model: 'Demo Model',
        year: 2024,
        type: 'gas',
        healthScore: 85,
        status: 'optimal',
        fuelLevel: 0.60,
        mileage: 45000,
        lastService: '2024-01-10',
        aiInsight: 'Demo vehicle for testing document upload.',
        tokenId: 8,
        location: { latitude: 37.7749, longitude: -122.4194 },
      };
      setVehicles([fallbackVehicle]);
    } finally {
      setLoading(false);
    }
  };

  // Load vehicles on component mount
  useEffect(() => {
    loadVehicles();
  }, []);

  // Set active tab based on route
  useEffect(() => {
    if (location.pathname === '/documents') {
      setActiveTab('documents');
    }
  }, [location.pathname]);

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

  const handleDocumentProcessed = (document: any) => {
    toast({
      title: "Document Processed Successfully",
      description: `AI analysis completed for ${document.originalName}`,
    });
    
    // You can add logic here to update vehicle information based on processed documents
    console.log('Processed document:', document);
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
          <h1 className="text-3xl font-bold text-foreground">
            {activeTab === 'documents' ? 'Document Upload' : 'Vehicle Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {activeTab === 'documents' 
              ? 'Upload vehicle documents for AI-powered analysis and insights'
              : (authData ? 'Connected to DIMO' : 'Demo Mode - Sign in to see your real vehicles')
            }
          </p>
          {authData && activeTab !== 'documents' && (
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

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === 'vehicles' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('vehicles')}
          className="flex items-center gap-2"
        >
          <Car className="h-4 w-4" />
          Vehicles
        </Button>
        <Button
          variant={activeTab === 'documents' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('documents')}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Documents
        </Button>
        <Button
          variant={activeTab === 'mcp-test' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('mcp-test')}
          className="flex items-center gap-2"
        >
          <TestTube className="h-4 w-4" />
          MCP Test
        </Button>
        <Button
          variant={activeTab === 'attestation-test' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('attestation-test')}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Attestation Test
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'vehicles' && (
        <>
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
        </>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="bg-gray-800/50 dark:bg-gray-800/80 border border-gray-700 dark:border-gray-600 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-500 dark:text-blue-400 mb-2">
              Document Processing
            </h3>
            <p className="text-gray-300 dark:text-gray-300">
              Upload car registration documents and oil change receipts to automatically extract vehicle information and maintenance schedules.
            </p>
          </div>
          
          <DocumentUpload 
            vehicleId={vehicles[0]?.id || '550e8400-e29b-41d4-a716-446655440000'} 
            tokenId={authData?.tokenId || 8}
            onDocumentProcessed={handleDocumentProcessed}
          />
        </div>
      )}

      {/* MCP Test Tab */}
      {activeTab === 'mcp-test' && (
        <div className="space-y-6">
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TestTube className="h-5 w-5 text-yellow-600" />
              <h3 className="font-medium text-yellow-900 dark:text-yellow-100">DIMO MCP Server Test</h3>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Test the DIMO MCP server integration and verify vehicle data access.
            </p>
          </div>
          
          <McpTest />
        </div>
      )}

      {/* Attestation Test Tab */}
      {activeTab === 'attestation-test' && (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium text-blue-900 dark:text-blue-100">DIMO Attestation Service Test</h3>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Test the DIMO attestation service and verify document attestation to attest.dimo.zone.
            </p>
          </div>
          
          <DimoAttestationTest />
        </div>
      )}
    </div>
  );
}