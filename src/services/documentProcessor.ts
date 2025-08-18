import { db } from '@/lib/supabase';

interface DocumentAnalysis {
  documentType: 'car_registration' | 'insurance' | 'oil_change_receipt' | 'service_invoice' | 'unknown';
  extractedText?: string;
  vin?: string; // Primary identifier for vehicle matching
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

export class DocumentProcessor {
  private openaiApiKey: string;
  private openaiOrgId: string;

  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.openaiOrgId = import.meta.env.VITE_OPENAI_ORG_ID;
  }

  async processDocument(file: File): Promise<DocumentAnalysis> {
    console.log('Processing document:', file.name, 'Type:', file.type);
    
    try {
      if (file.type === 'application/pdf') {
        console.log('Processing PDF file');
        // For PDFs, try OCR first, then fallback to OpenAI Vision
        try {
          const textContent = await this.extractTextFromPdf(file);
          console.log('PDF text extracted via OCR, processing with OpenAI');
          return await this.analyzeWithOpenAI(textContent);
        } catch (ocrError) {
          console.warn('OCR failed for PDF, using OpenAI Vision directly:', ocrError);
          return await this.analyzeWithOpenAIVision(file);
        }
      } else if (file.type.startsWith('image/')) {
        console.log('Processing image file with OpenAI Vision');
        // For images, use OpenAI Vision directly
        return await this.analyzeWithOpenAIVision(file);
      } else {
        console.log('Processing text file');
        // For text files, read and process directly
        const textContent = await this.readFileAsText(file);
        return await this.analyzeWithOpenAI(textContent);
      }
    } catch (error) {
      console.error('Document processing failed:', error);
      return this.fallbackAnalysis(file);
    }
  }

