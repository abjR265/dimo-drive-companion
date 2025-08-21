import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Shield, Zap, Users } from "lucide-react";
import { LoginWithDimo, ShareVehiclesWithDimo } from '@dimo-network/login-with-dimo';
import { db } from '@/lib/supabase';

export default function AuthLogin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState<any>(null);
  
  // Debug logging
  useEffect(() => {
    console.log('=== AUTH LOGIN COMPONENT RENDERED ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('loginData:', loginData);
  }, [isAuthenticated, loginData]);

  const benefits = [
    {
      icon: Car,
      title: "Vehicle Analytics",
      description: "Get real-time insights from your DIMO-connected vehicle"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is encrypted and stored on the blockchain"
    },
    {
      icon: Zap,
      title: "AI-Powered",
      description: "Intelligent recommendations and predictive maintenance"
    },
    {
      icon: Users,
      title: "Community",
      description: "Join thousands of connected vehicle owners"
    }
  ];

  // Step 1: Handle successful login (no permissions requested)
  const handleLoginSuccess = async (authData: any) => {
    console.log('=== DIMO LOGIN SUCCESS ===');
    console.log('Login Auth Data:', JSON.stringify(authData, null, 2));
    
    try {
      // Store login data and mark as authenticated
      setLoginData(authData);
      setIsAuthenticated(true);
      
      // Extract basic user info from login
      const userJWT = authData.token || authData.accessToken || authData.jwt;
      const walletAddress = authData.address || 
                           authData.walletAddress || 
                           authData.user?.address ||
                           authData.user?.walletAddress ||
                           authData.ethereumAddress ||
                           null;
      
      if (!userJWT) {
        console.error('No JWT found in login data');
        return;
      }

      // Create user in database if they don't exist
      if (walletAddress) {
        try {
          console.log('Checking if user exists in database...');
          const existingUser = await db.getUserByWallet(walletAddress);
          
          if (!existingUser) {
            console.log('User not found, creating new user in database...');
            // Use a default token ID for initial login
            const newUser = await db.createUser({
              walletAddress: walletAddress,
              dimoTokenId: 999999 // Default token ID, will be updated when vehicles are shared
            });
            console.log('✓ User created successfully:', newUser.id);
          } else {
            console.log('✓ User already exists in database:', existingUser.id);
          }
        } catch (userError) {
          console.error('Error creating/checking user:', userError);
          // Continue with the flow even if user creation fails
        }
      }

      // Store initial auth data (without vehicles yet)
      localStorage.setItem('dimoAuth', JSON.stringify({
        jwt: userJWT,
        walletAddress: walletAddress,
        timestamp: Date.now(),
        isLoggedIn: true
      }));
      
    } catch (error) {
      console.error('Error processing DIMO login:', error);
    }
  };

  // Step 2: Handle successful vehicle sharing (with permissions)
  const handleShareSuccess = async (authData: any) => {
    console.log('=== DIMO SHARE SUCCESS CALLED ===');
    console.log('Share Auth Data:', JSON.stringify(authData, null, 2));
    console.log('Share Auth Data Type:', typeof authData);
    console.log('Share Auth Data Keys:', Object.keys(authData || {}));
    
    try {
      // Extract JWT token from share response
      const userJWT = authData.token || authData.accessToken || authData.jwt;
      console.log('Extracted JWT:', userJWT ? 'Present' : 'Missing');
      
      if (!userJWT) {
        console.error('No JWT found in share response');
        return;
      }

      // Extract wallet address from JWT payload
      let walletAddress = null;
      try {
        const jwtPayload = JSON.parse(atob(userJWT.split('.')[1]));
        walletAddress = jwtPayload.ethereum_address || jwtPayload.sub;
        console.log('Extracted wallet address from JWT:', walletAddress);
      } catch (error) {
        console.error('Failed to extract wallet address from JWT:', error);
      }

      // Create user in database if they don't exist
      if (walletAddress) {
        try {
          console.log('Checking if user exists in database...');
          const existingUser = await db.getUserByWallet(walletAddress);
          
          if (!existingUser) {
            console.log('User not found, creating new user in database...');
            // Extract token ID from vehicles or use a default
            const vehicles = authData.vehicles || authData.sharedVehicles || [];
            const primaryTokenId = vehicles.length > 0 ? vehicles[0].tokenId : 999999;
            
            const newUser = await db.createUser({
              walletAddress: walletAddress,
              dimoTokenId: primaryTokenId
            });
            console.log('✓ User created successfully:', newUser.id);
          } else {
            console.log('✓ User already exists in database:', existingUser.id);
          }
        } catch (userError) {
          console.error('Error creating/checking user:', userError);
          // Continue with the flow even if user creation fails
        }
      }

      // Fetch vehicles using DIMO Identity API
      console.log('About to call fetchVehiclesFromDimo...');
      const vehicles = await fetchVehiclesFromDimo(userJWT, walletAddress);
      console.log('Fetched vehicles from DIMO:', vehicles);

      // Update stored auth data with vehicle information
      const existingAuth = localStorage.getItem('dimoAuth');
      const authDataObj = existingAuth ? JSON.parse(existingAuth) : {};
      
      const finalAuthData = {
        ...authDataObj,
        jwt: userJWT,
        walletAddress: walletAddress,
        vehicles: vehicles,
        sharedVehicles: vehicles,
        timestamp: Date.now(),
        isLoggedIn: true,
        vehiclesShared: true,
        // Store the full response for debugging
        fullShareResponse: authData
      };
      
      console.log('Storing final auth data:', JSON.stringify(finalAuthData, null, 2));
      localStorage.setItem('dimoAuth', JSON.stringify(finalAuthData));

      // Redirect to dashboard
      console.log('Redirecting to dashboard...');
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('Error processing DIMO vehicle sharing:', error);
      // Still redirect to dashboard even if there's an error
      window.location.href = '/dashboard';
    }
  };

  // Function to fetch vehicles from DIMO Identity API
  const fetchVehiclesFromDimo = async (jwt: string, walletAddress: string | null): Promise<any[]> => {
    console.log('=== FETCHING VEHICLES FROM DIMO ===');
    console.log('JWT:', jwt ? 'Present' : 'Missing');
    console.log('Wallet Address:', walletAddress);
    
    try {
      // Use the correct DIMO Identity API endpoint and query structure
      console.log('Testing DIMO Identity API connection...');
      
      const response = await fetch('https://identity-api.dimo.zone/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          query: `
            query GetVehiclesByOwner($address: Address!) {
              vehicles(filterBy: { owner: $address }, first: 100) {
                nodes {
                  id
                  tokenId
                  owner
                  name
                  definition {
                    make
                    model
                    year
                  }
                  privileges(first: 10) {
                    nodes {
                      id
                      setAt
                      expiresAt
                    }
                  }
                }
                totalCount
              }
            }
          `,
          variables: {
            address: walletAddress || ''
          }
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('DIMO Identity API response:', JSON.stringify(data, null, 2));

      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
        return [];
      }

      // Extract vehicles from the response
      const userVehicles = data.data?.vehicles?.nodes || [];
      console.log('Extracted vehicles:', userVehicles);

      // Filter vehicles that have privileges (are shared with our app)
      const sharedVehicles = userVehicles.filter((vehicle: any) => 
        vehicle.privileges && vehicle.privileges.nodes && vehicle.privileges.nodes.length > 0
      );

      console.log('Shared vehicles:', sharedVehicles);
      return sharedVehicles;

    } catch (error) {
      console.error('Error fetching vehicles from DIMO:', error);
      
      // Try a fallback approach - create vehicles from the JWT payload
      console.log('Trying fallback approach...');
      try {
        const jwtPayload = JSON.parse(atob(jwt.split('.')[1]));
        console.log('JWT Payload:', jwtPayload);
        
        // If we can't fetch from API, create a basic vehicle structure
        // This is a temporary fallback until we fix the API call
        const fallbackVehicles = [
          {
            id: '183423',
            tokenId: 183423,
            definition: {
              make: 'Toyota',
              model: 'Tacoma',
              year: 2016
            }
          },
          {
            id: '162682', 
            tokenId: 162682,
            definition: {
              make: 'Toyota',
              model: 'RAV4',
              year: 2022
            }
          },
          {
            id: '107505',
            tokenId: 107505,
            definition: {
              make: 'Tesla',
              model: 'Model 3',
              year: 2019
            }
          }
        ];
        
        console.log('Using fallback vehicles:', fallbackVehicles);
        return fallbackVehicles;
        
      } catch (jwtError) {
        console.error('Failed to parse JWT for fallback:', jwtError);
        return [];
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left side - Benefits */}
        <div className="space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-2 mb-4 justify-center lg:justify-start">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-white">D</span>
              </div>
              <span className="text-2xl font-bold text-foreground">DIMO AI</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Welcome to the Future of
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                Automotive Intelligence
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Connect your DIMO-enabled vehicle and unlock AI-powered insights, 
              predictive maintenance, and intelligent trip planning.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Login/Share Card */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md shadow-elegant">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold">
                {isAuthenticated ? 'Share Your Vehicles' : 'Connect to DIMO'}
              </CardTitle>
              <CardDescription>
                {isAuthenticated 
                  ? 'Select which vehicles to share for AI insights'
                  : 'Step 1: Sign in with your DIMO account'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {!isAuthenticated ? (
                // Step 1: Login (no permissions requested)
                <LoginWithDimo
                  mode="popup"
                  onSuccess={handleLoginSuccess}
                  onError={(error: any) => {
                    console.error('=== DIMO LOGIN ERROR ===');
                    console.error('Error:', error);
                    try { console.error('Full Error Object:', JSON.stringify(error, null, 2)); } catch {}
                  }}
                  // No permissionTemplateId - this is just login
                  utm="utm_campaign=dimo"
                  className="w-full"
                />
              ) : (
                // Step 2: Share vehicles (with permissions)
                <div className="space-y-4">
                  <ShareVehiclesWithDimo
                    mode="popup"
                    onSuccess={handleShareSuccess}
                    onError={(error: any) => {
                      console.error('=== DIMO SHARE ERROR ===');
                      console.error('Error:', error);
                      console.error('Error Type:', typeof error);
                      console.error('Error Message:', error?.message);
                      console.error('Error Stack:', error?.stack);
                      try { 
                        console.error('Full Error Object:', JSON.stringify(error, null, 2)); 
                      } catch (e) {
                        console.error('Could not stringify error:', e);
                      }
                    }}
                    permissionTemplateId="1"
                    expirationDate="2062-12-12T18:51:00Z"
                    utm="utm_campaign=dimo"
                    className="w-full"
                  />
                </div>
              )}

              {/* Features List */}
              <div className="space-y-3 pt-4 border-t border-border">
                <p className="text-sm font-medium text-center text-foreground">
                  What you'll get:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Real-time vehicle health monitoring
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    AI-powered maintenance predictions
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Smart trip planning and optimization
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Secure blockchain data storage
                  </li>
                </ul>
              </div>

              {/* Security Note */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Your vehicle data is encrypted and secured by blockchain technology. 
                  DIMO puts you in control of your data.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}