import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Shield, Zap, Users } from "lucide-react";
// Note: LoginWithDimo component will be integrated here
import { LoginWithDimo } from '@dimo-network/login-with-dimo';

export default function AuthLogin() {
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

  // Handle successful DIMO login
  const handleDimoSuccess = async (authData: any) => {
    // DIMO Login Success
    
    try {
      // Extract user data from auth response
      const userJWT = authData.token || authData.accessToken || authData.jwt;
      const userVehicles = authData.sharedVehicles || authData.vehicles || [];
      
      // Extract wallet address from auth data
      const walletAddress = authData.address || 
                           authData.walletAddress || 
                           authData.user?.address ||
                           authData.user?.walletAddress ||
                           authData.ethereumAddress ||
                           null;
      
      if (!userJWT) {
        console.error('No JWT found in auth data');
        return;
      }

      if (!walletAddress) {
        console.error('No wallet address found in auth data');
        // Auth data keys available
        // Continue anyway, wallet address is optional for now
      }

      // Get the first vehicle's tokenId (or use a default)
      const firstVehicle = userVehicles[0];
      const tokenId = firstVehicle?.tokenId || 8; // Fallback to your Mercedes-Benz

      // User authentication data processed

      // Store auth data in localStorage for the dashboard
      localStorage.setItem('dimoAuth', JSON.stringify({
        jwt: userJWT,
        tokenId: tokenId,
        vehicles: userVehicles,
        walletAddress: walletAddress,
        timestamp: Date.now()
      }));

      // Redirect to dashboard
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('Error processing DIMO login:', error);
      // Still redirect to dashboard even if there's an error
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left side - Benefits */}
        <div className="space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-2 mb-4 justify-center lg:justify-start">
              <img src="/src/assets/dimo-logo.png" alt="DIMO" className="w-10 h-10" />
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

        {/* Right side - Login Card */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md shadow-elegant">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold">Connect Your Vehicle</CardTitle>
              <CardDescription>
                Sign in with your DIMO account to access your vehicle data and AI insights
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* DIMO Login Button */}
              <LoginWithDimo
                mode="popup"
                clientId={import.meta.env.VITE_DIMO_CLIENT_ID || ''}
                redirectUri={import.meta.env.VITE_DIMO_REDIRECT_URI || ''}
                apiKey={import.meta.env.VITE_DIMO_API_KEY || ''}
                onSuccess={handleDimoSuccess}
                onError={(error: any) => {
                  console.error('DIMO Login Error:', error);
                }}
                className="w-full"
              />

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