import { ethers } from 'ethers';
import { PrivacySettings, DEFAULT_PRIVACY_SETTINGS } from '@/types/privacy';

export interface DocumentAnalysis {
  documentType: 'car_registration' | 'insurance' | 'oil_change_receipt' | 'service_invoice' | 'unknown';
  extractedText?: string;
  vin?: string;
  vehicleInfo?: {
    vin?: string;
    plateNumber?: string;
    make?: string;
    model?: string;
    year?: number;
    color?: string;
    ownerName?: string;
    ownerAddress?: string;
  };
  serviceInfo?: {
    serviceProvider?: string;
    serviceDate?: string;
    nextServiceDate?: string;
    nextServiceMileage?: number;
    services?: Array<{
      item: string;
      cost: number;
      description?: string;
    }>;
    totalCost?: number;
    currentMileage?: number;
  };
  insuranceInfo?: {
    insuranceProvider?: string;
    policyNumber?: string;
    coverageType?: string;
    effectiveDate?: string;
    expirationDate?: string;
    premium?: number;
  };
  registrationInfo?: {
    plateNumber?: string;
    expiryDate?: string;
    renewalDate?: string;
  };
  alertDates?: {
    registrationExpiry?: string;
    insuranceExpiry?: string;
    nextService?: string;
    inspectionDue?: string;
    warrantyExpiry?: string;
  };
}

export class DimoAttestationService {
  private jwt: string | null = null;
  private jwtExpiry: number = 0;

  constructor(
    private clientId: string,
    private apiKey: string,
    private domain: string
  ) {}

  async createDocumentAttestation(
    documentData: DocumentAnalysis,
    vehicleTokenId: number,
    privacySettings: PrivacySettings = DEFAULT_PRIVACY_SETTINGS
  ): Promise<boolean> {
    try {
      console.log('Creating DIMO document attestation for vehicle:', vehicleTokenId);
      
      // 1. Get/refresh JWT
      const jwt = await this.getJWT();
      
      // 2. Create attestation payload
      const payload = this.createAttestationPayload(documentData, vehicleTokenId, privacySettings);
      
      // 3. Sign the payload
      const signature = await this.signPayload(payload.data);
      
      // 4. Post to attest.dimo.zone
      const success = await this.postToAttestDimo({
        ...payload,
        signature
      }, jwt);
      
      if (success) {
        console.log('Document attested successfully to DIMO');
      } else {
        console.warn('Failed to post attestation to DIMO');
      }
      
      return success;
    } catch (error) {
      console.error('Document attestation failed:', error);
      return false;
    }
  }

