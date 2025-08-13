import { db } from '@/lib/supabase';

export interface Vehicle {
  id: string;
  vin: string;
  name: string;
  make: string;
  model: string;
  year: number;
  type: 'electric' | 'hybrid' | 'gas';
  tokenId: number;
  userId: string;
}

export interface DocumentMatch {
  vehicleId: string;
  vehicleName: string;
  tokenId: number; // Add tokenId field
  confidence: 'exact' | 'partial' | 'created' | 'none';
  matchedVin?: string;
}

export class VehicleMatcher {
  private vehicles: Vehicle[] = [];

  constructor() {
    this.loadVehicles();
  }

  async loadVehicles() {
    try {
      // Load vehicles from database dynamically
      // For now, start with empty array - vehicles will be created from documents
      this.vehicles = [];
      
      // In production, you'd load from database like this:
      // const dbVehicles = await db.getVehiclesByUserId('user-123');
      // this.vehicles = dbVehicles.map(v => ({
      //   id: v.id,
      //   vin: v.vin,
      //   name: v.name,
      //   make: v.make,
      //   model: v.model,
      //   year: v.year,
      //   type: v.type,
      //   tokenId: v.token_id,
      //   userId: v.user_id
      // }));
      
      console.log('Loaded vehicles from database:', this.vehicles.length);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
      this.vehicles = []; // Start with empty array
    }
  }

  async loadVehiclesFromDatabase(userId: string) {
    try {
      const dbVehicles = await db.getVehiclesByUserId(userId);
      this.vehicles = dbVehicles.map(v => ({
        id: v.id,
        vin: v.vin || 'UNKNOWN',
        name: v.name,
        make: v.make,
        model: v.model,
        year: v.year,
        type: v.type,
        tokenId: v.token_id,
        userId: v.user_id
      }));
      
      console.log('Loaded vehicles from database:', this.vehicles.length);
      return this.vehicles;
    } catch (error) {
      console.error('Failed to load vehicles from database:', error);
      this.vehicles = [];
      return [];
    }
  }

  async refreshVehicles(userId: string) {
    await this.loadVehiclesFromDatabase(userId);
  }

  async findVehicleByVin(vin: string): Promise<DocumentMatch | null> {
    if (!vin) {
      console.log('No VIN provided for vehicle matching');
      return null;
    }

    // Normalize VIN (remove spaces, convert to uppercase)
    const normalizedVin = vin.replace(/\s/g, '').toUpperCase();
    console.log('Looking for vehicle with VIN:', normalizedVin);

    // First, try to find the vehicle in the database directly
    try {
      const existingVehicle = await db.getVehicleByVin(normalizedVin);
      if (existingVehicle) {
        console.log('Found existing vehicle in database:', existingVehicle.name);
        return {
          vehicleId: existingVehicle.id,
          vehicleName: existingVehicle.name,
          tokenId: existingVehicle.token_id,
          confidence: 'exact',
          matchedVin: existingVehicle.vin
        };
      }
    } catch (error) {
      console.warn('Error checking database for vehicle:', error);
    }

    // Look for exact match in local cache
    const exactMatch = this.vehicles.find(vehicle => 
      vehicle.vin.replace(/\s/g, '').toUpperCase() === normalizedVin
    );

    if (exactMatch) {
      console.log('Found exact vehicle match in cache:', exactMatch.name);
      return {
        vehicleId: exactMatch.id,
        vehicleName: exactMatch.name,
        tokenId: exactMatch.tokenId,
        confidence: 'exact',
        matchedVin: exactMatch.vin
      };
    }

    // Look for partial match (last 8 characters)
    const partialVin = normalizedVin.slice(-8);
    const partialMatch = this.vehicles.find(vehicle => {
      const vehicleVin = vehicle.vin.replace(/\s/g, '').toUpperCase();
      return vehicleVin.slice(-8) === partialVin;
    });

    if (partialMatch) {
      console.log('Found partial vehicle match:', partialMatch.name);
      return {
        vehicleId: partialMatch.id,
        vehicleName: partialMatch.name,
        tokenId: partialMatch.tokenId,
        confidence: 'partial',
        matchedVin: partialMatch.vin
      };
    }

    // If no match found, try to create a new vehicle record
    console.log('No vehicle found for VIN:', vin, '- attempting to create new vehicle record');
    try {
      const newVehicle = await this.createVehicleFromVin(vin);
      
      return {
        vehicleId: newVehicle.id,
        vehicleName: newVehicle.name,
        tokenId: newVehicle.tokenId,
        confidence: 'created',
        matchedVin: newVehicle.vin
      };
    } catch (error) {
      console.error('Failed to create vehicle, checking if it already exists:', error);
      
      // If creation failed due to duplicate VIN, try to find it again
      try {
        const retryVehicle = await db.getVehicleByVin(normalizedVin);
        if (retryVehicle) {
          console.log('Found existing vehicle after creation failure:', retryVehicle.name);
          return {
            vehicleId: retryVehicle.id,
            vehicleName: retryVehicle.name,
            tokenId: retryVehicle.token_id,
            confidence: 'exact',
            matchedVin: retryVehicle.vin
          };
        }
      } catch (retryError) {
        console.warn('Error retrying vehicle lookup:', retryError);
      }
      
      // If still no match, return null
      console.warn('Could not create or find vehicle for VIN:', vin);
      return null;
    }
  }

