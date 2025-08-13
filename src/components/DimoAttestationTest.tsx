import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DimoAttestationService } from '@/services/dimoAttestationService';
import { DEFAULT_PRIVACY_SETTINGS } from '@/types/privacy';
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export const DimoAttestationTest: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    connection: boolean | null;
    attestation: boolean | null;
    error?: string;
  }>({
    connection: null,
    attestation: null
  });

  const attestationService = new DimoAttestationService(
    import.meta.env.VITE_DIMO_CLIENT_ID || '',
    import.meta.env.VITE_DIMO_API_KEY || '',
    import.meta.env.VITE_DIMO_DOMAIN || ''
  );

  const testConnection = async () => {
    setIsTesting(true);
    setTestResults({ connection: null, attestation: null });
    
    try {
      const success = await attestationService.testConnection();
      setTestResults(prev => ({ ...prev, connection: success }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        connection: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    } finally {
      setIsTesting(false);
    }
  };

  const testAttestation = async () => {
    setIsTesting(true);
    setTestResults(prev => ({ ...prev, attestation: null }));
    
    try {
      // Create a mock document for testing
      const mockDocument = {
        documentType: 'car_registration' as const,
        vin: '1HGBH41JXMN109186',
        vehicleInfo: {
          make: 'Honda',
          model: 'Civic',
          year: 2024,
          color: 'Blue'
        },
        registrationInfo: {
          plateNumber: 'ABC123',
          expiryDate: '2025-12-31'
        },
        alertDates: {
          registrationExpiry: '2025-12-31'
        }
      };

      const success = await attestationService.createDocumentAttestation(
        mockDocument,
        8, // Test vehicle token ID
        DEFAULT_PRIVACY_SETTINGS
      );
      
      setTestResults(prev => ({ ...prev, attestation: success }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        attestation: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>DIMO Attestation Service Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold">Environment Variables</h3>
          <div className="text-sm space-y-1">
            <div>Client ID: {import.meta.env.VITE_DIMO_CLIENT_ID ? '✅ Set' : '❌ Missing'}</div>
            <div>Domain: {import.meta.env.VITE_DIMO_DOMAIN ? '✅ Set' : '❌ Missing'}</div>
            <div>API Key: {import.meta.env.VITE_DIMO_API_KEY ? '✅ Set' : '❌ Missing'}</div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Test Results</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span>Connection Test:</span>
              {testResults.connection === null && <Badge variant="secondary">Not Tested</Badge>}
              {testResults.connection === true && (
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Badge variant="default">Success</Badge>
                </div>
              )}
              {testResults.connection === false && (
                <div className="flex items-center space-x-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <Badge variant="destructive">Failed</Badge>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span>Attestation Test:</span>
              {testResults.attestation === null && <Badge variant="secondary">Not Tested</Badge>}
              {testResults.attestation === true && (
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Badge variant="default">Success</Badge>
                </div>
              )}
              {testResults.attestation === false && (
                <div className="flex items-center space-x-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <Badge variant="destructive">Failed</Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {testResults.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <h4 className="font-semibold text-red-800">Error:</h4>
            <p className="text-sm text-red-700">{testResults.error}</p>
          </div>
        )}

        <div className="flex space-x-2">
          <Button 
            onClick={testConnection} 
            disabled={isTesting}
            variant="outline"
          >
            {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Test Connection
          </Button>
          
          <Button 
            onClick={testAttestation} 
            disabled={isTesting || testResults.connection === false}
          >
            {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Test Attestation
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          <p>This will test the DIMO attestation service with a mock document.</p>
          <p>Check the browser console for detailed logs.</p>
        </div>
      </CardContent>
    </Card>
  );
};
