# DIMO AI - Intelligent Vehicle Management Platform

A sophisticated web application that transforms DIMO-connected vehicles into intelligent automotive companions with AI-powered insights, predictive maintenance, and autonomous capabilities.

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


### Frontend Technologies
- [React 18](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development
- [Vite](https://vitejs.dev/) - Build tool and dev server
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Accessible UI components
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [React Router](https://reactrouter.com/) - Client-side routing
- [tRPC](https://trpc.io/) - Type-safe API communication
- [TanStack Query](https://tanstack.com/query) - Data fetching and caching
- [Zod](https://zod.dev/) - Schema validation
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Recharts](https://recharts.org/) - Chart components
- [Lucide React](https://lucide.dev/) - Icon library

### Backend & AI Integration
- [OpenAI API](https://platform.openai.com/) - AI language models
- [DIMO Network](https://dimo.zone/) - Vehicle data platform
- [Model Context Protocol](https://modelcontextprotocol.io/) - AI assistant integration
- [Bun](https://bun.sh/) - JavaScript runtime for MCP server
- [Express.js](https://expressjs.com/) - Web framework for MCP server
- [GraphQL](https://graphql.org/) - API query language

### Data & Storage
- [Supabase](https://supabase.com/) - Database and authentication
- [DIMO Identity API](https://identity-api.dimo.zone/) - Vehicle identity data
- [DIMO Telemetry API](https://telemetry-api.dimo.zone/) - Vehicle telemetry data
- [OCR.space](https://ocr.space/) - Document text extraction

### Development Tools
- [ESLint](https://eslint.org/) - Code linting
- [PostCSS](https://postcss.org/) - CSS processing
- [Autoprefixer](https://autoprefixer.github.io/) - CSS vendor prefixes

## Overview

DIMO AI is a comprehensive vehicle management platform that leverages artificial intelligence to provide real-time vehicle diagnostics, predictive maintenance, trip planning, and intelligent recommendations. Built on the DIMO Network infrastructure, it offers seamless integration with connected vehicles and blockchain-based data security.

## Key Features

### AI-Powered Vehicle Intelligence
- Real-time Health Monitoring: Continuous analysis of vehicle systems with intelligent diagnostics
- Predictive Maintenance: AI-powered predictions to prevent breakdowns before they happen
- Smart Trip Planning: Journey optimization with real-time traffic and charging data
- Natural Language Chat: Conversational AI assistant for vehicle queries and assistance
- Document Intelligence: Upload receipts and get automatic maintenance reminders
- Multi-Vehicle Optimization: Manage and optimize multiple vehicles simultaneously

### Vehicle Management
- Multi-Vehicle Support: Manage multiple DIMO-connected vehicles from a single dashboard
- Real-time Telemetry: Live vehicle data including fuel/battery levels, tire pressure, and diagnostics
- Service Tracking: Automated maintenance scheduling and cost estimation
- Emergency Response: Intelligent emergency assistance and roadside support
- Seasonal Adaptation: Weather-aware vehicle recommendations and adjustments

### Security & Privacy
- Blockchain-based Data: Secure, decentralized vehicle data storage
- DIMO Authentication: Seamless integration with DIMO Network authentication
- Privacy-First: User-controlled data sharing and permissions
- Verifiable Credentials: Proof of Movement and VIN credential creation

### Modern User Experience
- Responsive Design: Beautiful, modern UI that works on all devices
- Real-time Updates: Live data streaming and instant notifications
- Intuitive Navigation: Clean, organized interface with smart categorization
- Dark Mode Support: Automatic theme switching with system preferences

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
- OpenAI API: Advanced AI language models for intelligent analysis
- DIMO Telemetry Integration: Real-time vehicle data processing
- External API Integration: Weather, traffic, and service provider APIs
- DIMO MCP Server: Model Context Protocol integration for AI assistants
- tRPC Server: Type-safe backend API with validation

### Data & APIs
- DIMO Network APIs: Identity and Telemetry GraphQL endpoints
- Real-time Telemetry: Live vehicle data streaming
- Blockchain Integration: Secure, decentralized data storage
- External Services: Weather, traffic, and service provider APIs
- OCR Services: Document processing with OCR.space API

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
│   │   ├── n8nClient.ts     # AI workflow integration
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
- Real-time Health Monitoring: Live vehicle status and health scores
- AI-Powered Insights: Intelligent analysis and recommendations
- Multi-Vehicle Management: Support for multiple connected vehicles
- Service Tracking: Automated maintenance scheduling
- Document Intelligence: Upload and analyze maintenance records

### AI Chat Assistant (Enhanced)
- Natural Language Interface: Conversational vehicle queries
- Context-Aware Responses: Vehicle-specific recommendations
- Multi-turn Conversations: Maintains context across interactions
- Quick Actions: Pre-built queries for common tasks
- Real-time Data Integration: Live telemetry and historical data
- Advanced AI Analysis: OpenAI GPT-4 powered insights

### AI Vehicle Analysis
- Health Analysis: Comprehensive system diagnostics
- Maintenance Checks: Service interval and wear item analysis
- Trip Readiness: Pre-trip safety and preparation assessment
- Nearby Services: Location-based service recommendations
- Cost Optimization: Maintenance cost analysis and budgeting
- Emergency Response: Intelligent emergency assistance

### Document Intelligence
- OCR Processing: Extract text from receipts and documents
- Maintenance Tracking: Automatic service schedule extraction
- Cost Analysis: Expense tracking and cost estimation
- Receipt Processing: Oil change and service receipt analysis
- Registration Documents: Vehicle information extraction
- AI Insights: Intelligent document analysis and recommendations

### MCP Integration
- DIMO API Access: Direct GraphQL query capabilities
- VIN Operations: Vehicle identification and decoding
- Telemetry Queries: Real-time and historical data access
- Verifiable Credentials: Proof of Movement and VIN credentials
- Schema Introspection: API discovery and documentation

### DIMO Attestation
- Document Attestation: Create verifiable credentials for vehicle documents
- Privacy Controls: User-controlled data sharing and permissions
- Blockchain Integration: Secure, decentralized document storage
- VIN Credentials: Vehicle identification verification

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
- Custom Tailwind Theme: Automotive-focused color palette
- Responsive Layout: Mobile-first design approach
- Accessibility: WCAG 2.1 AA compliant components
- Dark Mode: Automatic theme switching
- shadcn/ui: Modern, accessible component library

### Key Components
- VehicleCard: Interactive vehicle display with AI actions
- AIChatEnhanced: Advanced conversational interface with real-time data
- DocumentIntelligence: Document processing and analysis
- DocumentUpload: File upload with drag-and-drop support
- Dashboard: Multi-vehicle overview with real-time data
- AppLayout: Responsive sidebar navigation
- McpTest: MCP server testing interface
- DimoAttestationTest: DIMO attestation testing interface

## Deployment

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build for development
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
- Code Splitting: Lazy-loaded components and routes
- Image Optimization: WebP format with fallbacks
- Caching: Intelligent data caching and state management
- Bundle Analysis: Optimized bundle sizes
- Vite Build: Fast development and optimized production builds

### Monitoring
- Real-time performance metrics
- Error tracking and reporting
- User interaction analytics
- API response time monitoring

## Security

### Authentication
- DIMO OAuth: Secure blockchain-based authentication
- JWT Management: Automatic token refresh and validation
- Permission System: Granular access control
- Session Management: Secure session handling

### Data Protection
- Encrypted Storage: Sensitive data encryption
- API Security: Rate limiting and request validation
- Privacy Controls: User-controlled data sharing
- Audit Logging: Comprehensive activity tracking

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

## Roadmap

### Phase 1 (Current)
- Core vehicle dashboard
- AI chat interface with OpenAI integration
- Basic vehicle management
- DIMO authentication
- MCP server integration
- Document intelligence
- Real-time telemetry
- Advanced AI analysis

### Phase 2 (Planned)
- Emergency response features
- Seasonal adaptation
- Cost optimization
- Multi-vehicle optimization
- Advanced predictive analytics
- Fleet management features

### Phase 3 (Future)
- Mobile app integration
- Third-party integrations
- Advanced security features
- Machine learning models
- IoT device integration

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- DIMO Network for the blockchain infrastructure and APIs
- OpenAI for the AI capabilities and language models
- React Team for the amazing frontend framework
- Tailwind CSS for the utility-first CSS framework
- shadcn/ui for the beautiful component library

## Support

- Discord: [DIMO Community](https://discord.gg/dimo)
- Documentation: [docs.dimo.org](https://docs.dimo.org/)
- Issues: [GitHub Issues](https://github.com/DIMO-Network/data-sdk/issues)
- Email: support@dimo.org

---

**Built with love by the DIMO Network team**
