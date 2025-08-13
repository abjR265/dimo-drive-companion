import { dimoMcpClient } from './dimoMcpClient';

interface DocumentAnalysis {
  documentType: 'car_registration' | 'oil_change_receipt' | 'service_invoice' | 'unknown';
  extractedText?: string;
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
}

export class McpDocumentProcessor {
  async processDocument(file: File): Promise<DocumentAnalysis> {
    try {
      // Convert file to base64
      const base64Image = await this.fileToBase64(file);
      
      // Use MCP DIMO server to analyze the document
      const analysis = await this.analyzeWithMcp(base64Image, file.name);
      
      return analysis;
    } catch (error) {
      console.error('Error processing document with MCP:', error);
      throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async analyzeWithMcp(base64Image: string, filename: string): Promise<DocumentAnalysis> {
    try {
      // For now, we'll use a fallback approach since the MCP server doesn't have document analysis
      // In a production environment, you'd want to implement proper document analysis
      console.log('MCP document analysis not implemented, using fallback');
      return this.fallbackAnalysis(filename);
    } catch (error) {
      console.error('MCP analysis failed:', error);
      // Fallback to basic text analysis
      return this.fallbackAnalysis(filename);
    }
  }

  private fallbackAnalysis(filename: string): DocumentAnalysis {
    // Basic fallback analysis based on filename
    if (filename.toLowerCase().includes('registration')) {
      return {
        documentType: 'car_registration',
        vehicleInfo: {},
        extractedText: 'Document analysis pending...'
      };
    } else if (filename.toLowerCase().includes('receipt') || filename.toLowerCase().includes('service')) {
      return {
        documentType: 'oil_change_receipt',
        serviceInfo: {
          services: []
        },
        extractedText: 'Document analysis pending...'
      };
    } else {
      return {
        documentType: 'unknown',
        extractedText: 'Document analysis pending...'
      };
    }
  }

  // Alternative: Use external OCR service directly (without MCP)
  async processWithExternalOcr(file: File): Promise<DocumentAnalysis> {
    try {
      const base64Image = await this.fileToBase64(file);
      
      // Use OCR.space API directly for PDF processing
      const ocrApiKey = import.meta.env.VITE_OCR_API_KEY || '';
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `apikey=${ocrApiKey}&base64Image=${encodeURIComponent(base64Image)}&language=eng&isOverlayRequired=false&filetype=${file.type === 'application/pdf' ? 'PDF' : 'JPG'}&detectOrientation=false&scale=true&OCREngine=2`
      });

      if (response.ok) {
        const ocrResult = await response.json();
        if (ocrResult.ParsedResults && ocrResult.ParsedResults.length > 0) {
          const extractedText = ocrResult.ParsedResults[0].ParsedText;
          return this.parseExtractedText(extractedText);
        }
      }
      
      throw new Error('OCR processing failed');
    } catch (error) {
      console.error('External OCR failed:', error);
      return this.fallbackAnalysis(file.name);
    }
  }

  // PDF-specific processing
  async processPdfDocument(file: File): Promise<DocumentAnalysis> {
    try {
      const base64Pdf = await this.fileToBase64(file);
      
      // Use OCR.space API for PDF processing
      const ocrApiKey = import.meta.env.VITE_OCR_API_KEY || '';
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `apikey=${ocrApiKey}&base64Image=${encodeURIComponent(base64Pdf)}&language=eng&isOverlayRequired=false&filetype=PDF&detectOrientation=false&scale=true&OCREngine=2`
      });

      if (response.ok) {
        const ocrResult = await response.json();
        if (ocrResult.ParsedResults && ocrResult.ParsedResults.length > 0) {
          const extractedText = ocrResult.ParsedResults[0].ParsedText;
          return this.parseExtractedText(extractedText);
        }
      }
      
      throw new Error('PDF OCR processing failed');
    } catch (error) {
      console.error('PDF processing failed:', error);
      return this.fallbackAnalysis(file.name);
    }
  }

  private parseExtractedText(text: string): DocumentAnalysis {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Check for registration document patterns
    if (text.toLowerCase().includes('registration') || text.toLowerCase().includes('vehicle identification')) {
      return this.extractRegistrationFromText(lines);
    }
    
    // Check for service receipt patterns
    if (text.toLowerCase().includes('oil change') || text.toLowerCase().includes('service')) {
      return this.extractServiceFromText(lines);
    }
    
    return {
      documentType: 'unknown',
      extractedText: text.substring(0, 500) + '...'
    };
  }

  private extractRegistrationFromText(lines: string[]): DocumentAnalysis {
    const data: DocumentAnalysis = {
      documentType: 'car_registration',
      vehicleInfo: {},
      extractedText: lines.join('\n')
    };

    for (const line of lines) {
      // Extract VIN (17 characters)
      const vinMatch = line.match(/[A-Z0-9]{17}/);
      if (vinMatch) data.vehicleInfo!.vin = vinMatch[0];
      
      // Extract plate number
      const plateMatch = line.match(/[A-Z0-9]{2,8}/);
      if (plateMatch) data.vehicleInfo!.plateNumber = plateMatch[0];
      
      // Extract year
      const yearMatch = line.match(/(19|20)\d{2}/);
      if (yearMatch) data.vehicleInfo!.year = parseInt(yearMatch[0]);
      
      // Extract make/model
      if (line.includes('DODGE') || line.includes('FORD') || line.includes('TOYOTA')) {
        const makeMatch = line.match(/(DODGE|FORD|TOYOTA|HONDA|CHEVROLET|NISSAN)/);
        if (makeMatch) data.vehicleInfo!.make = makeMatch[1];
      }
    }

    return data;
  }

  private extractServiceFromText(lines: string[]): DocumentAnalysis {
    const data: DocumentAnalysis = {
      documentType: 'oil_change_receipt',
      serviceInfo: {
        services: []
      },
      extractedText: lines.join('\n')
    };

    for (const line of lines) {
      // Extract costs
      const costMatch = line.match(/\$(\d+(?:\.\d{2})?)/);
      if (costMatch) {
        data.serviceInfo!.totalCost = parseFloat(costMatch[1]);
      }
      
      // Extract service provider
      if (line.includes('MAGIC') || line.includes('LUBE')) {
        data.serviceInfo!.serviceProvider = line.trim();
      }
    }

    return data;
  }
} 