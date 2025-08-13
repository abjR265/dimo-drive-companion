# DIMO AI - Intelligent Vehicle Management Platform

A sophisticated web application that transforms DIMO-connected vehicles into intelligent automotive companions with AI-powered insights, predictive maintenance, and autonomous capabilities.

## 🚗 Overview

DIMO AI is a comprehensive vehicle management platform that leverages artificial intelligence to provide real-time vehicle diagnostics, predictive maintenance, trip planning, and intelligent recommendations. Built on the DIMO Network infrastructure, it offers seamless integration with connected vehicles and blockchain-based data security.

## ✨ Key Features

### 🤖 AI-Powered Vehicle Intelligence
- **Real-time Health Monitoring**: Continuous analysis of vehicle systems with intelligent diagnostics
- **Predictive Maintenance**: AI-powered predictions to prevent breakdowns before they happen
- **Smart Trip Planning**: Journey optimization with real-time traffic and charging data
- **Natural Language Chat**: Conversational AI assistant for vehicle queries and assistance
- **Document Intelligence**: Upload receipts and get automatic maintenance reminders
- **Multi-Vehicle Optimization**: Manage and optimize multiple vehicles simultaneously

### 🔧 Vehicle Management
- **Multi-Vehicle Support**: Manage multiple DIMO-connected vehicles from a single dashboard
- **Real-time Telemetry**: Live vehicle data including fuel/battery levels, tire pressure, and diagnostics
- **Service Tracking**: Automated maintenance scheduling and cost estimation
- **Emergency Response**: Intelligent emergency assistance and roadside support
- **Seasonal Adaptation**: Weather-aware vehicle recommendations and adjustments

### 🛡️ Security & Privacy
- **Blockchain-based Data**: Secure, decentralized vehicle data storage
- **DIMO Authentication**: Seamless integration with DIMO Network authentication
- **Privacy-First**: User-controlled data sharing and permissions
- **Verifiable Credentials**: Proof of Movement and VIN credential creation

### 📱 Modern User Experience
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **Real-time Updates**: Live data streaming and instant notifications
- **Intuitive Navigation**: Clean, organized interface with smart categorization
- **Dark Mode Support**: Automatic theme switching with system preferences

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** with custom design system and shadcn/ui components
- **Radix UI** components for accessible, customizable UI
- **React Router** for client-side routing
- **tRPC** for type-safe API communication
- **TanStack Query** for efficient data fetching and caching

### Backend & AI Integration
- **n8n Cloud Workflows**: Sophisticated AI processing pipeline
- **Vehicle Genius Agent**: Main AI workflow with multiple tools:
  - OpenAI Chat Model for intelligent analysis
  - DIMO Telemetry Fetch for real-time vehicle data
  - Nearby Search for service locations
  - HTTP Request for external API integration
- **DIMO MCP Server**: Model Context Protocol integration for AI assistants
- **tRPC Server**: Type-safe backend API with validation

