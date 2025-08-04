import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface McpTestResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    processingTime: number;
    operation: string;
    timestamp: string;
  };
}

export function McpTest() {
  const [vin, setVin] = useState('1HGCM82633A123456');
  const [tokenId, setTokenId] = useState('8');
  const [results, setResults] = useState<McpTestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const testMcpEndpoint = async (endpoint: string, params: any) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/mcp/tools/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ params }),
      });

      const result: McpTestResult = await response.json();
      setResults(prev => [...prev, result]);
    } catch (error) {
      setResults(prev => [...prev, {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        metadata: {
          processingTime: 0,
          operation: endpoint,
          timestamp: new Date().toISOString(),
        }
      }]);
    } finally {
      setLoading(false);
    }
  };

  const testHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/health');
      const result = await response.json();
      setResults(prev => [...prev, {
        success: true,
        data: result,
        metadata: {
          processingTime: 0,
          operation: 'health',
          timestamp: new Date().toISOString(),
        }
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        metadata: {
          processingTime: 0,
          operation: 'health',
          timestamp: new Date().toISOString(),
        }
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>DIMO MCP Server Test</CardTitle>
          <CardDescription>
            Test the DIMO MCP server integration with your Mercedes-Benz (Token ID: 8)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vin">VIN for Testing</Label>
              <Input
                id="vin"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="Enter VIN"
              />
            </div>
            <div>
              <Label htmlFor="tokenId">Token ID</Label>
              <Input
                id="tokenId"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                placeholder="Enter Token ID"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <Button onClick={testHealth} disabled={loading} variant="outline">
              Health Check
            </Button>
            
            <Button 
              onClick={() => testMcpEndpoint('vin_operations', { operation: 'decode', vin: vin })}
              disabled={loading}
              variant="outline"
            >
              VIN Decode
            </Button>

            <Button 
              onClick={() => testMcpEndpoint('identity_query', { 
                query: `{ vehicle(tokenId: ${tokenId}) { tokenId definition { make model year } owner aftermarketDevice { id serial manufacturer { name } } earnings { totalTokens } } }`
              })}
              disabled={loading}
              variant="outline"
            >
              Vehicle Details
            </Button>

            <Button 
              onClick={() => testMcpEndpoint('telemetry_query', { 
                query: `{ signalsLatest(tokenId: ${tokenId}) { speed { value timestamp } powertrainFuelSystemRelativeLevel { value timestamp } powertrainTransmissionTravelledDistance { value timestamp } } }`,
                variables: { tokenId: tokenId },
                tokenId: parseInt(tokenId)
              })}
              disabled={loading}
              variant="outline"
            >
              Latest Telemetry
            </Button>

            <Button 
              onClick={() => testMcpEndpoint('telemetry_query', { 
                query: `{ signalsLatest(tokenId: ${tokenId}) { powertrainType { value } } }`,
                variables: { tokenId: tokenId },
                tokenId: parseInt(tokenId)
              })}
              disabled={loading}
              variant="outline"
            >
              Powertrain Type
            </Button>

            <Button 
              onClick={() => testMcpEndpoint('telemetry_query', { 
                query: `{ signalsLatest(tokenId: ${tokenId}) { exteriorAirTemperature { value timestamp } } }`,
                variables: { tokenId: tokenId },
                tokenId: parseInt(tokenId)
              })}
              disabled={loading}
              variant="outline"
            >
              Exterior Temperature
            </Button>

            <Button 
              onClick={() => testMcpEndpoint('telemetry_query', { 
                query: `{ signalsLatest(tokenId: ${tokenId}) { powertrainCombustionEngineSpeed { value timestamp } powertrainCombustionEngineECT { value timestamp } obdEngineLoad { value timestamp } } }`,
                variables: { tokenId: tokenId },
                tokenId: parseInt(tokenId)
              })}
              disabled={loading}
              variant="outline"
            >
              Engine Diagnostics
            </Button>

            <Button 
              onClick={() => testMcpEndpoint('telemetry_query', { 
                query: `{ signalsLatest(tokenId: ${tokenId}) { currentLocationLatitude { value timestamp } currentLocationLongitude { value timestamp } currentLocationAltitude { value timestamp } } }`,
                variables: { tokenId: tokenId },
                tokenId: parseInt(tokenId)
              })}
              disabled={loading}
              variant="outline"
            >
              Location Data
            </Button>

            <Button 
              onClick={() => testMcpEndpoint('telemetry_query', { 
                query: `{ signalsLatest(tokenId: ${tokenId}) { chassisAxleRow1WheelLeftTirePressure { value timestamp } chassisAxleRow1WheelRightTirePressure { value timestamp } } }`,
                variables: { tokenId: tokenId },
                tokenId: parseInt(tokenId)
              })}
              disabled={loading}
              variant="outline"
            >
              Tire Pressure
            </Button>

            <Button 
              onClick={() => testMcpEndpoint('attestation_create', { 
                tokenId: parseInt(tokenId), 
                type: 'pom', 
                force: false 
              })}
              disabled={loading}
              variant="outline"
            >
              Create POM
            </Button>

            <Button 
              onClick={() => testMcpEndpoint('attestation_create', { 
                tokenId: parseInt(tokenId), 
                type: 'vin', 
                force: false 
              })}
              disabled={loading}
              variant="outline"
            >
              Create VIN VC
            </Button>

            <Button 
              onClick={() => testMcpEndpoint('identity_query', { 
                query: `{ vehicles(first: 5) { nodes { tokenId definition { make model year } } } }`
              })}
              disabled={loading}
              variant="outline"
            >
              List Vehicles
            </Button>

            <Button 
              onClick={() => testMcpEndpoint('telemetry_query', { 
                query: `{ signals(tokenId: ${tokenId}, from: "2025-07-25T00:00:00Z", to: "2025-07-31T23:59:59Z", interval: "24h") { timestamp speed(agg: MAX) powertrainFuelSystemRelativeLevel(agg: AVG) } }`,
                variables: { tokenId: tokenId },
                tokenId: parseInt(tokenId)
              })}
              disabled={loading}
              variant="outline"
            >
              Historical Data
            </Button>

            <Button 
              onClick={async () => {
                setLoading(true);
                try {
                  const response = await fetch(`http://localhost:3001/refresh-jwt/${tokenId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ privileges: [1, 2, 3, 4, 5] })
                  });
                  const result = await response.json();
                  setResults(prev => [...prev, {
                    success: result.success,
                    data: result,
                    error: result.error,
                    metadata: {
                      processingTime: 0,
                      operation: 'refresh_jwt',
                      timestamp: new Date().toISOString(),
                    }
                  }]);
                } catch (error) {
                  setResults(prev => [...prev, {
                    success: false,
                    error: error instanceof Error ? error.message : 'JWT refresh failed',
                    metadata: {
                      processingTime: 0,
                      operation: 'refresh_jwt',
                      timestamp: new Date().toISOString(),
                    }
                  }]);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              variant="outline"
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300"
            >
              🔄 Refresh JWT
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={clearResults} variant="destructive">
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Results from MCP server tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "SUCCESS" : "FAILED"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {result.metadata?.operation} - {result.metadata?.timestamp}
                    </span>
                  </div>
                  
                  {result.success ? (
                    <div className="space-y-2">
                      <Label>Data:</Label>
                      <Textarea
                        value={JSON.stringify(result.data, null, 2)}
                        readOnly
                        className="font-mono text-xs"
                        rows={8}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Error:</Label>
                      <Textarea
                        value={result.error || 'Unknown error'}
                        readOnly
                        className="font-mono text-xs text-red-600"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 