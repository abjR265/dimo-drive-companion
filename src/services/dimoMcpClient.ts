// DIMO MCP Client Service
// Interfaces with the DIMO MCP server to provide vehicle data access

export interface DimoMcpConfig {
  serverUrl: string;
  clientId: string;
  domain: string;
  privateKey: string;
  timeout?: number;
}

export interface DimoIdentityQuery {
  query: string;
  variables?: Record<string, any>;
}

export interface DimoTelemetryQuery {
  query: string;
  variables?: Record<string, any>;
  tokenId: number;
}

export interface DimoVinOperation {
  operation: 'decode' | 'get';
  vin?: string;
  countryCode?: string;
  tokenId?: number;
}

export interface DimoVehicleSearch {
  query?: string;
  makeSlug?: string;
  year?: number;
  model?: string;
}

export interface DimoAttestation {
  tokenId: number;
  type: 'pom' | 'vin';
  force?: boolean;
}

export interface DimoMcpResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    processingTime: number;
    operation: string;
    timestamp: string;
  };
}

class DimoMcpClient {
  private config: DimoMcpConfig;
  private timeout: number;

  constructor(config: DimoMcpConfig) {
    this.config = config;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Query DIMO Identity GraphQL API (public)
   */
  async identityQuery(request: DimoIdentityQuery): Promise<DimoMcpResponse> {
    return this.callMcpTool('identity_query', {
      query: request.query,
      variables: request.variables || {},
    });
  }

  /**
   * Query DIMO Telemetry GraphQL API (authenticated)
   */
  async telemetryQuery(request: DimoTelemetryQuery): Promise<DimoMcpResponse> {
    return this.callMcpTool('telemetry_query', {
      query: request.query,
      variables: {
        ...request.variables,
        tokenId: request.tokenId.toString(),
      },
      tokenId: request.tokenId,
    });
  }

  /**
   * VIN operations (decode or get)
   */
  async vinOperations(request: DimoVinOperation): Promise<DimoMcpResponse> {
    return this.callMcpTool('vin_operations', {
      operation: request.operation,
      ...(request.vin && { vin: request.vin }),
      ...(request.countryCode && { countryCode: request.countryCode }),
      ...(request.tokenId && { tokenId: request.tokenId }),
    });
  }



  /**
   * Search for vehicles in DIMO
   */
  async searchVehicles(request: DimoVehicleSearch): Promise<DimoMcpResponse> {
    return this.callMcpTool('search_vehicles', {
      ...(request.query && { query: request.query }),
      ...(request.makeSlug && { makeSlug: request.makeSlug }),
      ...(request.year && { year: request.year }),
      ...(request.model && { model: request.model }),
    });
  }

  /**
   * Create verifiable credentials
   */
  async createAttestation(request: DimoAttestation): Promise<DimoMcpResponse> {
    return this.callMcpTool('attestation_create', {
      tokenId: request.tokenId,
      type: request.type,
      force: request.force || false,
    });
  }

  /**
   * Get Identity API schema
   */
  async getIdentitySchema(): Promise<DimoMcpResponse> {
    return this.callMcpTool('identity_introspect', {});
  }

  /**
   * Get Telemetry API schema
   */
  async getTelemetrySchema(): Promise<DimoMcpResponse> {
    return this.callMcpTool('telemetry_introspect', {});
  }

  /**
   * Generic MCP tool call
   */
  private async callMcpTool(toolName: string, params: any): Promise<DimoMcpResponse> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.config.serverUrl}/mcp/tools/${toolName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.clientId}`,
        },
        body: JSON.stringify({
          params,
          metadata: {
            source: 'dimo-ai-web',
            timestamp: new Date().toISOString(),
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`MCP tool call failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        data: result.data,
        metadata: {
          processingTime: Date.now() - startTime,
          operation: toolName,
          timestamp: new Date().toISOString(),
        },
      };

    } catch (error) {
      console.error(`DIMO MCP ${toolName} error:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'MCP tool call failed',
        metadata: {
          processingTime: Date.now() - startTime,
          operation: toolName,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Health check for MCP server
   */
  async healthCheck(): Promise<{ available: boolean; latency?: number }> {
    try {
      const startTime = Date.now();
      const response = await fetch(`${this.config.serverUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      
      const latency = Date.now() - startTime;
      return { 
        available: response.ok, 
        latency: response.ok ? latency : undefined 
      };
    } catch {
      return { available: false };
    }
  }

  /**
   * Convenience methods for common operations
   */
  
  async getVehicleInfo(tokenId: number): Promise<DimoMcpResponse> {
    return this.identityQuery({
      query: `{
        vehicle(tokenId: ${tokenId}) {
          owner
          tokenId
          definition {
            make
            model
            year
          }
        }
      }`,
    });
  }

  async getVehicleTelemetry(tokenId: number): Promise<DimoMcpResponse> {
    return this.telemetryQuery({
      tokenId,
      query: `{
        vehicle(tokenId: ${tokenId}) {
          signalsLatest {
            speed {
              value
              timestamp
            }
            batteryLevel {
              value
              timestamp
            }
            fuelLevel {
              value
              timestamp
            }
            odometer {
              value
              timestamp
            }
            tirePressure {
              frontLeft { value timestamp }
              frontRight { value timestamp }
              rearLeft { value timestamp }
              rearRight { value timestamp }
            }
          }
        }
      }`,
    });
  }

  async decodeVin(vin: string, countryCode: string = 'USA'): Promise<DimoMcpResponse> {
    return this.vinOperations({
      operation: 'decode',
      vin,
      countryCode,
    });
  }

  async searchTeslaVehicles(year?: number): Promise<DimoMcpResponse> {
    return this.searchVehicles({
      makeSlug: 'tesla',
      year,
    });
  }

  async createProofOfMovement(tokenId: number): Promise<DimoMcpResponse> {
    return this.createAttestation({
      tokenId,
      type: 'pom',
    });
  }
}

// Export singleton instance
export const dimoMcpClient = new DimoMcpClient({
  serverUrl: import.meta.env.VITE_DIMO_MCP_SERVER_URL || 'http://localhost:3001',
  clientId: import.meta.env.VITE_DIMO_CLIENT_ID || '',
  domain: import.meta.env.VITE_DIMO_DOMAIN || '',
  privateKey: import.meta.env.VITE_DIMO_PRIVATE_KEY || '',
});

 