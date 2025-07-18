// Core data model interfaces

export interface Fragrance {
  id: string;
  userId: string;
  name: string;
  brand: string;
  year?: number;
  concentration?: string; // EDT, EDP, Parfum, etc.
  notes: {
    top: string[];
    middle: string[];
    base: string[];
  };
  externalId?: string; // Reference to external database
  personalRating?: number; // 1-10 scale
  personalNotes?: string;
  purchaseInfo?: {
    date: Date;
    price: number;
    retailer: string;
  };
  listType: 'owned' | 'tried' | 'wishlist';
  createdAt: Date;
  updatedAt: Date;
}

export interface Inventory {
  id: string;
  fragranceId: string;
  bottleSize: number; // in ml
  currentLevel: number; // percentage 0-100
  purchaseDate: Date;
  openedDate?: Date;
  usageTracking: boolean;
  lowThreshold: number; // percentage for alerts
  estimatedDaysRemaining?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyWear {
  id: string;
  userId: string;
  date: Date;
  fragrances: {
    fragranceId: string;
    sprayCount?: number;
    bodyParts?: string[]; // wrists, neck, etc.
    notes?: string;
  }[];
  weather?: string;
  occasion?: string;
  createdAt: Date;
}

export interface UsageEntry {
  id: string;
  fragranceId: string;
  date: Date;
  sprayCount: number;
  estimatedUsage: number; // in ml
  notes?: string;
  createdAt: Date;
}

// External API integration interfaces

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

// DTO interfaces for API requests

export interface CreateFragranceDto {
  name: string;
  brand: string;
  year?: number;
  concentration?: string;
  notes?: {
    top: string[];
    middle: string[];
    base: string[];
  };
  externalId?: string;
  personalRating?: number;
  personalNotes?: string;
  purchaseInfo?: {
    date: Date;
    price: number;
    retailer: string;
  };
  listType: 'owned' | 'tried' | 'wishlist';
}

export interface UpdateFragranceDto {
  name?: string;
  brand?: string;
  year?: number;
  concentration?: string;
  notes?: {
    top: string[];
    middle: string[];
    base: string[];
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

export interface FragranceFilters {
  brand?: string;
  listType?: 'owned' | 'tried' | 'wishlist';
  minRating?: number;
  maxRating?: number;
  inventoryLevel?: 'low' | 'medium' | 'high';
  sortBy?: 'name' | 'brand' | 'rating' | 'lastWorn' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface DailyWearEntry {
  fragranceId: string;
  sprayCount?: number;
  bodyParts?: string[];
  notes?: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Response interfaces

export interface InventoryStatus {
  fragranceId: string;
  bottleSize: number;
  currentLevel: number;
  remainingMl: number;
  isLow: boolean;
  estimatedDaysRemaining?: number;
}

export interface LowInventoryAlert {
  fragranceId: string;
  fragranceName: string;
  brand: string;
  currentLevel: number;
  lowThreshold: number;
  estimatedDaysRemaining?: number;
}

export interface WearHistory {
  date: Date;
  fragrances: {
    fragranceId: string;
    fragranceName: string;
    brand: string;
    sprayCount?: number;
    notes?: string;
  }[];
  weather?: string;
  occasion?: string;
}

export interface UsageStats {
  fragranceId?: string;
  totalWears: number;
  averageWearsPerWeek: number;
  lastWornDate?: Date;
  favoriteFragrances: {
    fragranceId: string;
    fragranceName: string;
    brand: string;
    wearCount: number;
  }[];
  wearsByMonth: {
    month: string;
    count: number;
  }[];
}

// Error response interface

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}