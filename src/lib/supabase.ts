import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          dimo_token_id: number;
          created_at: string;
          last_login: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          dimo_token_id: number;
          created_at?: string;
          last_login?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          dimo_token_id?: number;
          created_at?: string;
          last_login?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          user_id: string;
          token_id: number;
          vin?: string; // Vehicle Identification Number
          name: string;
          make: string;
          model: string;
          year: number;
          type: 'electric' | 'hybrid' | 'gas';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token_id: number;
          vin?: string;
          name: string;
          make: string;
          model: string;
          year: number;
          type: 'electric' | 'hybrid' | 'gas';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token_id?: number;
          vin?: string;
          name?: string;
          make?: string;
          model?: string;
          year?: number;
          type?: 'electric' | 'hybrid' | 'gas';
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          vehicle_id: string;
          messages: string; // JSON string
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          messages: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          messages?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      maintenance_records: {
        Row: {
          id: string;
          vehicle_id: string;
          type: 'scheduled' | 'repair' | 'inspection';
          description: string;
          cost: number;
          date: string;
          mileage: number;
          next_due?: string;
          next_due_mileage?: number;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          type: 'scheduled' | 'repair' | 'inspection';
          description: string;
          cost: number;
          date: string;
          mileage: number;
          next_due?: string;
          next_due_mileage?: number;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          type?: 'scheduled' | 'repair' | 'inspection';
          description?: string;
          cost?: number;
          date?: string;
          mileage?: number;
          next_due?: string;
          next_due_mileage?: number;
        };
      };
      documents: {
        Row: {
          id: string;
          vehicle_id: string;
          token_id: number; // Add token_id field
          type: 'registration' | 'insurance' | 'receipt' | 'manual' | 'warranty' | 'maintenance';
          filename: string;
          original_name: string;
          size: number;
          uploaded_at: string;
          processed_data?: string; // JSON string
          storage_path?: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          token_id: number; // Add token_id field
          type: 'registration' | 'insurance' | 'receipt' | 'manual' | 'warranty' | 'maintenance';
          filename: string;
          original_name: string;
          size: number;
          uploaded_at?: string;
          processed_data?: string;
          storage_path?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          token_id?: number; // Add token_id field
          type?: 'registration' | 'insurance' | 'receipt' | 'manual' | 'warranty' | 'maintenance';
          filename?: string;
          original_name?: string;
          size?: number;
          uploaded_at?: string;
          processed_data?: string;
          storage_path?: string;
        };
      };
    };
  };
}

