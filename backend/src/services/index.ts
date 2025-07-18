// Service layer interfaces and implementations

import { 
  Fragrance, 
  CreateFragranceDto, 
  UpdateFragranceDto, 
  FragranceFilters,
  ExternalFragrance,
  Inventory,
  UsageEntry,
  InventoryStatus,
  LowInventoryAlert,
  DailyWearEntry,
  DateRange,
  WearHistory,
  UsageStats
} from '../types';

// Export the external fragrance service
export { ExternalFragranceService, createExternalFragranceService } from './external-fragrance.service';
export { InventoryService, createInventoryService } from './inventory.service';
export { SchedulerService, getSchedulerService, createSchedulerService } from './scheduler.service';

export interface FragranceService {
  searchExternal(query: string): Promise<ExternalFragrance[]>;
  createFragrance(data: CreateFragranceDto): Promise<Fragrance>;
  getUserFragrances(userId: string, filters?: FragranceFilters): Promise<Fragrance[]>;
  updateFragrance(id: string, data: UpdateFragranceDto): Promise<Fragrance>;
  deleteFragrance(id: string): Promise<void>;
}

export interface IInventoryService {
  updateInventory(fragranceId: string, usage: UsageEntry): Promise<Inventory>;
  getInventoryStatus(fragranceId: string): Promise<InventoryStatus>;
  getLowInventoryAlerts(userId: string): Promise<LowInventoryAlert[]>;
  calculateRemainingDays(fragranceId: string): Promise<number>;
}

export interface CalendarService {
  recordDailyWear(userId: string, date: Date, fragrances: DailyWearEntry[]): Promise<void>;
  getDailyWear(userId: string, date: Date): Promise<DailyWearEntry[]>;
  getWearHistory(userId: string, dateRange: DateRange): Promise<WearHistory[]>;
  getUsageStatistics(userId: string, fragranceId?: string): Promise<UsageStats>;
}

export interface UserService {
  createUser(email: string, password: string): Promise<{ id: string; email: string }>;
  authenticateUser(email: string, password: string): Promise<{ id: string; email: string; token: string }>;
  getUserById(id: string): Promise<{ id: string; email: string }>;
}