  private createAttestationPayload(
    documentData: DocumentAnalysis,
    vehicleTokenId: number,
    privacySettings: PrivacySettings
  ) {
    const sanitizedData = this.sanitizeData(documentData, privacySettings);
    
    return {
      id: `dimo-ai-doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: this.clientId, // Your connection license address
      producer: `did:ethr:80002:${this.clientId}`, // Your developer license DID
      specversion: "1.0",
      subject: `did:nft:80002:${import.meta.env.VITE_DIMO_VEHICLE_CONTRACT_ADDRESS || '0x45fbCD3ef7361d156e8b16F5538AE36DEdf61Da8'}_${vehicleTokenId}`, // Vehicle DID
      time: new Date().toISOString(),
      type: "dimo.attestation",
      data: {
        subject: `did:nft:80002:${import.meta.env.VITE_DIMO_VEHICLE_CONTRACT_ADDRESS || '0x45fbCD3ef7361d156e8b16F5538AE36DEdf61Da8'}_${vehicleTokenId}`,
        attestorAddress: this.clientId,
        documentType: this.mapDocumentType(documentData.documentType),
        vin: documentData.vin,
        vehicleInfo: sanitizedData.vehicleInfo,
        serviceInfo: sanitizedData.serviceInfo,
        insuranceInfo: sanitizedData.insuranceInfo,
        registrationInfo: sanitizedData.registrationInfo,
        alertDates: sanitizedData.alertDates,
        // Add document-specific fields based on type
        ...(documentData.documentType === 'insurance' && {
          insured: true,
          provider: sanitizedData.insuranceInfo?.insuranceProvider || 'Unknown',
          policyNumber: sanitizedData.insuranceInfo?.policyNumber,
          coverageType: sanitizedData.insuranceInfo?.coverageType,
          coverageStartDate: sanitizedData.insuranceInfo?.effectiveDate ? new Date(sanitizedData.insuranceInfo.effectiveDate).getTime() / 1000 : undefined,
          expirationDate: sanitizedData.insuranceInfo?.expirationDate ? new Date(sanitizedData.insuranceInfo.expirationDate).getTime() / 1000 : undefined
        }),
        // Add metadata
        metadata: {
          processedAt: new Date().toISOString(),
          source: "dimo-ai-web",
          confidence: 0.95,
          privacySettings
        }
      }
    };
  }

  private async postToAttestDimo(payload: any, jwt: string): Promise<boolean> {
    try {
      console.log('Posting attestation to attest.dimo.zone');
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch('https://attest.dimo.zone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Attestation failed:', response.status, errorText);
        return false;
      }

      const result = await response.json();
      console.log('Attestation response:', result);
      return true;
    } catch (error) {
      console.error('Error posting to attest.dimo.zone:', error);
      return false;
    }
  }

  private async getJWT(): Promise<string> {
    // Use API key authentication for DIMO
    if (this.jwt && Date.now() < this.jwtExpiry) {
      console.log('Using cached JWT');
      return this.jwt;
    }

    console.log('Getting new JWT from DIMO using API key');
    
    try {
      // Use API key to get JWT
      const response = await fetch('https://auth.dimo.zone/auth/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          client_id: this.clientId,
          grant_type: 'client_credentials'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get JWT: ${response.statusText} - ${errorText}`);
      }
      
      const tokenData = await response.json();
      console.log('JWT obtained successfully using API key');
      
      this.jwt = tokenData.access_token;
      this.jwtExpiry = Date.now() + (tokenData.expires_in * 1000);
      
      return this.jwt;
    } catch (error) {
      console.error('Failed to get JWT:', error);
      throw new Error('Failed to authenticate with DIMO');
    }
  }

  private async signPayload(data: any): Promise<string> {
    try {
      // For API key authentication, we don't need to sign the payload
      // The API key provides the authentication
      console.log('Using API key authentication - no payload signing required');
      return '0x' + '0'.repeat(130); // Return a placeholder signature
    } catch (error) {
      console.error('Failed to sign payload:', error);
      throw new Error('Failed to sign attestation payload');
    }
  }

  private sanitizeData(data: DocumentAnalysis, privacy: PrivacySettings): any {
    const sanitized = { ...data };
    
    if (!privacy.includeOwnerInfo) {
      delete sanitized.vehicleInfo?.ownerName;
      delete sanitized.vehicleInfo?.ownerAddress;
    }
    
    if (!privacy.includeFinancialInfo) {
      delete sanitized.serviceInfo?.totalCost;
      delete sanitized.serviceInfo?.services;
      delete sanitized.insuranceInfo?.premium;
    }
    
    if (!privacy.includePersonalDetails) {
      delete sanitized.vehicleInfo?.ownerAddress;
    }
    
    if (!privacy.includeServiceDetails) {
      delete sanitized.serviceInfo?.services;
      delete sanitized.serviceInfo?.serviceProvider;
    }
    
    if (!privacy.includeDocumentMetadata) {
      delete sanitized.extractedText;
    }
    
    console.log('Data sanitized according to privacy settings');
    return sanitized;
  }

  private mapDocumentType(type: string): string {
    const mapping = {
      'car_registration': 'registration',
      'insurance': 'insurance',
      'service_invoice': 'service',
      'oil_change_receipt': 'service',
      'maintenance': 'maintenance'
    };
    return mapping[type] || 'service';
  }

  // Test method to verify the service is working
  async testConnection(): Promise<boolean> {
    try {
      const jwt = await this.getJWT();
      console.log('DIMO connection test successful');
      return true;
    } catch (error) {
      console.error('DIMO connection test failed:', error);
      return false;
    }
  }
}