  private async createVehicleFromVin(vin: string): Promise<Vehicle> {
    // Create a new vehicle record based on VIN
    const newVehicle: Vehicle = {
      id: crypto.randomUUID(),
      vin: vin || 'UNKNOWN',
      name: vin ? `Vehicle ${vin.slice(-6)}` : 'Unknown Vehicle', // Use last 6 chars of VIN as name
      make: 'Unknown',
      model: 'Unknown',
      year: new Date().getFullYear(),
      type: 'gas', // Default
      tokenId: Math.floor(Math.random() * 1000000) + 100000, // Generate unique token ID
      userId: crypto.randomUUID() // Use proper UUID instead of string
    };

    // Save to database
    try {
      await db.createVehicle({
        userId: newVehicle.userId,
        tokenId: newVehicle.tokenId,
        vin: newVehicle.vin,
        name: newVehicle.name,
        make: newVehicle.make,
        model: newVehicle.model,
        year: newVehicle.year,
        type: newVehicle.type
      });

      // Add to local cache
      this.vehicles.push(newVehicle);
      console.log('Created new vehicle record:', newVehicle);
    } catch (error) {
      console.error('Failed to create vehicle:', error);
      // Return the vehicle object even if database save fails
    }

    return newVehicle;
  }

  async createVehicleFromDocument(vin: string, documentData: any): Promise<Vehicle> {
    // Create a new vehicle record based on actual document data
    const newVehicle: Vehicle = {
      id: crypto.randomUUID(),
      vin: vin || 'UNKNOWN', // Use the actual VIN extracted by AI
      name: documentData.vehicleInfo?.make && documentData.vehicleInfo?.model 
        ? `${documentData.vehicleInfo.make} ${documentData.vehicleInfo.model}`
        : vin ? `Vehicle ${vin.slice(-6)}` : 'Unknown Vehicle',
      make: documentData.vehicleInfo?.make || 'Unknown',
      model: documentData.vehicleInfo?.model || 'Unknown',
      year: documentData.vehicleInfo?.year || new Date().getFullYear(),
      type: 'gas', // Default
      tokenId: Math.floor(Math.random() * 1000000) + 100000, // Generate unique token ID
      userId: crypto.randomUUID() // Use proper UUID instead of string
    };

    // Save to database
    try {
      await db.createVehicle({
        userId: newVehicle.userId,
        tokenId: newVehicle.tokenId,
        vin: newVehicle.vin,
        name: newVehicle.name,
        make: newVehicle.make,
        model: newVehicle.model,
        year: newVehicle.year,
        type: newVehicle.type
      });

      // Add to local cache
      this.vehicles.push(newVehicle);
      console.log('Created new vehicle from document data:', newVehicle);
    } catch (error) {
      console.error('Failed to create vehicle:', error);
      // Return the vehicle object even if database save fails
    }

    return newVehicle;
  }

  async getVehicleById(vehicleId: string): Promise<Vehicle | null> {
    return this.vehicles.find(v => v.id === vehicleId) || null;
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    return this.vehicles;
  }
} 