  private async analyzeWithOpenAIVision(file: File): Promise<DocumentAnalysis> {
    console.log('Using OpenAI Vision API for document analysis:', file.name);
    
    const base64Image = await this.fileToBase64(file);
    
    const prompt = `
Analyze this vehicle document text and extract ALL relevant information.

CRITICAL: Look for a 17-character Vehicle Identification Number (VIN) - this is the MOST IMPORTANT field.
VIN format: 17 characters, alphanumeric (A-Z, 0-9), no spaces or special characters.

Document types to handle:
- Car Registration: Look for VIN, owner info, vehicle details, registration info, EXPIRY DATE
- Insurance: Look for VIN, policy info, vehicle details, insurance provider, EXPIRY DATE
- Oil Change/Service Receipt: Look for VIN, service details, vehicle info, service provider, NEXT SERVICE DATE

IMPORTANT: Look carefully through ALL the text for the VIN. Common VIN patterns:
- 17 characters: A-Z, 0-9 (no I, O, Q)
- Often appears as "VIN:", "Vehicle ID:", "Identification Number:"
- May be in format: XXXX-XXXX-XXXX-XXXX or XXXXXXXXXXXXXXX

CRITICAL: Extract ALL expiry dates for future alerts:
- Registration expiry dates
- Insurance expiry dates  
- Service due dates
- Inspection due dates
- Warranty expiry dates

IMPORTANT: Do not use any emojis or bold formatting (**) in your responses. Provide clean, professional text only.

Extract the following information and return ONLY a valid JSON object (no markdown, no extra text):

{
  "vin": "EXACT_17_CHARACTER_VIN_FROM_DOCUMENT",
  "documentType": "registration|insurance|service|unknown",
  "vehicleInfo": {
    "make": "vehicle make (e.g., Toyota, Ford, Mercedes)",
    "model": "vehicle model (e.g., Camry, F-150, C-Class)",
    "year": 2024,
    "color": "vehicle color if mentioned"
  },
  "ownerInfo": {
    "name": "owner name if found",
    "address": "address if found"
  },
  "registrationInfo": {
    "plateNumber": "license plate number if found",
    "expiryDate": "registration expiry date (YYYY-MM-DD format)",
    "renewalDate": "renewal due date if mentioned"
  },
  "insuranceInfo": {
    "policyNumber": "policy number if insurance document",
    "provider": "insurance company name",
    "coverageType": "type of coverage",
    "effectiveDate": "policy start date (YYYY-MM-DD)",
    "expiryDate": "insurance expiry date (YYYY-MM-DD format)",
    "premium": "premium amount if mentioned"
  },
  "serviceInfo": {
    "serviceType": "type of service if service receipt",
    "serviceDate": "service performed date (YYYY-MM-DD)",
    "nextServiceDate": "next service due date (YYYY-MM-DD format)",
    "mileage": "current mileage at service",
    "nextServiceMileage": "mileage for next service",
    "serviceProvider": "service center name",
    "totalCost": "service cost if mentioned"
  },
  "alertDates": {
    "registrationExpiry": "registration expiry date for alerts",
    "insuranceExpiry": "insurance expiry date for alerts", 
    "nextService": "next service due date for alerts",
    "inspectionDue": "inspection due date if mentioned",
    "warrantyExpiry": "warranty expiry date if mentioned"
  }
}

IMPORTANT RULES:
1. Extract the ACTUAL VIN from the document - do NOT use placeholders
2. If no VIN found, set "vin" to null
3. Return ONLY valid JSON - no markdown formatting
4. If a field is not found, use null or empty string
5. VIN must be exactly 17 characters if found
6. Search through ALL text content carefully for the VIN
7. Look for document type indicators like "Registration", "Insurance", "Service", "Receipt"
8. If you see "Temporary Certificate of Registration" or "MV-53P", documentType should be "registration"
9. Extract ALL dates in YYYY-MM-DD format for future alerts
10. Look for expiry dates, due dates, renewal dates, and next service dates
11. Populate alertDates section with all relevant dates for proactive notifications
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${file.type};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI Vision API failed: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content || '';
    
    return this.parseOpenAIResponse(content);
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async processPdfDocument(file: File): Promise<DocumentAnalysis> {
    try {
      // For PDFs, we'll use text extraction as a fallback
      // In a production environment, you'd want to use a proper PDF-to-image service
      const text = await this.extractTextFromPdf(file);
      return this.parseTextContent(text, file.name);
    } catch (error) {
      console.error('PDF processing failed, using fallback:', error);
      return this.fallbackAnalysis(file);
    }
  }

  private async extractTextFromPdf(file: File): Promise<string> {
    try {
      console.log('Extracting text from PDF using OCR.space API:', file.name);
      
      // Use OCR.space API for PDF text extraction
      const formData = new FormData();
      formData.append('file', file);
      const ocrApiKey = import.meta.env.VITE_OCR_API_KEY || '';
      formData.append('apikey', ocrApiKey);
      formData.append('filetype', 'PDF');
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('OCREngine', '2');

      // Add timeout to prevent infinite waiting
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OCR API failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.IsErroredOnProcessing) {
        throw new Error(`OCR processing error: ${result.ErrorMessage}`);
      }

      const extractedText = result.ParsedResults?.[0]?.ParsedText || '';
      
      if (!extractedText.trim()) {
        throw new Error('OCR returned empty text');
      }

      console.log('Extracted text from PDF:', extractedText.substring(0, 200) + '...');
      
      return extractedText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      
      // Fallback: Return a basic template for AI to work with
      return `PDF Document: ${file.name}
      
This appears to be a vehicle registration or insurance document.
Please analyze the document content to extract:
- Vehicle Identification Number (VIN)
- Vehicle make, model, year
- Owner information
- Registration or insurance details

Note: OCR text extraction failed, but AI can still attempt to analyze the document structure.`;
    }
  }

  private async analyzeWithOpenAI(text: string): Promise<DocumentAnalysis> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `
Analyze this vehicle document text and extract ALL relevant information.

CRITICAL: Look for a 17-character Vehicle Identification Number (VIN) - this is the MOST IMPORTANT field.
VIN format: 17 characters, alphanumeric (A-Z, 0-9), no spaces or special characters.

Document types to handle:
- Car Registration: Look for VIN, owner info, vehicle details, registration info, EXPIRY DATE
- Insurance: Look for VIN, policy info, vehicle details, insurance provider, EXPIRY DATE
- Oil Change/Service Receipt: Look for VIN, service details, vehicle info, service provider, NEXT SERVICE DATE

IMPORTANT: Look carefully through ALL the text for the VIN. Common VIN patterns:
- 17 characters: A-Z, 0-9 (no I, O, Q)
- Often appears as "VIN:", "Vehicle ID:", "Identification Number:"
- May be in format: XXXX-XXXX-XXXX-XXXX or XXXXXXXXXXXXXXX

CRITICAL: Extract ALL expiry dates for future alerts:
- Registration expiry dates
- Insurance expiry dates  
- Service due dates
- Inspection due dates
- Warranty expiry dates

IMPORTANT: Do not use any emojis or bold formatting (**) in your responses. Provide clean, professional text only.

Extract the following information and return ONLY a valid JSON object (no markdown, no extra text):

{
  "vin": "EXACT_17_CHARACTER_VIN_FROM_DOCUMENT",
  "documentType": "registration|insurance|service|unknown",
  "vehicleInfo": {
    "make": "vehicle make (e.g., Toyota, Ford, Mercedes)",
    "model": "vehicle model (e.g., Camry, F-150, C-Class)",
    "year": 2024,
    "color": "vehicle color if mentioned"
  },
  "ownerInfo": {
    "name": "owner name if found",
    "address": "address if found"
  },
  "registrationInfo": {
    "plateNumber": "license plate number if found",
    "expiryDate": "registration expiry date (YYYY-MM-DD format)",
    "renewalDate": "renewal due date if mentioned"
  },
  "insuranceInfo": {
    "policyNumber": "policy number if insurance document",
    "provider": "insurance company name",
    "coverageType": "type of coverage",
    "effectiveDate": "policy start date (YYYY-MM-DD)",
    "expiryDate": "insurance expiry date (YYYY-MM-DD format)",
    "premium": "premium amount if mentioned"
  },
  "serviceInfo": {
    "serviceType": "type of service if service receipt",
    "serviceDate": "service performed date (YYYY-MM-DD)",
    "nextServiceDate": "next service due date (YYYY-MM-DD format)",
    "mileage": "current mileage at service",
    "nextServiceMileage": "mileage for next service",
    "serviceProvider": "service center name",
    "totalCost": "service cost if mentioned"
  },
  "alertDates": {
    "registrationExpiry": "registration expiry date for alerts",
    "insuranceExpiry": "insurance expiry date for alerts", 
    "nextService": "next service due date for alerts",
    "inspectionDue": "inspection due date if mentioned",
    "warrantyExpiry": "warranty expiry date if mentioned"
  }
}

IMPORTANT RULES:
1. Extract the ACTUAL VIN from the document - do NOT use placeholders
2. If no VIN found, set "vin" to null
3. Return ONLY valid JSON - no markdown formatting
4. If a field is not found, use null or empty string
5. VIN must be exactly 17 characters if found
6. Search through ALL text content carefully for the VIN
7. Look for document type indicators like "Registration", "Insurance", "Service", "Receipt"
8. If you see "Temporary Certificate of Registration" or "MV-53P", documentType should be "registration"
9. Extract ALL dates in YYYY-MM-DD format for future alerts
10. Look for expiry dates, due dates, renewal dates, and next service dates
11. Populate alertDates section with all relevant dates for proactive notifications
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'OpenAI-Organization': this.openaiOrgId
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `Document text to analyze:\n\n${text}\n\n${prompt}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('OpenAI response content:', content);
    
    try {
      // Try to parse the JSON directly
      return JSON.parse(content);
    } catch (parseError) {
      console.log('Direct JSON parse failed, trying markdown extraction...');
      
      // Try to extract JSON from markdown code blocks (with or without language specifier)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const extractedJson = jsonMatch[1].trim();
          console.log('Extracted JSON from markdown:', extractedJson);
          return JSON.parse(extractedJson);
        } catch (secondParseError) {
          console.error('Failed to parse JSON from markdown block:', jsonMatch[1]);
        }
      }
      
      // Try to extract JSON from the content (remove any extra text)
      const cleanContent = content.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
      try {
        return JSON.parse(cleanContent);
      } catch (thirdParseError) {
        console.error('Failed to parse cleaned content:', cleanContent);
      }
      
      // Fallback: return a basic structure with the raw content
      console.warn('All JSON parsing attempts failed, using fallback');
      return {
        documentType: 'unknown',
        extractedText: content.substring(0, 500) + '...',
        vehicleInfo: {},
        serviceInfo: {}
      };
    }
  }

  // Fallback method for text-based documents
  async processTextDocument(file: File): Promise<DocumentAnalysis> {
    const text = await this.readFileAsText(file);
    return this.parseTextContent(text, file.name);
  }

  private async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  private parseTextContent(text: string, filename: string): DocumentAnalysis {
    const lowerText = text.toLowerCase();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Basic parsing logic (fallback)
    if (lowerText.includes('registration') || lowerText.includes('vehicle identification')) {
      return this.extractRegistrationData(lines);
    }
    
    if (lowerText.includes('oil change') || lowerText.includes('service')) {
      return this.extractServiceData(lines);
    }
    
    return {
      documentType: 'unknown',
      extractedText: text.substring(0, 500) + '...'
    };
  }

  private extractRegistrationData(lines: string[]): DocumentAnalysis {
    const data: DocumentAnalysis = {
      documentType: 'car_registration',
      vehicleInfo: {},
      extractedText: lines.join('\n')
    };

    for (const line of lines) {
      // Extract VIN
      const vinMatch = line.match(/[A-Z0-9]{17}/);
      if (vinMatch) data.vin = vinMatch[0];
      
      // Extract plate number
      const plateMatch = line.match(/[A-Z0-9]{2,8}/);
      if (plateMatch) data.vehicleInfo!.plateNumber = plateMatch[0];
      
      // Extract year
      const yearMatch = line.match(/(19|20)\d{2}/);
      if (yearMatch) data.vehicleInfo!.year = parseInt(yearMatch[0]);
    }

    return data;
  }

  private extractServiceData(lines: string[]): DocumentAnalysis {
    const data: DocumentAnalysis = {
      documentType: 'oil_change_receipt',
      serviceInfo: {
        services: []
      },
      extractedText: lines.join('\n')
    };

    for (const line of lines) {
      // Extract service provider
      if (line.includes('MAGIC') || line.includes('LUBE')) {
        data.serviceInfo!.serviceProvider = line.trim();
      }
      
      // Extract costs
      const costMatch = line.match(/\$(\d+(?:\.\d{2})?)/);
      if (costMatch) {
        data.serviceInfo!.totalCost = parseFloat(costMatch[1]);
      }
    }

    return data;
  }

  private fallbackAnalysis(file: File): DocumentAnalysis {
    console.warn(`Fallback analysis for file: ${file.name}`);
    return {
      documentType: 'unknown',
      extractedText: `Fallback analysis for ${file.name}`,
      vehicleInfo: {},
      serviceInfo: {}
    };
  }

  private parseOpenAIResponse(content: string): DocumentAnalysis {
    
    try {
      // First try: direct JSON parse
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response directly:', content);
      
      // Second try: extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          console.log('Found JSON in markdown block:', jsonMatch[1]);
          return JSON.parse(jsonMatch[1]);
        } catch (secondParseError) {
          console.error('Failed to parse JSON from markdown:', jsonMatch[1]);
        }
      }
      
      // Third try: find JSON object in the content
      const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        try {
          console.log('Found JSON object in content:', jsonObjectMatch[0]);
          return JSON.parse(jsonObjectMatch[0]);
        } catch (thirdParseError) {
          console.error('Failed to parse JSON object:', jsonObjectMatch[0]);
        }
      }
      
      // Fourth try: clean the content and try again
      const cleanContent = content
        .replace(/^[^{]*/, '') // Remove everything before first {
        .replace(/[^}]*$/, '') // Remove everything after last }
        .trim();
      
      if (cleanContent.startsWith('{') && cleanContent.endsWith('}')) {
        try {
          console.log('Trying cleaned content:', cleanContent);
          return JSON.parse(cleanContent);
        } catch (fourthParseError) {
          console.error('Failed to parse cleaned content:', cleanContent);
        }
      }
      
      // Fifth try: look for specific fields and build response
      console.log('Attempting to extract fields from text content');
      const extractedData: DocumentAnalysis = {
        documentType: 'unknown',
        extractedText: content.substring(0, 500) + '...',
        vehicleInfo: {},
        serviceInfo: {}
      };
      
      // Try to extract VIN
      const vinMatch = content.match(/"vin":\s*"([A-Z0-9]{17})"/);
      if (vinMatch) {
        extractedData.vin = vinMatch[1];
        console.log('Extracted VIN:', extractedData.vin);
      }
      
      // Try to extract document type
      const docTypeMatch = content.match(/"documentType":\s*"([^"]+)"/);
      if (docTypeMatch) {
        extractedData.documentType = docTypeMatch[1] as any;
        console.log('Extracted document type:', extractedData.documentType);
      }
      
      // Try to extract vehicle info
      const makeMatch = content.match(/"make":\s*"([^"]+)"/);
      if (makeMatch) {
        extractedData.vehicleInfo = { ...extractedData.vehicleInfo, make: makeMatch[1] };
      }
      
      const yearMatch = content.match(/"year":\s*(\d{4})/);
      if (yearMatch) {
        extractedData.vehicleInfo = { ...extractedData.vehicleInfo, year: parseInt(yearMatch[1]) };
      }
      
      const colorMatch = content.match(/"color":\s*"([^"]+)"/);
      if (colorMatch) {
        extractedData.vehicleInfo = { ...extractedData.vehicleInfo, color: colorMatch[1] };
      }
      
      // Try to extract alert dates
      const alertDatesMatch = content.match(/"alertDates":\s*\{([^}]+)\}/);
      if (alertDatesMatch) {
        const alertDatesText = alertDatesMatch[1];
        const registrationExpiryMatch = alertDatesText.match(/"registrationExpiry":\s*"([^"]+)"/);
        if (registrationExpiryMatch) {
          extractedData.alertDates = { registrationExpiry: registrationExpiryMatch[1] };
        }
      }
      
      console.log('Extracted data from text:', extractedData);
      return extractedData;
    }
  }
} 