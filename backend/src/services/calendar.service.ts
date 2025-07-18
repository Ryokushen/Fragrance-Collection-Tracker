// Calendar service for recording and retrieving daily wear data

import { 
  DailyWear,
  CreateDailyWearDto,
  DateRange,
  WearHistory,
  UsageStats,
  CreateUsageEntryDto
} from '../types';
import { RepositoryFactory } from '../models';
import { InventoryService } from './inventory.service';

export interface CalendarService {
  recordDailyWear(userId: string, date: Date, data: CreateDailyWearDto): Promise<DailyWear>;
  getDailyWear(userId: string, date: Date): Promise<DailyWear | null>;
  getWearHistory(userId: string, dateRange: DateRange): Promise<WearHistory[]>;
  getUsageStatistics(userId: string, fragranceId?: string): Promise<UsageStats>;
  updateDailyWear(id: string, data: Partial<CreateDailyWearDto>): Promise<DailyWear | null>;
  deleteDailyWear(id: string): Promise<boolean>;
}

export class CalendarServiceImpl implements CalendarService {
  private inventoryService: InventoryService;

  constructor(inventoryService: InventoryService) {
    this.inventoryService = inventoryService;
  }

  async recordDailyWear(userId: string, date: Date, data: CreateDailyWearDto): Promise<DailyWear> {
    const dailyWearRepo = RepositoryFactory.getDailyWearRepository();
    const usageEntryRepo = RepositoryFactory.getUsageEntryRepository();

    // Check if daily wear already exists for this date
    const existingDailyWear = await dailyWearRepo.findByUserAndDate(userId, date);
    if (existingDailyWear) {
      throw new Error('Daily wear entry already exists for this date. Use update instead.');
    }

    // Create the daily wear record
    const dailyWear = await dailyWearRepo.create(userId, data);

    // Process each fragrance entry for inventory updates
    for (const entry of data.entries) {
      if (entry.sprayCount && entry.sprayCount > 0) {
        // Create usage entry for inventory tracking
        const usageEntryData: CreateUsageEntryDto = {
          fragranceId: entry.fragranceId,
          date: date,
          sprayCount: entry.sprayCount,
          estimatedUsage: this.calculateEstimatedUsage(entry.sprayCount),
          ...(entry.notes && { notes: entry.notes })
        };

        await usageEntryRepo.create(usageEntryData);

        // Update inventory if usage tracking is enabled
        try {
          await this.inventoryService.updateInventoryFromUsage(entry.fragranceId, {
            id: '', // Will be set by repository
            fragranceId: entry.fragranceId,
            date: date,
            sprayCount: entry.sprayCount,
            estimatedUsage: usageEntryData.estimatedUsage,
            notes: entry.notes,
            createdAt: new Date()
          });
        } catch (error) {
          // Log error but don't fail the daily wear creation
          console.warn(`Failed to update inventory for fragrance ${entry.fragranceId}:`, error);
        }
      }
    }

    return dailyWear;
  }

  async getDailyWear(userId: string, date: Date): Promise<DailyWear | null> {
    const dailyWearRepo = RepositoryFactory.getDailyWearRepository();
    return await dailyWearRepo.findByUserAndDate(userId, date);
  }

  async getWearHistory(userId: string, dateRange: DateRange): Promise<WearHistory[]> {
    const dailyWearRepo = RepositoryFactory.getDailyWearRepository();
    const fragranceRepo = RepositoryFactory.getFragranceRepository();

    const dailyWears = await dailyWearRepo.findByUserAndDateRange(
      userId, 
      dateRange.startDate, 
      dateRange.endDate
    );

    const wearHistory: WearHistory[] = [];

    for (const dailyWear of dailyWears) {
      const fragrances = [];
      
      for (const entry of dailyWear.entries) {
        const fragrance = await fragranceRepo.findById(entry.fragranceId);
        if (fragrance) {
          fragrances.push({
            fragranceId: entry.fragranceId,
            name: fragrance.name,
            brand: fragrance.brand,
            ...(entry.sprayCount !== undefined && { sprayCount: entry.sprayCount })
          });
        }
      }

      wearHistory.push({
        date: dailyWear.date,
        fragrances
      });
    }

    return wearHistory;
  }

  async getUsageStatistics(userId: string, fragranceId?: string): Promise<UsageStats> {
    const dailyWearRepo = RepositoryFactory.getDailyWearRepository();
    const fragranceRepo = RepositoryFactory.getFragranceRepository();

    // Get all daily wear records for the user in the last year
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);