### Data & APIs
- **DIMO Network APIs**: Identity and Telemetry GraphQL endpoints
- **Real-time Telemetry**: Live vehicle data streaming
- **Blockchain Integration**: Secure, decentralized data storage
- **External Services**: Weather, traffic, and service provider APIs
- **OCR Services**: Document processing with OCR.space API

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- DIMO Developer Account ([console.dimo.org](https://console.dimo.org))
- n8n Cloud Account (for AI workflows)
- OpenAI API Key (for advanced AI features)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd dimo-ai-web
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the root directory:
```bash
# DIMO Authentication
VITE_DIMO_CLIENT_ID=your_client_id
VITE_DIMO_REDIRECT_URI=http://localhost:8080/auth/callback
VITE_DIMO_API_KEY=your_api_key
VITE_DIMO_DOMAIN=your_domain.com
VITE_DIMO_PRIVATE_KEY=your_private_key

# n8n AI Workflow
VITE_N8N_WEBHOOK_URL=https://your-n8n-workflow.webhook.url
VITE_N8N_API_KEY=your_n8n_api_key

# OpenAI Integration
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_OPENAI_ENDPOINT=https://api.openai.com/v1

# MCP Server (optional)
VITE_MCP_SERVER_URL=http://localhost:3001
```

4. **Start the development server**
```bash
npm run dev
```

5. **Access the application**
Open [http://localhost:8080](http://localhost:8080) in your browser

## 📁 Project Structure

```
dimo-ai-web/
├── src/
│   ├── components/
│   │   ├── layout/           # App layout components
│   │   │   ├── AppHeader.tsx
│   │   │   ├── AppLayout.tsx
│   │   │   └── AppSidebar.tsx
│   │   ├── ui/              # Reusable UI components (shadcn/ui)
│   │   ├── VehicleCard.tsx  # Vehicle display component
│   │   ├── AIChatEnhanced.tsx # Advanced AI chat interface
│   │   ├── DocumentIntelligence.tsx # Document processing
│   │   ├── DocumentUpload.tsx # File upload component
│   │   └── McpTest.tsx      # MCP server testing
│   ├── pages/
│   │   ├── Landing.tsx      # Landing page
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── AIChat.tsx       # AI chat interface
│   │   ├── AuthLogin.tsx    # Authentication
│   │   └── NotFound.tsx     # 404 page
│   ├── services/
│   │   ├── aiService.ts     # AI analysis service
│   │   ├── n8nClient.ts     # AI workflow integration
│   │   ├── dimoMcpClient.ts # MCP server client
│   │   ├── mcpDocumentProcessor.ts # Document processing
│   │   └── vehicleMatcher.ts # Vehicle matching logic
│   ├── server/
│   │   ├── context.ts       # tRPC context
│   │   └── routers/
│   │       ├── _app.ts      # Main router
│   │       ├── ai.ts        # AI endpoints
│   │       ├── aiMcp.ts     # MCP AI endpoints
│   │       └── dimoMcp.ts  # DIMO MCP endpoints
│   ├── lib/
│   │   ├── trpc.ts         # tRPC configuration
│   │   ├── supabase.ts     # Database integration
│   │   └── utils.ts        # Utility functions
│   ├── hooks/
│   │   ├── use-mobile.tsx  # Mobile detection
│   │   └── use-toast.ts    # Toast notifications
│   └── config/
│       └── documentProcessing.ts # Document config
├── mcp-dimo/               # DIMO MCP Server
│   ├── src/
│   │   ├── helpers/        # MCP utilities
│   │   └── index.ts        # Main server
│   └── README.md           # MCP documentation
├── public/                 # Static assets
├── scripts/                # Setup and deployment scripts
└── configuration files     # Various config files
```

## 🔧 Configuration

### DIMO Integration
1. Create a developer account at [console.dimo.org](https://console.dimo.org)
2. Generate API credentials (Client ID, Domain, Private Key)
3. Configure environment variables for authentication
4. Set up vehicle permissions and privileges

### n8n AI Workflow Setup
1. Create an n8n Cloud account
2. Import the Vehicle Genius Agent workflow
3. Configure webhook endpoints and API keys
4. Test the AI agent with sample vehicle data

### MCP Server (Optional)
1. Navigate to `mcp-dimo/` directory
2. Install dependencies: `npm install`
3. Configure DIMO credentials in environment
4. Start server: `npm start`
5. Test with the built-in test interface

### OpenAI Integration
1. Get an OpenAI API key from [platform.openai.com](https://platform.openai.com)
2. Configure the API key in environment variables
3. Enable advanced AI features in the application

## 🎯 Core Features

### Vehicle Dashboard
- **Real-time Health Monitoring**: Live vehicle status and health scores
- **AI-Powered Insights**: Intelligent analysis and recommendations
- **Multi-Vehicle Management**: Support for multiple connected vehicles
- **Service Tracking**: Automated maintenance scheduling
- **Document Intelligence**: Upload and analyze maintenance records

### AI Chat Assistant (Enhanced)
- **Natural Language Interface**: Conversational vehicle queries
- **Context-Aware Responses**: Vehicle-specific recommendations
- **Multi-turn Conversations**: Maintains context across interactions
- **Quick Actions**: Pre-built queries for common tasks
- **Real-time Data Integration**: Live telemetry and historical data
- **Advanced AI Analysis**: OpenAI GPT-4 powered insights

### AI Vehicle Genius
- **Health Analysis**: Comprehensive system diagnostics
- **Maintenance Checks**: Service interval and wear item analysis
- **Trip Readiness**: Pre-trip safety and preparation assessment
- **Nearby Services**: Location-based service recommendations
- **Cost Optimization**: Maintenance cost analysis and budgeting
- **Emergency Response**: Intelligent emergency assistance

### Document Intelligence
- **OCR Processing**: Extract text from receipts and documents
- **Maintenance Tracking**: Automatic service schedule extraction
- **Cost Analysis**: Expense tracking and cost estimation
- **Receipt Processing**: Oil change and service receipt analysis
- **Registration Documents**: Vehicle information extraction
- **AI Insights**: Intelligent document analysis and recommendations

### MCP Integration
- **DIMO API Access**: Direct GraphQL query capabilities
- **VIN Operations**: Vehicle identification and decoding
- **Telemetry Queries**: Real-time and historical data access
- **Verifiable Credentials**: Proof of Movement and VIN credentials
- **Schema Introspection**: API discovery and documentation

## 🔌 API Endpoints

### AI Endpoints (tRPC)
- `ai.askVehicleQuestion` - General vehicle queries
- `ai.analyzeVehicleHealth` - Comprehensive health analysis
- `ai.checkMaintenanceNeeds` - Maintenance assessment
- `ai.assessTripReadiness` - Trip preparation check
- `ai.findNearbyServices` - Service location search
- `ai.continueConversation` - Multi-turn chat
- `ai.getSystemStatus` - AI system health check

### MCP Endpoints
- `identity_query` - Public vehicle data queries
- `telemetry_query` - Authenticated vehicle telemetry
- `vin_operations` - VIN decoding and retrieval
- `attestation_create` - Verifiable credential creation
- `search_vehicles` - Vehicle definition search
- `identity_introspect` - Identity API schema
- `telemetry_introspect` - Telemetry API schema

### Document Processing
- `processDocument` - OCR document analysis
- `processPdfDocument` - PDF-specific processing
- `processWithExternalOcr` - External OCR service integration

## 🎨 UI Components

### Design System
- **Custom Tailwind Theme**: Automotive-focused color palette
- **Responsive Layout**: Mobile-first design approach
- **Accessibility**: WCAG 2.1 AA compliant components
- **Dark Mode**: Automatic theme switching
- **shadcn/ui**: Modern, accessible component library

### Key Components
- **VehicleCard**: Interactive vehicle display with AI actions
- **AIChatEnhanced**: Advanced conversational interface with real-time data
- **DocumentIntelligence**: Document processing and analysis
- **Dashboard**: Multi-vehicle overview with real-time data
- **AppLayout**: Responsive sidebar navigation
- **McpTest**: MCP server testing interface

## 🚀 Deployment

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Production
1. Build the application: `npm run build`
2. Deploy the `dist/` folder to your hosting provider
3. Configure environment variables for production
4. Set up SSL certificates for secure connections

### Docker Deployment
```bash
# Build Docker image
docker build -t dimo-ai-web .

# Run container
docker run -p 8080:8080 dimo-ai-web
```

## 🔍 Testing

### Component Testing
```bash
npm run test         # Run unit tests
npm run test:watch   # Watch mode for development
```

### Integration Testing
- MCP Server connectivity tests
- n8n workflow integration tests
- DIMO API authentication tests
- OpenAI API integration tests

### Manual Testing
- Vehicle data loading and display
- AI chat functionality
- Authentication flow
- Document processing
- Responsive design across devices

## 📊 Performance

### Optimization Features
- **Code Splitting**: Lazy-loaded components and routes
- **Image Optimization**: WebP format with fallbacks
- **Caching**: Intelligent data caching and state management
- **Bundle Analysis**: Optimized bundle sizes
- **Vite Build**: Fast development and optimized production builds

### Monitoring
- Real-time performance metrics
- Error tracking and reporting
- User interaction analytics
- API response time monitoring

## 🔐 Security

### Authentication
- **DIMO OAuth**: Secure blockchain-based authentication
- **JWT Management**: Automatic token refresh and validation
- **Permission System**: Granular access control
- **Session Management**: Secure session handling

### Data Protection
- **Encrypted Storage**: Sensitive data encryption
- **API Security**: Rate limiting and request validation
- **Privacy Controls**: User-controlled data sharing
- **Audit Logging**: Comprehensive activity tracking

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Automatic code formatting
- **Conventional Commits**: Standardized commit messages

## 📚 Documentation

### Additional Resources
- [DIMO Developer Documentation](https://docs.dimo.org/)
- [DIMO GraphQL Playground](https://identity-api.dimo.zone/)
- [n8n Documentation](https://docs.n8n.io/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [OpenAI API Documentation](https://platform.openai.com/docs)

### API References
- [DIMO Identity API](https://identity-api.dimo.zone/)
- [DIMO Telemetry API](https://telemetry-api.dimo.zone/)
- [DIMO Developer Console](https://console.dimo.org/)
- [OCR.space API](https://ocr.space/ocrapi)

## 🐛 Troubleshooting

### Common Issues

**Authentication Problems**
- Verify DIMO credentials are correct
- Check redirect URI configuration
- Ensure developer license is active

**AI Workflow Issues**
- Confirm n8n webhook URL is accessible
- Check API key permissions
- Verify workflow is properly configured

**MCP Server Issues**
- Ensure server is running on port 3001
- Check DIMO API credentials
- Verify network connectivity

**OpenAI Integration Issues**
- Verify OpenAI API key is valid
- Check API usage limits
- Ensure proper endpoint configuration

**Document Processing Issues**
- Verify OCR service configuration
- Check file format support
- Ensure proper API keys

**Build Issues**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Verify environment variables are set

## 📈 Roadmap

### Phase 1 (Current)
- ✅ Core vehicle dashboard
- ✅ AI chat interface with OpenAI integration
- ✅ Basic vehicle management
- ✅ DIMO authentication
- ✅ MCP server integration
- ✅ Document intelligence
- ✅ Real-time telemetry
- ✅ Advanced AI analysis

### Phase 2 (Planned)
- 🔄 Emergency response features
- 🔄 Seasonal adaptation
- 🔄 Cost optimization
- 🔄 Multi-vehicle optimization
- 🔄 Advanced predictive analytics
- 🔄 Fleet management features

### Phase 3 (Future)
- 📋 Mobile app integration
- 📋 Third-party integrations
- 📋 Advanced security features
- 📋 Machine learning models
- 📋 IoT device integration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **DIMO Network** for the blockchain infrastructure and APIs
- **n8n** for the powerful workflow automation platform
- **OpenAI** for the AI capabilities and language models
- **React Team** for the amazing frontend framework
- **Tailwind CSS** for the utility-first CSS framework
- **shadcn/ui** for the beautiful component library

## 📞 Support

- **Discord**: [DIMO Community](https://discord.gg/dimo)
- **Documentation**: [docs.dimo.org](https://docs.dimo.org/)
- **Issues**: [GitHub Issues](https://github.com/DIMO-Network/data-sdk/issues)
- **Email**: support@dimo.org

---

**Built with ❤️ by the DIMO Network team**
