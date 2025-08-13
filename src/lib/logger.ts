// Simple logger utility with debug mode control
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

// Sanitize sensitive data for logging
const sanitizeData = (data: any): any => {
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
      'premium', 'totalCost', 'extractedText', 'challenge', 'state',
      'walletAddress', 'wallet_address', 'ethereum_address', 'address'
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
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    });
    
    return sanitized;
  }
  
  return data;
};

export const logger = {
  debug: (message: string, data?: any) => {
    if (DEBUG_MODE) {
      console.log(message, data ? sanitizeData(data) : '');
    }
  },
  
  info: (message: string, data?: any) => {
    console.log(message, data ? sanitizeData(data) : '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(message, data ? sanitizeData(data) : '');
  },
  
  error: (message: string, data?: any) => {
    console.error(message, data ? sanitizeData(data) : '');
  },
  
  success: (message: string) => {
    console.log('✅', message);
  },
  
  loading: (message: string) => {
    console.log('🔄', message);
  }
};
