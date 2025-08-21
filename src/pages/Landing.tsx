import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Bot, 
  Wrench, 
  Route, 
  FileText,
  ArrowRight,
  Car,
  Zap,
  Shield
} from "lucide-react";
import heroImage from "@/assets/hero-automotive.jpg";
import { useState } from 'react';
import { LoginWithDimo, ShareVehiclesWithDimo } from '@dimo-network/login-with-dimo';
import { db } from '@/lib/supabase';

export default function Landing() {
  const features = [
    {
      icon: Bot,
      title: "AI Health Monitoring",
      description: "Continuous vehicle analysis with intelligent diagnostics and real-time alerts"
    },
    {
      icon: Wrench,
      title: "Predictive Maintenance",
      description: "Know what needs fixing before it breaks with AI-powered predictions"
    },
    {
      icon: Route,
      title: "Smart Trip Planning",
      description: "AI-powered journey optimization with real-time traffic and charging data"
    },
    {
      icon: FileText,
      title: "Document Intelligence",
      description: "Upload receipts and get automatic maintenance reminders and insights"
    }
  ];

  const benefits = [
    { icon: Car, text: "Works with all DIMO-connected vehicles" },
    { icon: Zap, text: "Real-time monitoring and alerts" },
    { icon: Shield, text: "Secure blockchain-based data" }
  ];

  const [showDimoLogin, setShowDimoLogin] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-md flex items-center justify-center">
              <span className="text-sm font-bold text-white">D</span>
            </div>
            <span className="text-xl font-bold text-foreground">DIMO AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <a href="/auth/login">Sign In</a>
            </Button>
            <Button variant="hero" asChild>
              <a href="/auth/login">Get Started</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Meet Your{" "}
                  <span className="bg-gradient-primary bg-clip-text text-transparent">
                    AI Vehicle
                  </span>{" "}
                  Assistant
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Transform your DIMO-connected vehicle into an intelligent 
                  automotive companion with AI-powered insights and autonomous capabilities.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="group"
                  onClick={() => (window.location.href = '/auth/login')}
                >
                  Connect to DIMO
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                {showDimoLogin && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-background p-8 rounded-lg shadow-lg relative">
                      <button className="absolute top-2 right-2 text-xl" onClick={() => setShowDimoLogin(false)}>&times;</button>
                      <ShareVehiclesWithDimo
                          mode="popup"
                          onSuccess={async (authData: any) => {
                              // DIMO Login Success - auth data received
                          
                          // Debug: Check for wallet address in different possible locations
                              // Wallet address debug information (sanitized)
                          
                          try {
                            // Extract user data from auth response
                            const userJWT = authData.token || authData.accessToken || authData.jwt;
                            const userVehicles = authData.sharedVehicles || authData.vehicles || [];
                            
                            // Extract wallet address from auth data - try more variations
                            let walletAddress = authData.address || 
                                              authData.walletAddress || 
                                              authData.user?.address ||
                                              authData.user?.walletAddress ||
                                              authData.ethereumAddress ||
                                              authData.eth_address ||
                                              authData.wallet_address ||
                                              authData.owner ||
                                              authData.sub || // JWT subject might be the address
                                              null;
                            
                            // If wallet address is still null, try to extract from JWT payload
                            if (!walletAddress && userJWT) {
                              try {
                                const jwtPayload = JSON.parse(atob(userJWT.split('.')[1]));
                                // JWT Payload extracted
                                walletAddress = jwtPayload.sub || 
                                               jwtPayload.address || 
                                               jwtPayload.wallet_address ||
                                               jwtPayload.eth_address ||
                                               jwtPayload.owner ||
                                               null;
                                // Wallet address extracted from JWT
                              } catch (error) {
                                console.error('Failed to decode JWT payload:', error);
                              }
                            }
                            
                            if (!userJWT) {
                              console.error('No JWT found in auth data');
                              return;
                            }

                            if (!walletAddress) {
                              console.error('No wallet address found in auth data');
                              // Available auth data keys
                              // JWT payload available
                              // Continue anyway, wallet address is optional for now
                            }

                            // Get the first vehicle's tokenId (or use a default)
                            const firstVehicle = userVehicles[0];
                            const tokenId = firstVehicle?.tokenId || firstVehicle?.id || 999999; // Use actual token ID or clearly fake one

                            // Create user in database if they don't exist
                            if (walletAddress) {
                              try {
                                console.log('Checking if user exists in database...');
                                const existingUser = await db.getUserByWallet(walletAddress);
                                
                                if (!existingUser) {
                                  console.log('User not found, creating new user in database...');
                                  const newUser = await db.createUser({
                                    walletAddress: walletAddress,
                                    dimoTokenId: tokenId
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
                        }}
                        onError={(error: any) => {
                          console.error('Error:', error);
                        }}
                        permissionTemplateId="1"
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="xl"
                  onClick={() => window.open('https://www.loom.com/share/da6c1d7fcb314bc2a56788f870cd3791?sid=e95e94e2-f354-4f0b-a74c-9ffd2fe21d94', '_blank')}
                >
                  Watch Demo
                </Button>
              </div>

              <div className="flex flex-wrap gap-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <benefit.icon className="h-4 w-4 text-primary" />
                    {benefit.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-card">
                <img 
                  src={heroImage} 
                  alt="DIMO AI Dashboard" 
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
              </div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-ai rounded-full animate-pulse-glow" />
              <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-primary rounded-full animate-pulse-glow" style={{ animationDelay: '1s' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Intelligent Vehicle Management
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our AI assistant transforms your vehicle data into actionable insights 
              and predictive maintenance recommendations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-2">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <feature.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Ready to Make Your Vehicle Intelligent?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of drivers who trust DIMO AI to keep their vehicles 
            running optimally and safely.
          </p>
          <Button variant="hero" size="xl" className="animate-pulse-glow">
            Start Your AI Journey Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">D</span>
              </div>
              <span className="font-semibold text-foreground">DIMO AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 DIMO Network. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}