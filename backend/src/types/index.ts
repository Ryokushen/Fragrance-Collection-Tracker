// Core data model interfaces for the Fragrance Collection Tracker

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name?: string;
}

export interface Fragrance {
  id: string;
  userId: string;
  name: string;
  brand: string;
  year?: number | undefined;
  concentration?: string | undefined; // EDT, EDP, Parfum, etc.
  notes: {
    top: string[];
    middle: string[];
    base: string[];
  };
  externalId?: string | undefined; // Reference to external database
  personalRating?: number | undefined; // 1-10 scale
  personalNotes?: string | undefined;
  purchaseInfo?: {
    date: Date;
    price: number;
    retailer: string;
  } | undefined;
  listType: 'owned' | 'tried' | 'wishlist';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFragranceDto {
  name: string;
  brand: string;
  year?: number;
  concentration?: string;
  notes?: {
    top?: string[];
    middle?: string[];
    base?: string[];
  };
  externalId?: string;
  personalRating?: number;
  personalNotes?: string;
  purchaseInfo?: {
    date: Date;
    price: number;
    retailer: string;
  };
  listType?: 'owned' | 'tried' | 'wishlist';
}

export interface UpdateFragranceDto {
  name?: string;
  brand?: string;
  year?: number;
  concentration?: string;
  notes?: {
    top?: string[];
    middle?: string[];
    base?: string[];
  };
  personalRating?: number;
  personalNotes?: string;
  purchaseInfo?: {
    date: Date;
    price: number;
    retailer: string;
  };
  listType?: 'owned' | 'tried' | 'wishlist';
}

export interface Inventory {
  id: string;
  fragranceId: string;
  bottleSize: number; // in ml
  currentLevel: number; // percentage 0-100
  purchaseDate: Date;
  openedDate?: Date | undefined;
  usageTracking: boolean;
  lowThreshold: number; // percentage for alerts
  estimatedDaysRemaining?: number | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInventoryDto {
  fragranceId: string;
  bottleSize: number;
  currentLevel?: number;
  purchaseDate: Date;
  openedDate?: Date;
  usageTracking?: boolean;
  lowThreshold?: number;
}

export interface UpdateInventoryDto {
  bottleSize?: number;
  currentLevel?: number;
  openedDate?: Date;
  usageTracking?: boolean;
  lowThreshold?: number;
  estimatedDaysRemaining?: number;
}

export interface DailyWear {
  id: string;
  userId: string;
  date: Date;
  weather?: string | undefined;
  occasion?: string | undefined;
  notes?: string | undefined;
  entries: DailyWearEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyWearEntry {
  id: string;
  dailyWearId: string;
  fragranceId: string;
  sprayCount?: number | undefined;
  bodyParts?: string[] | undefined; // wrists, neck, etc.
  notes?: string | undefined;
  createdAt: Date;
}

export interface CreateDailyWearDto {
  date: Date;
  weather?: string;
  occasion?: string;
  notes?: string;
  entries: {
    fragranceId: string;
    sprayCount?: number;
    bodyParts?: string[];
    notes?: string;
  }[];
}

export interface UsageEntry {
  id: string;
  fragranceId: string;
  date: Date;
  sprayCount: number;
  estimatedUsage?: number | undefined; // in ml
  notes?: string | undefined;
  createdAt: Date;
}

export interface CreateUsageEntryDto {
  fragranceId: string;
  date: Date;
  sprayCount: number;
  estimatedUsage?: number;
  notes?: string;
}

// External API integration types
export interface ExternalFragrance {
  id: string;
  name: string;
  brand: string;
  year?: number;
  concentration?: string;
  notes: {
    top: string[];
    middle: string[];
    base: string[];
  };
  imageUrl?: string;
  description?: string;
  source: 'fragrantica' | 'parfumo' | 'manual';
}

// Filter and query types
export interface FragranceFilters {
  brand?: string;
  listType?: 'owned' | 'tried' | 'wishlist';
  minRating?: number;
  maxRating?: number;
  hasLowInventory?: boolean;
  search?: string;
}

export interface FragranceSortOptions {
  field: 'name' | 'brand' | 'rating' | 'createdAt' | 'lastWorn';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Statistics and analytics types
export interface UsageStats {
  totalWears: number;
  averageWearsPerMonth: number;
  lastWornDate?: Date;
  favoriteFragrances: Array<{
    fragranceId: string;
    name: string;
    brand: string;
    wearCount: number;
  }>;
  wearsByMonth: Array<{
    month: string;
    count: number;
  }>;
}

export interface InventoryStatus {
  fragranceId: string;
  currentLevel: number;
  isLow: boolean;
  estimatedDaysRemaining?: number;
  lastUsed?: Date;
}

export interface LowInventoryAlert {
  fragranceId: string;
  name: string;
  brand: string;
  currentLevel: number;
  threshold: number;
  estimatedDaysRemaining?: number;
}

// Database row types (for internal use)
export interface FragranceRow {
  id: string;
  user_id: string;
  name: string;
  brand: string;
  year?: number;
  concentration?: string;
  top_notes?: string; // JSON string
  middle_notes?: string; // JSON string
  base_notes?: string; // JSON string
  external_id?: string;
  personal_rating?: number;
  personal_notes?: string;
  purchase_date?: string;
  purchase_price?: number;
  purchase_retailer?: string;
  list_type: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryRow {
  id: string;
  fragrance_id: string;
  bottle_size: number;
  current_level: number;
  purchase_date: string;
  opened_date?: string;
  usage_tracking: number; // SQLite boolean as number
  low_threshold: number;
  estimated_days_remaining?: number;
  created_at: string;
  updated_at: string;
}

export interface DailyWearRow {
  id: string;
  user_id: string;
  date: string;
  weather?: string;
  occasion?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DailyWearEntryRow {
  id: string;
  daily_wear_id: string;
  fragrance_id: string;
  spray_count?: number;
  body_parts?: string; // JSON string
  notes?: string;
  created_at: string;
}

export interface UsageEntryRow {
  id: string;
  fragrance_id: string;
  date: string;
  spray_count: number;
  estimated_usage?: number;
  notes?: string;
  created_at: string;
}

// Additional types for date ranges and wear history
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface WearHistory {
  date: Date;
  fragrances: Array<{
    fragranceId: string;
    name: string;
    brand: string;
    sprayCount?: number;
  }>;
}