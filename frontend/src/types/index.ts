// Frontend type definitions - mirrors backend types for consistency

export interface Fragrance {
  id: string;
  userId: string;
  name: string;
  brand: string;
  year?: number;
  concentration?: string;
  notes: {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface Inventory {
  id: string;
  fragranceId: string;
  bottleSize: number;
  currentLevel: number;
  purchaseDate: Date;
  openedDate?: Date;
  usageTracking: boolean;
  lowThreshold: number;
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
    bodyParts?: string[];
    notes?: string;
  }[];
  weather?: string;
  occasion?: string;
  createdAt: Date;
}

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

// Form interfaces for UI components

export interface FragranceFormData {
  name: string;
  brand: string;
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
  listType: 'owned' | 'tried' | 'wishlist';
}

export interface InventoryFormData {
  bottleSize: number;
  currentLevel: number;
  purchaseDate: Date;
  openedDate?: Date;
  usageTracking: boolean;
  lowThreshold: number;
}

export interface DailyWearFormData {
  date: Date;
  fragrances: {
    fragranceId: string;
    sprayCount?: number;
    bodyParts?: string[];
    notes?: string;
  }[];
  weather?: string;
  occasion?: string;
}

// Filter and search interfaces

export interface FragranceFilters {
  brand?: string;
  listType?: 'owned' | 'tried' | 'wishlist';
  minRating?: number;
  maxRating?: number;
  inventoryLevel?: 'low' | 'medium' | 'high';
  sortBy?: 'name' | 'brand' | 'rating' | 'lastWorn' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchFilters {
  query: string;
  brand?: string;
  concentration?: string;
  year?: number;
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

// API response wrapper

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// UI state interfaces

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Component prop interfaces

export interface FragranceCardProps {
  fragrance: Fragrance;
  inventory?: Inventory;
  onEdit: (fragrance: Fragrance) => void;
  onDelete: (id: string) => void;
  onRate: (id: string, rating: number) => void;
  onMarkAsWorn: (id: string) => void;
}

export interface CalendarDayProps {
  date: Date;
  fragrances: {
    fragranceId: string;
    fragranceName: string;
    brand: string;
  }[];
  onAddWear: (date: Date) => void;
  onViewDay: (date: Date) => void;
}

export interface InventoryIndicatorProps {
  inventory: Inventory;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}