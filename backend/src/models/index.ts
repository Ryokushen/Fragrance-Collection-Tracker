// Database model interfaces - to be implemented in later tasks

export interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query(sql: string, params?: any[]): Promise<any>;
  transaction<T>(callback: () => Promise<T>): Promise<T>;
}

export interface FragranceRepository {
  create(fragrance: any): Promise<string>;
  findById(id: string): Promise<any>;
  findByUserId(userId: string, filters?: any): Promise<any[]>;
  update(id: string, data: any): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface InventoryRepository {
  create(inventory: any): Promise<string>;
  findByFragranceId(fragranceId: string): Promise<any>;
  update(id: string, data: any): Promise<void>;
  findLowInventory(userId: string): Promise<any[]>;
}

export interface DailyWearRepository {
  create(dailyWear: any): Promise<string>;
  findByUserAndDate(userId: string, date: Date): Promise<any>;
  findByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<any[]>;
  update(id: string, data: any): Promise<void>;
}

export interface UsageEntryRepository {
  create(usageEntry: any): Promise<string>;
  findByFragranceId(fragranceId: string): Promise<any[]>;
  findByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<any[]>;
}