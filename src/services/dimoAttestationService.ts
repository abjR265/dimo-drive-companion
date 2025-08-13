import { ethers } from 'ethers';
import { PrivacySettings, DEFAULT_PRIVACY_SETTINGS } from '@/types/privacy';

// Debug mode flag - set to false in production
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

// Utility function to sanitize sensitive data in logs
const sanitizeForLogging = (data: any, sensitiveFields: string[] = []): any => {
  if (typeof data === 'string') {
    // Hide API keys, private keys, VINs, and other sensitive strings
    if (data.includes('0x') && data.length > 40) {
      return data.substring(0, 10) + '...' + data.substring(data.length - 4);
    }
    if (data.length > 20) {
      return data.substring(0, 8) + '...' + data.substring(data.length - 4);
    }
    return data;
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    const fieldsToHide = [
      'apiKey', 'privateKey', 'signature', 'jwt', 'access_token', 'token',
      'vin', 'plateNumber', 'policyNumber', 'ownerName', 'ownerAddress',
      'premium', 'totalCost', 'extractedText', 'challenge', 'state'
    ];
    
    fieldsToHide.forEach(field => {
      if (sanitized[field]) {
        if (typeof sanitized[field] === 'string' && sanitized[field].length > 10) {
          sanitized[field] = sanitized[field].substring(0, 8) + '...';
        } else {
          sanitized[field] = '[HIDDEN]';
        }
      }
    });
    
    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeForLogging(sanitized[key], sensitiveFields);
      }
    });
    
    return sanitized;
  }
  
  return data;
};

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
      subject: `did:erc721:80002:${import.meta.env.VITE_DIMO_VEHICLE_CONTRACT_ADDRESS || '0x45fbCD3ef7361d156e8b16F5538AE36DEdf61Da8'}:${vehicleTokenId}`, // Vehicle DID
      time: new Date().toISOString(),
      type: "dimo.attestation",
      data: {
        subject: `did:erc721:80002:${import.meta.env.VITE_DIMO_VEHICLE_CONTRACT_ADDRESS || '0x45fbCD3ef7361d156e8b16F5538AE36DEdf61Da8'}:${vehicleTokenId}`,
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
      if (DEBUG_MODE) {
        console.log('Posting attestation via CORS proxy');
        console.log('Payload:', JSON.stringify(sanitizeForLogging(payload), null, 2));
      }
      
      // Use local proxy server to avoid CORS issues
      const response = await fetch('http://localhost:3003/api/dimo-attestation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload,
          jwt
        })
      });

      const responseText = await response.text();
      if (DEBUG_MODE) {
        console.log('Raw response from DIMO:', sanitizeForLogging(responseText));
      }
      
      if (!response.ok) {
        console.error('Attestation failed:', response.status, sanitizeForLogging(responseText));
        return false;
      }

      // Try to parse as JSON if there's content
      if (responseText.trim()) {
        try {
          const result = JSON.parse(responseText);
          if (DEBUG_MODE) {
            console.log('Attestation response:', sanitizeForLogging(result));
          }
        } catch (parseError) {
                      if (DEBUG_MODE) {
              console.log('Response is not JSON, treating as success:', sanitizeForLogging(responseText));
            }
        }
      } else {
        console.log('Empty response from DIMO, treating as success');
      }
      
      return true;
    } catch (error) {
      console.error('Error posting attestation:', error);
      return false;
    }
  }

  private async getJWT(): Promise<string> {
    // Use web3 authentication for DIMO as documented
    if (this.jwt && Date.now() < this.jwtExpiry) {
      console.log('Using cached JWT');
      return this.jwt;
    }

    console.log('Getting new JWT from DIMO using web3 authentication');
    
    try {
      // Step 1: Generate challenge
      console.log('Domain being used:', sanitizeForLogging(this.domain));
      const challengeUrl = `https://auth.dimo.zone/auth/web3/generate_challenge?client_id=${this.clientId}&domain=${this.domain}&scope=openid email&response_type=code&address=${this.clientId}`;
      console.log('Generating challenge from:', sanitizeForLogging(challengeUrl));
      
      const challengeResponse = await fetch(challengeUrl);
      
      if (!challengeResponse.ok) {
        const errorText = await challengeResponse.text();
        console.error('Challenge generation failed:', challengeResponse.status, errorText);
        throw new Error(`Failed to generate challenge: ${challengeResponse.statusText} - ${errorText}`);
      }
      
      const challengeData = await challengeResponse.json();
      console.log('Challenge generated successfully:', sanitizeForLogging(challengeData));
      
      // Step 2: Sign the challenge using the API key as a private key
      const signature = await this.signChallenge(challengeData.challenge);
      console.log('Challenge signed successfully');
      
      // Step 3: Submit challenge
      const submitResponse = await fetch('https://auth.dimo.zone/auth/web3/submit_challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          state: challengeData.state,
          grant_type: 'authorization_code',
          domain: this.domain,
          signature: signature
        })
      });
      
      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error('Challenge submission failed:', submitResponse.status, errorText);
        throw new Error(`Failed to submit challenge: ${submitResponse.statusText} - ${errorText}`);
      }
      
      const tokenData = await submitResponse.json();
      console.log('JWT obtained successfully using web3 authentication');
      
      this.jwt = tokenData.access_token;
      this.jwtExpiry = Date.now() + (tokenData.expires_in * 1000);
      
      return this.jwt;
    } catch (error) {
      console.error('Failed to get JWT:', error);
      throw new Error('Failed to authenticate with DIMO');
    }
  }

  private async signChallenge(challenge: string): Promise<string> {
    try {
      // Try using the API key directly as a private key
      // If it's already a valid hex string, use it as-is
      let privateKey = this.apiKey;
      
      // If it doesn't start with 0x, add it
      if (!privateKey.startsWith('0x')) {
        privateKey = '0x' + privateKey;
      }
      
      if (DEBUG_MODE) {
        console.log('Using API key as private key:', sanitizeForLogging(privateKey));
      }
      
      const wallet = new ethers.Wallet(privateKey);
      
      // Sign the challenge message
      const signature = await wallet.signMessage(challenge);
      console.log('Challenge signed successfully');
      return signature;
    } catch (error) {
      console.error('Failed to sign challenge:', error);
      throw new Error('Failed to sign challenge');
    }
  }

  private async signPayload(data: any): Promise<string> {
    try {
      // Sign the payload data using the API key as private key
      let privateKey = this.apiKey;
      
      // If it doesn't start with 0x, add it
      if (!privateKey.startsWith('0x')) {
        privateKey = '0x' + privateKey;
      }
      
      const wallet = new ethers.Wallet(privateKey);
      
      // Sign the JSON string directly (ethers will handle the hashing)
      const messageToSign = JSON.stringify(data);
      const signature = await wallet.signMessage(messageToSign);
      console.log('Payload signed successfully');
      return signature;
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
