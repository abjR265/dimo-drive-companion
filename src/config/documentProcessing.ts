// Document Processing Configuration
export const DOCUMENT_PROCESSING_CONFIG = {
  // Choose your preferred document processing method:
  // 'openai' - Uses OpenAI Vision API (requires OpenAI API key)
  // 'mcp' - Uses DIMO MCP server (requires MCP server running)
  // 'ocr' - Uses external OCR service via MCP (free tier available)
  // 'fallback' - Basic text parsing only
  method: 'openai' as 'openai' | 'mcp' | 'ocr' | 'fallback',
  
  // OpenAI Configuration
  openai: {
    model: 'gpt-4o',
    maxTokens: 1000,
    temperature: 0.1
  },
  
  // MCP Configuration
  mcp: {
    serverUrl: import.meta.env.VITE_DIMO_MCP_SERVER_URL || 'http://localhost:3001',
    timeout: 30000 // 30 seconds
  },
  
  // External OCR Configuration
  ocr: {
    service: 'ocr.space', // Free OCR service
    apiKey: import.meta.env.VITE_OCR_API_KEY || '', // From environment
    language: 'eng',
    engine: 2 // OCR Engine 2 for better accuracy
  },
  
  // File processing settings
  fileProcessing: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    imageQuality: 0.8, // For image compression before processing
    maxImageDimension: 2048 // Max width/height for image processing
  }
};

// Helper function to get the appropriate processor
export function getDocumentProcessor() {
  switch (DOCUMENT_PROCESSING_CONFIG.method) {
    case 'openai':
      return import('@/services/documentProcessor').then(m => new m.DocumentProcessor());
    case 'mcp':
      return import('@/services/mcpDocumentProcessor').then(m => new m.McpDocumentProcessor());
    case 'ocr':
      return import('@/services/mcpDocumentProcessor').then(m => new m.McpDocumentProcessor());
    case 'fallback':
      return import('@/services/documentProcessor').then(m => new m.DocumentProcessor());
    default:
      return import('@/services/documentProcessor').then(m => new m.DocumentProcessor());
  }
}

// Helper function to check if processing method is available
export function isProcessingMethodAvailable(method: string): boolean {
  switch (method) {
    case 'openai':
      return !!(import.meta.env.VITE_OPENAI_API_KEY && import.meta.env.VITE_OPENAI_ORG_ID);
    case 'mcp':
      return !!(import.meta.env.VITE_DIMO_MCP_SERVER_URL);
    case 'ocr':
      return !!(import.meta.env.VITE_DIMO_MCP_SERVER_URL);
    case 'fallback':
      return true;
    default:
      return false;
  }
}

// Auto-select the best available processing method
export function getBestAvailableProcessor() {
  const methods = ['openai', 'mcp', 'ocr', 'fallback'] as const;
  
  for (const method of methods) {
    if (isProcessingMethodAvailable(method)) {
      DOCUMENT_PROCESSING_CONFIG.method = method;
      return getDocumentProcessor();
    }
  }
  
  // Fallback to basic text processing
  DOCUMENT_PROCESSING_CONFIG.method = 'fallback';
  return getDocumentProcessor();
} 