// Helper functions for database operations
export const db = {
  // User operations
  async createUser(user: { walletAddress: string; dimoTokenId: number }) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        wallet_address: user.walletAddress,
        dimo_token_id: user.dimoTokenId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserByWallet(walletAddress: string) {
    console.log('🔍 getUserByWallet called with walletAddress:', walletAddress);
    
    // Try using .maybeSingle() instead of .single() to avoid PGRST116
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    console.log('🔍 Supabase response - data:', data, 'error:', error);

    if (error) {
      console.error('🔍 Database error:', error);
      throw error;
    }
    
    if (!data) {
      console.log('🔍 No user found, returning null');
      return null;
    }
    
    console.log('🔍 User found:', data);
    return data;
  },

  // Vehicle operations
  async createVehicle(vehicle: {
    userId: string;
    tokenId: number;
    vin?: string;
    name: string;
    make: string;
    model: string;
    year: number;
    type: 'electric' | 'hybrid' | 'gas';
  }) {
    console.log('Creating vehicle in database:', vehicle);
    
    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        user_id: vehicle.userId,
        token_id: vehicle.tokenId,
        vin: vehicle.vin || null,
        name: vehicle.name,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        type: vehicle.type,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating vehicle:', error);
      throw error;
    }
    
    console.log('Vehicle created successfully:', data);
    return data;
  },

  async getVehiclesByUserId(userId: string) {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  async getVehicleByVin(vin: string) {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('vin', vin)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }
    return data;
  },

  // Conversation operations
  async saveConversation(conversation: {
    vehicleId: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  }) {
    const { data, error } = await supabase
      .from('conversations')
      .upsert({
        vehicle_id: conversation.vehicleId,
        messages: JSON.stringify(conversation.messages),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getConversation(vehicleId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? { ...data, messages: JSON.parse(data.messages) } : null;
  },

  // Maintenance operations
  async createMaintenanceRecord(record: {
    vehicleId: string;
    type: 'scheduled' | 'repair' | 'inspection';
    description: string;
    cost: number;
    date: Date;
    mileage: number;
    nextDue?: Date;
    nextDueMileage?: number;
  }) {
    const { data, error } = await supabase
      .from('maintenance_records')
      .insert({
        vehicle_id: record.vehicleId,
        type: record.type,
        description: record.description,
        cost: record.cost,
        date: record.date.toISOString(),
        mileage: record.mileage,
        next_due: record.nextDue?.toISOString(),
        next_due_mileage: record.nextDueMileage,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMaintenanceRecords(vehicleId: string) {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Document operations
  async createDocument(document: {
    vehicleId: string;
    tokenId: number;
    type: 'registration' | 'insurance' | 'receipt' | 'manual' | 'warranty' | 'maintenance';
    filename: string;
    originalName: string;
    size: number;
    processedData?: any;
    storagePath?: string;
  }) {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        vehicle_id: document.vehicleId,
        token_id: document.tokenId,
        type: document.type,
        filename: document.filename,
        original_name: document.originalName,
        size: document.size,
        processed_data: document.processedData ? JSON.stringify(document.processedData) : null,
        storage_path: document.storagePath,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getDocuments(vehicleId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getDocumentsByTokenId(tokenId: number) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('token_id', tokenId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getDocumentsForUser(userId: string) {
    // First get all vehicles for the user, then get documents for those vehicles
    const vehicles = await this.getVehiclesByUserId(userId);
    const vehicleIds = vehicles.map(v => v.id);
    
    if (vehicleIds.length === 0) return [];
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .in('vehicle_id', vehicleIds)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getDocumentsForUserByTokenIds(tokenIds: number[]) {
    if (tokenIds.length === 0) return [];
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .in('token_id', tokenIds)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // File storage operations
  async uploadFile(file: File, path: string) {
    console.log('Uploading file to path:', path);
    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.type);
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }
    
    console.log('Upload successful:', data);
    return data;
  },

  async getFileUrl(path: string) {
    // For private buckets, we need to create a signed URL
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  },

  async deleteFile(path: string) {
    const { error } = await supabase.storage
      .from('documents')
      .remove([path]);

    if (error) throw error;
  },

  // Alert operations
  async createAlert(alert: {
    vehicleId: string;
    documentId: string;
    alertType: 'registration_expiry' | 'insurance_expiry' | 'service_due' | 'inspection_due' | 'warranty_expiry';
    alertDate: string;
    alertMessage: string;
  }) {
    const { data, error } = await supabase
      .from('alerts')
      .insert({
        vehicle_id: alert.vehicleId,
        document_id: alert.documentId,
        alert_type: alert.alertType,
        alert_date: alert.alertDate,
        alert_message: alert.alertMessage,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getActiveAlerts(vehicleId: string) {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('is_active', true)
      .gte('alert_date', new Date().toISOString().split('T')[0]) // Only future alerts
      .order('alert_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async updateAlert(alertId: string, updates: {
    alertDate?: string;
    alertMessage?: string;
    isActive?: boolean;
  }) {
    const { data, error } = await supabase
      .from('alerts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createAlertsFromDocument(documentId: string, vehicleId: string, processedData: any) {
    const alerts = [];
    
    // Extract dates from processed data and create alerts
    if (processedData.alertDates) {
      const alertDates = processedData.alertDates;
      
      if (alertDates.registrationExpiry) {
        alerts.push({
          vehicleId,
          documentId,
          alertType: 'registration_expiry' as const,
          alertDate: alertDates.registrationExpiry,
          alertMessage: `Vehicle registration expires on ${alertDates.registrationExpiry}`
        });
      }
      
      if (alertDates.insuranceExpiry) {
        alerts.push({
          vehicleId,
          documentId,
          alertType: 'insurance_expiry' as const,
          alertDate: alertDates.insuranceExpiry,
          alertMessage: `Vehicle insurance expires on ${alertDates.insuranceExpiry}`
        });
      }
      
      if (alertDates.nextService) {
        alerts.push({
          vehicleId,
          documentId,
          alertType: 'service_due' as const,
          alertDate: alertDates.nextService,
          alertMessage: `Next service due on ${alertDates.nextService}`
        });
      }
      
      if (alertDates.inspectionDue) {
        alerts.push({
          vehicleId,
          documentId,
          alertType: 'inspection_due' as const,
          alertDate: alertDates.inspectionDue,
          alertMessage: `Vehicle inspection due on ${alertDates.inspectionDue}`
        });
      }
      
      if (alertDates.warrantyExpiry) {
        alerts.push({
          vehicleId,
          documentId,
          alertType: 'warranty_expiry' as const,
          alertDate: alertDates.warrantyExpiry,
          alertMessage: `Vehicle warranty expires on ${alertDates.warrantyExpiry}`
        });
      }
    }
    
    // Create all alerts with retry logic
    const createdAlerts = [];
    for (const alert of alerts) {
      try {
        // Verify vehicle exists before creating alert
        const vehicleCheck = await supabase
          .from('vehicles')
          .select('id')
          .eq('id', alert.vehicleId)
          .single();
          
        if (vehicleCheck.error || !vehicleCheck.data) {
          console.warn(`Vehicle ${alert.vehicleId} not found, skipping alert creation`);
          continue;
        }
        
        const createdAlert = await this.createAlert(alert);
        createdAlerts.push(createdAlert);
        console.log(`Created alert: ${alert.alertType} for ${alert.alertDate}`);
      } catch (error) {
        console.error(`Failed to create alert ${alert.alertType}:`, error);
      }
    }
    
    return createdAlerts;
  },
}; 