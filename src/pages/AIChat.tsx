import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Send, 
  Mic, 
  User,
  Car,
  Wrench,
  Route,
  Zap
} from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  vehicleContext?: string;
}

export default function AIChat() {
  const [selectedVehicle, setSelectedVehicle] = useState('tesla-model-3');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your DIMO AI assistant. I can help you with vehicle diagnostics, maintenance recommendations, trip planning, and more. What would you like to know about your Tesla Model 3?",
      timestamp: new Date(),
      vehicleContext: 'tesla-model-3'
    }
  ]);

  const vehicles = [
    { id: 'tesla-model-3', name: 'Tesla Model 3', status: 'optimal' },
    { id: 'bmw-i4', name: 'BMW i4', status: 'attention' },
    { id: 'honda-civic', name: 'Honda Civic', status: 'optimal' }
  ];

  const suggestedPrompts = [
    { text: "How's my car doing today?", icon: Car },
    { text: "Am I ready for a road trip?", icon: Route },
    { text: "What maintenance do I need?", icon: Wrench },
    { text: "Check my charging status", icon: Zap }
  ];

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
      vehicleContext: selectedVehicle
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: getAIResponse(input),
        timestamp: new Date(),
        vehicleContext: selectedVehicle
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const getAIResponse = (userInput: string): string => {
    const responses = [
      "Based on your vehicle data, everything looks great! Your battery health is at 92% and all systems are operating optimally.",
      "I've analyzed your recent driving patterns and vehicle diagnostics. Your car is ready for a long trip, but I recommend checking tire pressure before departing.",
      "Your vehicle's AI health score is 92%. The next maintenance is due in 2,000 miles - primarily an oil change and tire rotation.",
      "Your charging session completed successfully. Current battery level is 87% with an estimated range of 315 miles."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="h-full flex">
      {/* Sidebar - Vehicle Context */}
      <div className="w-72 border-r border-border bg-card/50 p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-foreground mb-3">Active Vehicle</h3>
          <div className="space-y-2">
            {vehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle.id)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  selectedVehicle === vehicle.id
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{vehicle.name}</span>
                  <Badge
                    variant={vehicle.status === 'optimal' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {vehicle.status}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-foreground mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {suggestedPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handlePromptClick(prompt.text)}
                className="w-full p-2 text-left text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-all flex items-center gap-2"
              >
                <prompt.icon className="h-4 w-4" />
                {prompt.text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 m-4 flex flex-col">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-secondary" />
              DIMO AI Assistant
              <Badge variant="secondary" className="ml-auto">
                {vehicles.find(v => v.id === selectedVehicle)?.name}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 p-4 space-y-4 overflow-auto max-h-[500px]">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback>
                      {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div
                    className={`max-w-md rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground ml-12'
                        : 'bg-muted/70 text-foreground mr-12'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your vehicle..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon">
                  <Mic className="h-4 w-4" />
                </Button>
                <Button onClick={handleSendMessage} disabled={!input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Suggested Prompts */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {suggestedPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePromptClick(prompt.text)}
                    className="text-xs"
                  >
                    {prompt.text}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}