# DIMO AI - Intelligent Vehicle Management Platform

A sophisticated web application that transforms DIMO-connected vehicles into intelligent automotive companions with AI-powered insights, predictive maintenance, and autonomous capabilities.

## Live Demo

- **Production**: [https://dimo-drive-ai.vercel.app/](https://dimo-drive-ai.vercel.app/)
- **Railway Hosting**: [https://railway.com/project/a599968c-febc-4efd-a375-018b10601280](https://railway.com/project/a599968c-febc-4efd-a375-018b10601280?environmentId=5cd72ba1-dad4-43f9-be1e-faab74db60d1)
- **Demo Video**: [Watch 3-Minute Demo](https://www.loom.com/share/da6c1d7fcb314bc2a56788f870cd3791?sid=e95e94e2-f354-4f0b-a74c-9ffd2fe21d94)

## Tech Stack

![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-5.4+-646CFF?logo=vite&logoColor=white&style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge)
![Radix UI](https://img.shields.io/badge/Radix_UI-1.0+-161618?logo=radixui&logoColor=white&style=for-the-badge)
![tRPC](https://img.shields.io/badge/tRPC-11.4+-2596BE?logo=trpc&logoColor=white&style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-2.53+-3ECF8E?logo=supabase&logoColor=white&style=for-the-badge)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT_4+-412991?logo=openai&logoColor=white&style=for-the-badge)
![DIMO](https://img.shields.io/badge/DIMO_Network-1.3+-000000?logo=dimo&logoColor=white&style=for-the-badge)
![Railway](https://img.shields.io/badge/Railway-Hosted-0B0D0E?logo=railway&logoColor=white&style=for-the-badge)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel&logoColor=white&style=for-the-badge)

| Category | Technology | Description |
|----------|------------|-------------|
| **Frontend** | React 18, TypeScript, Vite | UI framework, type-safe development, build tool |
| | Tailwind CSS, Radix UI, shadcn/ui | CSS framework, accessible components, component library |
| | React Router, tRPC, TanStack Query | Client-side routing, type-safe API, data fetching |
| | Zod, Framer Motion, Recharts, Lucide React | Schema validation, animations, charts, icons |
| **Backend & AI** | OpenAI API (GPT-4o), DIMO Network | AI language models, vehicle data platform |
| | Model Context Protocol, Bun, Express.js | AI assistant integration, runtime, web framework |
| | GraphQL | API query language |
| **Data & Storage** | Supabase, DIMO APIs | Database, authentication, vehicle data |
| | OCR.space | Document text extraction |
| **Deployment** | Vercel, Railway, Docker | Frontend hosting, backend services, containerization |
| **Development** | ESLint, PostCSS, Autoprefixer | Code linting, CSS processing, vendor prefixes |

## Overview

DIMO AI is a comprehensive vehicle management platform that leverages artificial intelligence to provide real-time vehicle diagnostics, predictive maintenance, trip planning, and intelligent recommendations. Built on the DIMO Network infrastructure, it offers seamless integration with connected vehicles and blockchain-based data security.

## Key Features

### AI-Powered Vehicle Intelligence
- **Real-time Health Monitoring**: Continuous analysis of vehicle systems with intelligent diagnostics
- **Predictive Maintenance**: AI-powered predictions to prevent breakdowns before they happen
- **Smart Trip Planning**: Journey optimization with real-time traffic and charging data
- **Natural Language Chat**: Conversational AI assistant for vehicle queries and assistance
- **Document Intelligence**: Upload receipts and get automatic maintenance reminders
- **Multi-Vehicle Optimization**: Manage and optimize multiple vehicles simultaneously

### Vehicle Management
- **Multi-Vehicle Support**: Manage multiple DIMO-connected vehicles from a single dashboard
- **Real-time Telemetry**: Live vehicle data including fuel/battery levels, tire pressure, and diagnostics
- **Service Tracking**: Automated maintenance scheduling and cost estimation
- **Emergency Response**: Intelligent emergency assistance and roadside support
- **Seasonal Adaptation**: Weather-aware vehicle recommendations and adjustments

### Security & Privacy
- **Blockchain-based Data**: Secure, decentralized vehicle data storage
- **DIMO Authentication**: Seamless integration with DIMO Network authentication
- **Privacy-First**: User-controlled data sharing and permissions
- **Verifiable Credentials**: Proof of Movement and VIN credential creation

### Modern User Experience
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **Real-time Updates**: Live data streaming and instant notifications
- **Intuitive Navigation**: Clean, organized interface with smart categorization
- **Dark Mode Support**: Automatic theme switching with system preferences

## Architecture

### Frontend Stack
- React 18 with TypeScript for type-safe development
- Vite for fast development and optimized builds
- Tailwind CSS with custom design system and shadcn/ui components
- Radix UI components for accessible, customizable UI
- React Router for client-side routing
- tRPC for type-safe API communication
- TanStack Query for efficient data fetching and caching

### Backend & AI Integration
- **OpenAI API**: Advanced AI language models for intelligent analysis (GPT-4o)
- **DIMO Telemetry Integration**: Real-time vehicle data processing
- **External API Integration**: Weather, traffic, and service provider APIs
- **DIMO MCP Server**: Model Context Protocol integration for AI assistants
- **tRPC Server**: Type-safe backend API with validation

### Data & APIs
- **DIMO Network APIs**: Identity and Telemetry GraphQL endpoints
- **Real-time Telemetry**: Live vehicle data streaming
- **Blockchain Integration**: Secure, decentralized data storage
- **External Services**: Weather, traffic, and service provider APIs
- **OCR Services**: Document processing with OCR.space API

## Getting Started

### Prerequisites
- Node.js 18+ 
- DIMO Developer Account ([console.dimo.org](https://console.dimo.org))
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
Copy the example environment file and configure your credentials:
```bash
cp env.example .env
```

Required environment variables:
```env
# DIMO Integration
VITE_DIMO_CLIENT_ID=your_client_id
VITE_DIMO_API_KEY=your_api_key
VITE_DIMO_DOMAIN=your_domain
VITE_DIMO_DEVELOPER_JWT=your_developer_jwt

# OpenAI Integration
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_OPENAI_ENDPOINT=https://api.openai.com/v1
VITE_OPENAI_ORG_ID=your_org_id  # Optional

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OCR Services
VITE_OCR_API_KEY=your_ocr_api_key

# MCP Server (Optional)
VITE_DIMO_MCP_SERVER_URL=http://localhost:3001
VITE_MCP_SERVER_URL=http://localhost:3001
```

4. **Start the development server**
```bash
npm run dev
```

5. **Access the application**
Open [http://localhost:8080](http://localhost:8080) in your browser

## Project Structure

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
│   │   ├── DimoAttestationTest.tsx # DIMO attestation testing
│   │   └── McpTest.tsx      # MCP server testing
│   ├── pages/
│   │   ├── Landing.tsx      # Landing page
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── AIChat.tsx       # AI chat interface
│   │   ├── AuthLogin.tsx    # Authentication
│   │   └── NotFound.tsx     # 404 page
│   ├── services/
│   │   ├── aiService.ts     # AI analysis service
│   │   ├── dimoMcpClient.ts # MCP server client
│   │   ├── mcpDocumentProcessor.ts # Document processing
│   │   ├── documentProcessor.ts # Advanced document processing
│   │   ├── dimoAttestationService.ts # DIMO attestation
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
│   │   ├── database.ts     # Database utilities
│   │   └── utils.ts        # Utility functions
│   ├── hooks/
│   │   ├── use-mobile.tsx  # Mobile detection
│   │   └── use-toast.ts    # Toast notifications
│   ├── config/
│   │   └── documentProcessing.ts # Document config
│   ├── types/
│   │   └── privacy.ts      # Privacy type definitions
│   └── assets/             # Static assets
├── mcp-dimo/               # DIMO MCP Server
│   ├── src/
│   │   ├── helpers/        # MCP utilities
│   │   │   ├── headers.ts
│   │   │   ├── introspection.ts
│   │   │   └── package.ts
│   │   └── index.ts        # Main server
│   ├── http-server.ts      # HTTP server for development
│   └── README.md           # MCP documentation
├── public/                 # Static assets
├── scripts/                # Setup and deployment scripts
└── configuration files     # Various config files
```

## Configuration

### DIMO Integration
1. Create a developer account at [console.dimo.org](https://console.dimo.org)
2. Generate API credentials (Client ID, Domain, Private Key)
3. Configure environment variables for authentication
4. Set up vehicle permissions and privileges

### MCP Server (Optional)
1. Navigate to `mcp-dimo/` directory
2. Install dependencies: `bun install`
3. Configure DIMO credentials in environment
4. Start server: `bun run http-server`
5. Test with the built-in test interface

### OpenAI Integration
1. Get an OpenAI API key from [platform.openai.com](https://platform.openai.com)
2. Configure the API key in environment variables
3. Enable advanced AI features in the application

## Core Features

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
- **Advanced AI Analysis**: OpenAI GPT-4o powered insights

### AI Vehicle Analysis
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

### DIMO Attestation
- **Document Attestation**: Create verifiable credentials for vehicle documents
- **Privacy Controls**: User-controlled data sharing and permissions
- **Blockchain Integration**: Secure, decentralized document storage
- **VIN Credentials**: Vehicle identification verification

## API Endpoints

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

## UI Components

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
- **DocumentUpload**: File upload with drag-and-drop support
- **Dashboard**: Multi-vehicle overview with real-time data
- **AppLayout**: Responsive sidebar navigation
- **McpTest**: MCP server testing interface
- **DimoAttestationTest**: DIMO attestation testing interface

## Deployment

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build for development
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Production Deployment

#### Vercel (Frontend)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch
4. Access at: [https://dimo-drive-ai.vercel.app/](https://dimo-drive-ai.vercel.app/)

#### Railway (Backend Services)
1. Connect your GitHub repository to Railway
2. Configure environment variables in Railway dashboard
3. Deploy MCP server and backend services
4. Monitor at: [Railway Dashboard](https://railway.com/project/a599968c-febc-4efd-a375-018b10601280)

### Docker Deployment
```bash
# Build Docker image
docker build -t dimo-ai-web .

# Run container
docker run -p 8080:8080 dimo-ai-web
```

## Testing

### Component Testing
```bash
npm run test         # Run unit tests
npm run test:watch   # Watch mode for development
```

### Integration Testing
- MCP Server connectivity tests
- DIMO API authentication tests
- OpenAI API integration tests

### Manual Testing
- Vehicle data loading and display
- AI chat functionality
- Authentication flow
- Document processing
- Responsive design across devices

## Performance

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

## Security

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

## Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Standards
- TypeScript: Strict type checking enabled
- ESLint: Code quality and consistency
- Prettier: Automatic code formatting
- Conventional Commits: Standardized commit messages

## Documentation

### Additional Resources
- [DIMO Developer Documentation](https://docs.dimo.org/)
- [DIMO GraphQL Playground](https://identity-api.dimo.zone/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [OpenAI API Documentation](https://platform.openai.com/docs)

### API References
- [DIMO Identity API](https://identity-api.dimo.zone/)
- [DIMO Telemetry API](https://telemetry-api.dimo.zone/)
- [DIMO Developer Console](https://console.dimo.org/)
- [OCR.space API](https://ocr.space/ocrapi)

## Troubleshooting

### Common Issues

**Authentication Problems**
- Verify DIMO credentials are correct
- Check redirect URI configuration
- Ensure developer license is active

**AI Integration Issues**
- Verify OpenAI API key is valid
- Check API usage limits
- Ensure proper endpoint configuration

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

**Production Deployment Issues**
- Check environment variables in Vercel/Railway dashboards
- Verify API endpoints are accessible
- Check CORS configuration for cross-origin requests


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- DIMO Network for the blockchain infrastructure and APIs
- OpenAI for the AI capabilities and language models
- React Team for the amazing frontend framework
- Tailwind CSS for the utility-first CSS framework
- shadcn/ui for the beautiful component library
- Vercel for seamless frontend deployment
- Railway for reliable backend hosting

## Support

- Discord: [DIMO Community](https://discord.gg/dimo)
- Documentation: [docs.dimo.org](https://docs.dimo.org/)
- Issues: [GitHub Issues](https://github.com/DIMO-Network/data-sdk/issues)
- Email: support@dimo.org

---

**Built with love by the DIMO Network team**
