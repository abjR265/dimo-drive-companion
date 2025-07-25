import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
  Bot
} from "lucide-react";

interface Vehicle {
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
}

export default function Dashboard() {
  // Mock data - in real app this would come from DIMO API
  const vehicles: Vehicle[] = [
    {
      id: '1',
      name: 'Tesla Model 3',
      model: 'Model 3',
      year: 2023,
      type: 'electric',
      healthScore: 92,
      status: 'optimal',
      batteryLevel: 87,
      mileage: 12450,
      lastService: '2024-01-15',
      aiInsight: 'All systems optimal. Battery health excellent. Ready for long trips.'
    },
    {
      id: '2',
      name: 'BMW i4',
      model: 'i4 eDrive40',
      year: 2022,
      type: 'electric',
      healthScore: 78,
      status: 'attention',
      batteryLevel: 45,
      mileage: 28750,
      lastService: '2023-11-22',
      aiInsight: 'Tire pressure low. Brake pads at 30%. Service recommended within 2 weeks.'
    },
    {
      id: '3',
      name: 'Honda Civic',
      model: 'Civic Sport',
      year: 2021,
      type: 'gas',
      healthScore: 85,
      status: 'optimal',
      fuelLevel: 65,
      mileage: 45200,
      lastService: '2024-01-08',
      aiInsight: 'Engine performance excellent. Oil change due in 2,000 miles.'
    }
  ];

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vehicle Dashboard</h1>
          <p className="text-muted-foreground">Monitor your DIMO-connected vehicles</p>
        </div>
        <Button variant="hero" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{vehicles.length}</p>
                <p className="text-sm text-muted-foreground">Active Vehicles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {vehicles.filter(v => v.status === 'optimal').length}
                </p>
                <p className="text-sm text-muted-foreground">Optimal Status</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {vehicles.filter(v => v.status === 'attention').length}
                </p>
                <p className="text-sm text-muted-foreground">Need Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Bot className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">24/7</p>
                <p className="text-sm text-muted-foreground">AI Monitoring</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => {
          const StatusIcon = getStatusIcon(vehicle.status);
          
          return (
            <Card key={vehicle.id} className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">{vehicle.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.year} {vehicle.model}
                    </p>
                  </div>
                  <Badge variant={vehicle.status === 'optimal' ? 'default' : 'secondary'}>
                    {vehicle.type}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* AI Health Score */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">AI Health Score</span>
                    <span className={`text-sm font-bold ${getHealthColor(vehicle.healthScore)}`}>
                      {vehicle.healthScore}%
                    </span>
                  </div>
                  <Progress value={vehicle.healthScore} className="h-2" />
                </div>

                {/* Status & Levels */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="flex items-center gap-1">
                      <StatusIcon className={`h-4 w-4 ${getStatusColor(vehicle.status)}`} />
                      <span className="text-sm font-medium capitalize">{vehicle.status}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {vehicle.type === 'electric' ? 'Battery' : 'Fuel'}
                    </p>
                    <div className="flex items-center gap-1">
                      {vehicle.type === 'electric' ? (
                        <Battery className="h-4 w-4 text-primary" />
                      ) : (
                        <Fuel className="h-4 w-4 text-primary" />
                      )}
                      <span className="text-sm font-medium">
                        {vehicle.batteryLevel || vehicle.fuelLevel}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Insight */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Bot className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {vehicle.aiInsight}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button variant="default" size="sm" className="flex-1">
                    <Wrench className="h-3 w-3 mr-1" />
                    Maintenance
                  </Button>
                  {vehicle.type === 'electric' && (
                    <Button variant="secondary" size="sm" className="flex-1">
                      <Zap className="h-3 w-3 mr-1" />
                      Charging
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="flex-1">
                    <Route className="h-3 w-3 mr-1" />
                    Trip Ready?
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Add Vehicle Card */}
        <Card className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Add New Vehicle</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your DIMO-enabled vehicle to start monitoring
              </p>
              <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground">
                Connect Vehicle
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}