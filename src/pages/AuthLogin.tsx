import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Shield, Zap, Users } from "lucide-react";
// Note: LoginWithDimo component will be integrated here

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

  // Placeholder for DIMO Login - in real implementation, use:
  // import { LoginWithDimo } from '@dimo-network/login-with-dimo'
  const handleDimoLogin = () => {
    // This would integrate with DIMO Login SDK
    console.log('DIMO Login clicked');
    // For demo purposes, redirect to dashboard
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left side - Benefits */}
        <div className="space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-2 mb-4 justify-center lg:justify-start">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">D</span>
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
              <Button 
                variant="hero" 
                size="xl" 
                className="w-full"
                onClick={handleDimoLogin}
              >
                <Car className="mr-2 h-5 w-5" />
                Connect with DIMO
              </Button>

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