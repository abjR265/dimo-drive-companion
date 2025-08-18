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

  // Normalize a vehicle object coming from ShareVehiclesWithDimo
  const convertSharedToVehicle = (shared: any): DimoVehicle => {
    console.log(`Converting vehicle: ${shared.definition?.make} ${shared.definition?.model} (${shared.definition?.year})`);
    
    // Extract vehicle data from DIMO Identity API response structure
    const tokenId = shared?.tokenId || shared?.id || Math.floor(Math.random()*10000);
    
    // Extract make, model, year from definition
    let make = 'Vehicle';
    let model = '—';
    let year = new Date().getFullYear();
    
    if (shared?.definition) {
      make = shared.definition.make || 'Vehicle';
      model = shared.definition.model || '—';
      year = Number(shared.definition.year) || new Date().getFullYear();
    } else if (shared?.make) {
      // Fallback to direct properties
      make = shared.make;
      model = shared.model || '—';
      year = Number(shared.year) || new Date().getFullYear();
    } else if (shared?.name) {
      // Try to parse name like "Toyota Tacoma (2016)"
      const nameMatch = shared.name.match(/^(.+?)\s+(.+?)\s*\((\d{4})\)$/);
      if (nameMatch) {
        make = nameMatch[1].trim();
        model = nameMatch[2].trim();
        year = Number(nameMatch[3]);
      } else {
        // Fallback: split by space and assume last part is model
        const parts = shared.name.split(' ');
        if (parts.length >= 2) {
          make = parts[0];
          model = parts.slice(1).join(' ');
        }
      }
    }
    
    // Determine vehicle type based on make/model
    let vehicleType: 'electric' | 'hybrid' | 'gas' = 'gas';
    if (make.toLowerCase().includes('tesla') || 
        model.toLowerCase().includes('model') ||
        model.toLowerCase().includes('ev') ||
        model.toLowerCase().includes('electric')) {
      vehicleType = 'electric';
    } else if (model.toLowerCase().includes('hybrid') ||
               model.toLowerCase().includes('hev') ||
               model.toLowerCase().includes('phev')) {
      vehicleType = 'hybrid';
    }
    
    // Check if vehicle has SACDs (is shared with our app)
    const hasSacds = shared?.sacds && Array.isArray(shared.sacds) && shared.sacds.length > 0;
    
    const vehicle: DimoVehicle = {
      id: `vehicle-${tokenId}`, // Ensure unique ID with prefix
      name: `${make} ${model}`.trim(),
      model: String(model),
      year,
      type: vehicleType,
      healthScore: 85, // Default - could be fetched from DIMO API later
      status: 'optimal' as const,
      fuelLevel: vehicleType === 'electric' ? undefined : 0.6, // No fuel for electric
      batteryLevel: vehicleType === 'electric' ? 0.8 : undefined, // Battery for electric
      mileage: 45000, // Default - could be fetched from DIMO API later
      lastService: '2024-01-10', // Default - could be fetched from DIMO API later
      aiInsight: `Your ${make} ${model} is connected via DIMO. Token ID: ${tokenId}. ${hasSacds ? 'Vehicle is shared with this app.' : 'Vehicle is not shared.'}`,
      tokenId: Number(tokenId),
      location: { latitude: 37.7749, longitude: -122.4194 }, // Default - could be fetched from DIMO API later
    };
    
    console.log(`✓ Vehicle converted: ${vehicle.name}`);
    return vehicle;
  };

  // Function to get vehicle-specific JWT through direct token exchange with Developer JWT
  const getVehicleJWT = async (tokenId: number): Promise<string | null> => {
    try {
      console.log(`Getting vehicle JWT for vehicle ${tokenId} via direct token exchange...`);
      
      // Get the Developer JWT from environment variable or localStorage
      const developerJwt = import.meta.env.VITE_DIMO_DEVELOPER_JWT || localStorage.getItem('dimoDeveloperJwt');
      
      if (!developerJwt) {
        console.error('No Developer JWT found. Please set VITE_DIMO_DEVELOPER_JWT or store in localStorage as dimoDeveloperJwt');
        return null;
      }

      // Make direct token exchange request to get vehicle-specific JWT
      const response = await fetch('https://token-exchange-api.dimo.zone/v1/tokens/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${developerJwt}`
        },
        body: JSON.stringify({
          nftContractAddress: '0xbA5738a18d83D41847dfFbDC6101d37C69c9B0cF', // Production contract address
          tokenId: tokenId,
          privileges: [1] // All-time, non-location data
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Token exchange failed for vehicle ${tokenId}:`, errorText);
        return null;
      }

      const data = await response.json();
      console.log(`✓ Vehicle ${tokenId} token exchange successful`);
      
      return data.token; // Return the vehicle-specific JWT
    } catch (error) {
      console.error(`Error in token exchange for vehicle ${tokenId}:`, error);
      return null;
    }
  };

  // Function to fetch vehicle telemetry data directly from DIMO Telemetry API
  const fetchVehicleTelemetry = async (tokenId: number): Promise<any> => {
    console.log(`Fetching telemetry for vehicle ${tokenId}...`);
    
    try {
      // Get vehicle-specific JWT through MCP server
      const vehicleJwt = await getVehicleJWT(tokenId);
      
      if (!vehicleJwt) {
        console.error(`Failed to get vehicle JWT for ${tokenId}`);
        return null;
      }

      // Make direct call to DIMO Telemetry API with vehicle JWT
      const response = await fetch('https://telemetry-api.dimo.zone/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${vehicleJwt}`
        },
        body: JSON.stringify({
          query: `query GetLatestSignals($tokenId: Int!) {
            signalsLatest(tokenId: $tokenId) {
              # Vehicle Info & Status
              powertrainTransmissionTravelledDistance {
                value
                timestamp
              }
              speed {
                value
                timestamp
              }
              isIgnitionOn {
                value
                timestamp
              }
              lastSeen
              
              # Fuel System
              powertrainFuelSystemRelativeLevel {
                value
                timestamp
              }
              powertrainFuelSystemAbsoluteLevel {
                value
                timestamp
              }
              powertrainFuelSystemSupportedFuelTypes {
                value
                timestamp
              }
              
              # Battery & Charging
              powertrainTractionBatteryStateOfChargeCurrent {
                value
                timestamp
              }
              powertrainTractionBatteryStateOfChargeCurrentEnergy {
                value
                timestamp
              }
              powertrainTractionBatteryGrossCapacity {
                value
                timestamp
              }
              powertrainTractionBatteryChargingIsCharging {
                value
                timestamp
              }
              lowVoltageBatteryCurrentVoltage {
                value
                timestamp
              }
              
              # Engine
              powertrainType {
                value
                timestamp
              }
              powertrainRange {
                value
                timestamp
              }
              powertrainCombustionEngineSpeed {
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
              
              # Diagnostics
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
              obdRunTime {
                value
                timestamp
              }
              obdDTCList {
                value
                timestamp
              }
              
              # Environment
              exteriorAirTemperature {
                value
                timestamp
              }
            }
          }`,
          variables: {
            tokenId: tokenId
          }
        })
      });

      console.log(`Telemetry API response: ${response.status} for vehicle ${tokenId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Telemetry API error for vehicle ${tokenId}: ${response.status}`);
        throw new Error(`Telemetry API error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✓ Telemetry data received for vehicle ${tokenId}`);
      
      // Extract the telemetry data from the DIMO API response
      return data.data?.signalsLatest || null;
    } catch (error) {
      console.error(`Error fetching telemetry from DIMO Telemetry API for vehicle ${tokenId}:`, error);
      return null;
    }
  };

  // Calculate health score based on telemetry data
  const calculateHealthScore = (telemetry: any): number => {
    if (!telemetry) return 85; // Default health score
    
    let score = 85; // Base score
    let factors = 0;
    
    // Check battery voltage (for all vehicles)
    if (telemetry.lowVoltageBatteryCurrentVoltage?.value) {
      const voltage = telemetry.lowVoltageBatteryCurrentVoltage.value;
      if (voltage >= 12.5) score += 5;
      else if (voltage >= 12.0) score += 0;
      else score -= 10;
      factors++;
    }
    
    // Check engine coolant temperature (for gas vehicles)
    if (telemetry.powertrainCombustionEngineECT?.value) {
      const temp = telemetry.powertrainCombustionEngineECT.value;
      if (temp >= 80 && temp <= 110) score += 5;
      else if (temp > 110) score -= 10;
      else if (temp < 80) score -= 5;
      factors++;
    }
    
    // Check engine RPM (for gas vehicles)
    if (telemetry.powertrainCombustionEngineSpeed?.value) {
      const rpm = telemetry.powertrainCombustionEngineSpeed.value;
      if (rpm > 0 && rpm < 3000) score += 5;
      else if (rpm >= 3000) score -= 5;
      factors++;
    }
    
    // Check engine load
    if (telemetry.obdEngineLoad?.value) {
      const load = telemetry.obdEngineLoad.value;
      if (load >= 0 && load <= 80) score += 3;
      else if (load > 80) score -= 5;
      factors++;
    }
    
    // Check intake temperature
    if (telemetry.obdIntakeTemp?.value) {
      const temp = telemetry.obdIntakeTemp.value;
      if (temp >= 10 && temp <= 50) score += 2;
      else if (temp < 0 || temp > 60) score -= 5;
      factors++;
    }
    
    // Check barometric pressure
    if (telemetry.obdBarometricPressure?.value) {
      const pressure = telemetry.obdBarometricPressure.value;
      if (pressure >= 90 && pressure <= 110) score += 2;
      else if (pressure < 80 || pressure > 120) score -= 3;
      factors++;
    }
    
    // Normalize score if we have factors
    if (factors > 0) {
      score = Math.max(0, Math.min(100, score));
    }
    
    return Math.round(score);
  };

  // Get fuel or battery level from telemetry
  const getFuelBatteryLevel = (telemetry: any, vehicleType: string): number => {
    if (!telemetry) return 60; // Default level
    
    if (vehicleType === 'electric') {
      // For electric vehicles, use battery state of charge (already in percentage)
      const batteryLevel = telemetry.powertrainTractionBatteryStateOfChargeCurrent?.value;
      if (batteryLevel !== undefined && batteryLevel !== null) {
        return Math.round(batteryLevel); // Ensure it's a proper percentage
      }
      return 60; // Default
    } else {
      // For gas vehicles, use fuel system relative level (already in percentage)
      const fuelLevel = telemetry.powertrainFuelSystemRelativeLevel?.value;
      if (fuelLevel !== undefined && fuelLevel !== null) {
        return Math.round(fuelLevel); // Ensure it's a proper percentage
      }
      return 60; // Default
    }
  };

  // Get mileage from telemetry
  const getMileage = (telemetry: any): number => {
    const odometerKm = telemetry?.powertrainTransmissionTravelledDistance?.value;
    if (odometerKm && odometerKm > 0) {
      return Math.round(odometerKm); // Return in km, no conversion to miles
    }
    return 0;
  };

  // Load vehicles for authenticated user
  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get auth data from localStorage
      const storedAuth = localStorage.getItem('dimoAuth');
      console.log('=== LOADING VEHICLES ===');
      
      let userAuthData: UserAuthData | null = null;

      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        console.log('Auth data loaded successfully');
        setAuthData(parsedAuth);

        // Check for vehicles in various possible locations
        const sharedVehicles = parsedAuth.sharedVehicles || [];
        const vehicles = parsedAuth.vehicles || [];
        const allVehicles = [...sharedVehicles, ...vehicles];
        
        // Remove duplicates from allVehicles based on tokenId
        const uniqueAllVehicles = allVehicles.filter((vehicle, index, self) => 
          index === self.findIndex(v => (v.tokenId || v.id) === (vehicle.tokenId || vehicle.id))
        );
        
        console.log(`Found ${sharedVehicles.length} shared vehicles, ${vehicles.length} vehicles`);
        
        if (Array.isArray(uniqueAllVehicles) && uniqueAllVehicles.length > 0) {
          console.log(`Processing ${uniqueAllVehicles.length} vehicles...`);
          
          // Convert vehicles and fetch telemetry for each
          const vehiclesWithTelemetry = await Promise.all(
            uniqueAllVehicles.map(async (vehicle) => {
              const convertedVehicle = convertSharedToVehicle(vehicle);
              
              // Fetch telemetry data for this vehicle
              const telemetry = await fetchVehicleTelemetry(convertedVehicle.tokenId);
              
              // Update vehicle with real data
              const healthScore = calculateHealthScore(telemetry);
              const fuelBatteryLevel = getFuelBatteryLevel(telemetry, convertedVehicle.type);
              const odometer = getMileage(telemetry);
              
              return {
                ...convertedVehicle,
                healthScore,
                fuelLevel: fuelBatteryLevel,
                batteryLevel: fuelBatteryLevel, // For electric vehicles
                odometer,
                telemetry // Add telemetry data to the vehicle object
              };
            })
          );
          
          console.log(`Loaded ${vehiclesWithTelemetry.length} vehicles with telemetry`);
          
          // Remove duplicates based on tokenId
          const uniqueVehiclesWithTelemetry = vehiclesWithTelemetry.filter((vehicle, index, self) => 
            index === self.findIndex(v => v.tokenId === vehicle.tokenId)
          );
          
          console.log(`Displaying ${uniqueVehiclesWithTelemetry.length} unique vehicles`);
          setVehicles(uniqueVehiclesWithTelemetry);
          return; // Done – show connected/shared vehicles with real data
        } else {
          console.log('No vehicles in auth data, fetching from DIMO API...');
          
          // Try to fetch vehicles from DIMO Identity API directly
          if (parsedAuth.jwt && parsedAuth.walletAddress) {
            try {
              console.log('Fetching vehicles from DIMO Identity API...');
              const fetchedVehicles = await fetchVehiclesFromDimoAPI(parsedAuth.jwt, parsedAuth.walletAddress);
              if (fetchedVehicles.length > 0) {
                console.log(`Fetched ${fetchedVehicles.length} vehicles from DIMO API`);
                
                // Convert vehicles and fetch telemetry for each
                const vehiclesWithTelemetry = await Promise.all(
                  fetchedVehicles.map(async (vehicle) => {
                    const convertedVehicle = convertSharedToVehicle(vehicle);
                    
                    // Fetch telemetry data for this vehicle
                    const telemetry = await fetchVehicleTelemetry(convertedVehicle.tokenId);
                    
                    // Update vehicle with real data
                                    const healthScore = calculateHealthScore(telemetry);
                const fuelBatteryLevel = getFuelBatteryLevel(telemetry, convertedVehicle.type);
                const odometer = getMileage(telemetry);
                
                return {
                  ...convertedVehicle,
                  healthScore,
                  fuelLevel: fuelBatteryLevel,
                  batteryLevel: fuelBatteryLevel, // For electric vehicles
                  odometer,
                  telemetry
                };
                  })
                );
                
                // Remove duplicates based on tokenId
                const uniqueVehicles = vehiclesWithTelemetry.filter((vehicle, index, self) => 
                  index === self.findIndex(v => v.tokenId === vehicle.tokenId)
                );
                
                console.log(`✓ Dashboard loaded: ${uniqueVehicles.length} vehicles`);
                setVehicles(uniqueVehicles);
                
                // Update localStorage with the fetched vehicles
                const updatedAuth = {
                  ...parsedAuth,
                  vehicles: fetchedVehicles,
                  sharedVehicles: fetchedVehicles
                };
                localStorage.setItem('dimoAuth', JSON.stringify(updatedAuth));
                return;
              }
            } catch (apiError) {
              console.error('Failed to fetch vehicles from DIMO API:', apiError);
            }
          }
        }
        
        userAuthData = {
          tokenId: parsedAuth.tokenId || (parsedAuth.vehicles?.[0]?.tokenId) || (parsedAuth.sharedVehicles?.[0]?.tokenId),
          vehicleId: parsedAuth.vehicles?.[0]?.id || '',
          permissions: parsedAuth.permissions || [],
          jwt: parsedAuth.jwt,
          walletAddress: parsedAuth.walletAddress // Add wallet address from stored auth data
        };
      } else {
        console.log('No stored auth data found');
      }

      // Try to load vehicles from database for authenticated user (fallback if share list absent)
      if (userAuthData && userAuthData.walletAddress) {
        try {
          // First, get the user from the database
          const user = await db.getUserByWallet(userAuthData.walletAddress);
          
          if (user) {
            // Load vehicles for this user
            const dbVehicles = await db.getVehiclesByUserId(user.id);
            const vehicleData = dbVehicles.map(convertDbVehicleToDimoVehicle);
            setVehicles(vehicleData);
          } else {
            // Fallback single demo vehicle
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
              tokenId: userAuthData.tokenId || 999999, // Use actual token ID or a clearly fake one
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
            tokenId: userAuthData.tokenId || 999999, // Use actual token ID or a clearly fake one
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
          tokenId: 999999, // Clearly fake token ID for demo
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
        tokenId: 999999, // Clearly fake token ID for demo
        location: { latitude: 37.7749, longitude: -122.4194 },
      };
      setVehicles([fallbackVehicle]);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch vehicles from DIMO Identity API
  const fetchVehiclesFromDimoAPI = async (jwt: string, walletAddress: string): Promise<any[]> => {
    try {
      console.log('Fetching vehicles from DIMO Identity API...');
      
      const response = await fetch('https://identity-api.dimo.zone/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          query: `query GetVehiclesByOwner($owner: Address!) {
            vehicles(filterBy: {owner: $owner}, first: 100) {
              nodes {
                tokenId
                tokenDID
                definition {
                  make
                  model
                  year
                }
              }
            }
          }`,
          variables: {
            owner: walletAddress
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DIMO Identity API error:', errorText);
        return [];
      }

      const data = await response.json();
      console.log('DIMO Identity API response:', data);
      
      return data.data?.vehicles?.nodes || [];
    } catch (error) {
      console.error('Error fetching vehicles from DIMO Identity API:', error);
      return [];
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
              Vehicles: {vehicles.length}
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
            tokenId={vehicles[0]?.tokenId || authData?.tokenId || 999999}
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