    const dailyWears = await dailyWearRepo.findByUserAndDateRange(userId, startDate, endDate);

    let totalWears = 0;
    let lastWornDate: Date | undefined;
    const fragranceWearCounts = new Map<string, { count: number; name: string; brand: string; lastWorn: Date }>();
    const monthlyWears = new Map<string, number>();

    for (const dailyWear of dailyWears) {
      const monthKey = `${dailyWear.date.getFullYear()}-${String(dailyWear.date.getMonth() + 1).padStart(2, '0')}`;
      
      for (const entry of dailyWear.entries) {
        // Filter by specific fragrance if provided
        if (fragranceId && entry.fragranceId !== fragranceId) {
          continue;
        }

        totalWears++;
        
        // Update last worn date
        if (!lastWornDate || dailyWear.date > lastWornDate) {
          lastWornDate = dailyWear.date;
        }

        // Update monthly counts
        monthlyWears.set(monthKey, (monthlyWears.get(monthKey) || 0) + 1);

        // Update fragrance wear counts
        if (!fragranceWearCounts.has(entry.fragranceId)) {
          const fragrance = await fragranceRepo.findById(entry.fragranceId);
          if (fragrance) {
            fragranceWearCounts.set(entry.fragranceId, {
              count: 0,
              name: fragrance.name,
              brand: fragrance.brand,
              lastWorn: dailyWear.date
            });
          }
        }

        const fragranceData = fragranceWearCounts.get(entry.fragranceId);
        if (fragranceData) {
          fragranceData.count++;
          if (dailyWear.date > fragranceData.lastWorn) {
            fragranceData.lastWorn = dailyWear.date;
          }
        }
      }
    }

    // Calculate average wears per month
    const monthsInRange = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    const averageWearsPerMonth = totalWears / monthsInRange;

    // Get top 10 favorite fragrances
    const favoriteFragrances = Array.from(fragranceWearCounts.entries())
      .map(([fragranceId, data]) => ({
        fragranceId,
        name: data.name,
        brand: data.brand,
        wearCount: data.count
      }))
      .sort((a, b) => b.wearCount - a.wearCount)
      .slice(0, 10);

    // Convert monthly wears to array format
    const wearsByMonth = Array.from(monthlyWears.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalWears,
      averageWearsPerMonth,
      ...(lastWornDate && { lastWornDate }),
      favoriteFragrances,
      wearsByMonth
    };
  }

  async updateDailyWear(id: string, data: Partial<CreateDailyWearDto>): Promise<DailyWear | null> {
    // For now, we'll implement this as delete and recreate since the schema is complex
    // In a production system, you might want more granular updates
    const dailyWearRepo = RepositoryFactory.getDailyWearRepository();
    const existingDailyWear = await dailyWearRepo.findById(id);
    
    if (!existingDailyWear) {
      return null;
    }

    // Delete existing record
    await dailyWearRepo.delete(id);

    // Create new record with updated data
    const updatedData: CreateDailyWearDto = {
      date: data.date || existingDailyWear.date,
      ...(data.weather !== undefined ? { weather: data.weather } : existingDailyWear.weather ? { weather: existingDailyWear.weather } : {}),
      ...(data.occasion !== undefined ? { occasion: data.occasion } : existingDailyWear.occasion ? { occasion: existingDailyWear.occasion } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : existingDailyWear.notes ? { notes: existingDailyWear.notes } : {}),
      entries: data.entries || existingDailyWear.entries.map(entry => ({
        fragranceId: entry.fragranceId,
        ...(entry.sprayCount !== undefined && { sprayCount: entry.sprayCount }),
        ...(entry.bodyParts && { bodyParts: entry.bodyParts }),
        ...(entry.notes && { notes: entry.notes })
      }))
    };

    return await this.recordDailyWear(existingDailyWear.userId, updatedData.date, updatedData);
  }

  async deleteDailyWear(id: string): Promise<boolean> {
    const dailyWearRepo = RepositoryFactory.getDailyWearRepository();
    return await dailyWearRepo.delete(id);
  }

  private calculateEstimatedUsage(sprayCount: number): number {
    // Estimate ~0.1ml per spray (this can be made configurable)
    return sprayCount * 0.1;
  }
}

// Factory function to create calendar service
export function createCalendarService(inventoryService: InventoryService): CalendarService {
  return new CalendarServiceImpl(inventoryService);
}