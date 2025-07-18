import { 
  Inventory,
  CreateInventoryDto,
  UpdateInventoryDto,
  UsageEntry,
  InventoryStatus,
  LowInventoryAlert
} from '../types';
import { RepositoryFactory } from '../models';

export class InventoryService {
  private static readonly SPRAY_TO_ML_RATIO = 0.1; // Approximate ml per spray
  private static readonly DEFAULT_LOW_THRESHOLD = 20; // 20% remaining

  /**
   * Update inventory from usage (used by calendar service)
   */
  async updateInventoryFromUsage(fragranceId: string, usage: UsageEntry): Promise<Inventory> {
    const inventoryRepo = RepositoryFactory.getInventoryRepository();

    // Get current inventory
    let inventory = await inventoryRepo.findByFragranceId(fragranceId);
    
    if (!inventory) {
      throw new Error(`No inventory found for fragrance ${fragranceId}`);
    }

    // Calculate new inventory level if usage tracking is enabled
    if (inventory.usageTracking) {
      const usageAmount = usage.estimatedUsage || usage.sprayCount * InventoryService.SPRAY_TO_ML_RATIO;
      const usagePercentage = (usageAmount / inventory.bottleSize) * 100;
      const newLevel = Math.max(0, inventory.currentLevel - usagePercentage);

      // Update inventory with new level and recalculate estimated days remaining
      const updatedInventory = await inventoryRepo.update(inventory.id, {
        currentLevel: newLevel,
        estimatedDaysRemaining: await this.calculateRemainingDays(fragranceId)
      });

      if (!updatedInventory) {
        throw new Error('Failed to update inventory');
      }

      return updatedInventory;
    }

    return inventory;
  }

  /**
   * Update inventory based on usage entry
   */
  async updateInventory(fragranceId: string, usage: UsageEntry): Promise<Inventory> {
    const inventoryRepo = RepositoryFactory.getInventoryRepository();
    const usageRepo = RepositoryFactory.getUsageEntryRepository();

    // Get current inventory
    let inventory = await inventoryRepo.findByFragranceId(fragranceId);
    
    if (!inventory) {
      throw new Error(`No inventory found for fragrance ${fragranceId}`);
    }

    // Create usage entry
    const createUsageData: any = {
      fragranceId,
      date: usage.date,
      sprayCount: usage.sprayCount,
      estimatedUsage: usage.estimatedUsage || usage.sprayCount * InventoryService.SPRAY_TO_ML_RATIO
    };
    
    if (usage.notes) {
      createUsageData.notes = usage.notes;
    }
    
    await usageRepo.create(createUsageData);

    // Calculate new inventory level if usage tracking is enabled
    if (inventory.usageTracking) {
      const usageAmount = usage.estimatedUsage || usage.sprayCount * InventoryService.SPRAY_TO_ML_RATIO;
      const usagePercentage = (usageAmount / inventory.bottleSize) * 100;
      const newLevel = Math.max(0, inventory.currentLevel - usagePercentage);

      // Update inventory with new level and recalculate estimated days remaining
      const updatedInventory = await inventoryRepo.update(inventory.id, {
        currentLevel: newLevel,
        estimatedDaysRemaining: await this.calculateRemainingDays(fragranceId)
      });

      if (!updatedInventory) {
        throw new Error('Failed to update inventory');
      }

      return updatedInventory;
    }

    return inventory;
  }

  /**
   * Get inventory status for a fragrance
   */
  async getInventoryStatus(fragranceId: string): Promise<InventoryStatus> {
    const inventoryRepo = RepositoryFactory.getInventoryRepository();
    const usageRepo = RepositoryFactory.getUsageEntryRepository();

    const inventory = await inventoryRepo.findByFragranceId(fragranceId);
    
    if (!inventory) {
      throw new Error(`No inventory found for fragrance ${fragranceId}`);
    }

    // Get last usage date
    const usageEntries = await usageRepo.findByFragranceId(fragranceId);
    const lastUsed = usageEntries.length > 0 ? usageEntries[0].date : undefined;

    const status: InventoryStatus = {
      fragranceId,
      currentLevel: inventory.currentLevel,
      isLow: inventory.currentLevel <= inventory.lowThreshold
    };
    
    if (inventory.estimatedDaysRemaining !== undefined) {
      status.estimatedDaysRemaining = inventory.estimatedDaysRemaining;
    }
    
    if (lastUsed) {
      status.lastUsed = lastUsed;
    }
    
    return status;
  }

  /**
   * Get low inventory alerts for a user
   */
  async getLowInventoryAlerts(userId: string): Promise<LowInventoryAlert[]> {
    const fragranceRepo = RepositoryFactory.getFragranceRepository();
    const inventoryRepo = RepositoryFactory.getInventoryRepository();

    // Get all owned fragrances for the user
    const result = await fragranceRepo.findByUserId(userId, { listType: 'owned' });
    const fragrances = result.data;

    const alerts: LowInventoryAlert[] = [];

    for (const fragrance of fragrances) {
      const inventory = await inventoryRepo.findByFragranceId(fragrance.id);
      
      if (inventory && inventory.currentLevel <= inventory.lowThreshold) {
        const alert: LowInventoryAlert = {
          fragranceId: fragrance.id,
          name: fragrance.name,
          brand: fragrance.brand,
          currentLevel: inventory.currentLevel,
          threshold: inventory.lowThreshold
        };
        
        if (inventory.estimatedDaysRemaining !== undefined) {
          alert.estimatedDaysRemaining = inventory.estimatedDaysRemaining;
        }
        
        alerts.push(alert);
      }
    }

    // Sort by urgency (lowest level first)
    return alerts.sort((a, b) => a.currentLevel - b.currentLevel);
  }

  /**
   * Calculate estimated remaining days for a fragrance
   */
  async calculateRemainingDays(fragranceId: string): Promise<number> {
    const inventoryRepo = RepositoryFactory.getInventoryRepository();
    const usageRepo = RepositoryFactory.getUsageEntryRepository();

    const inventory = await inventoryRepo.findByFragranceId(fragranceId);
    
    if (!inventory || inventory.currentLevel <= 0) {
      return 0;
    }

    // Get usage history for the last 30 days to calculate average daily usage
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsage = await usageRepo.findByFragranceAndDateRange(
      fragranceId,
      thirtyDaysAgo,
      new Date()
    );

    if (recentUsage.length === 0) {
      // No recent usage data, return a conservative estimate
      // Assume 0.5ml per day usage
      const remainingMl = (inventory.currentLevel / 100) * inventory.bottleSize;
      return Math.floor(remainingMl / 0.5);
    }

    // Calculate average daily usage
    const totalUsage = recentUsage.reduce((sum, entry) => {
      return sum + (entry.estimatedUsage || entry.sprayCount * InventoryService.SPRAY_TO_ML_RATIO);
    }, 0);

    const daysWithUsage = new Set(recentUsage.map(entry => entry.date.toDateString())).size;
    const averageDailyUsage = totalUsage / Math.max(daysWithUsage, 1);

    if (averageDailyUsage <= 0) {
      return Infinity; // No usage, bottle will last indefinitely
    }

    // Calculate remaining ml and divide by average daily usage
    const remainingMl = (inventory.currentLevel / 100) * inventory.bottleSize;
    const estimatedDays = Math.floor(remainingMl / averageDailyUsage);

    return Math.max(0, estimatedDays);
  }

  /**
   * Create inventory record for a fragrance
   */
  async createInventory(data: CreateInventoryDto): Promise<Inventory> {
    const inventoryRepo = RepositoryFactory.getInventoryRepository();
    
    // Check if inventory already exists for this fragrance
    const existingInventory = await inventoryRepo.findByFragranceId(data.fragranceId);
    if (existingInventory) {
      throw new Error(`Inventory already exists for fragrance ${data.fragranceId}`);
    }

    return await inventoryRepo.create({
      ...data,
      currentLevel: data.currentLevel || 100,
      usageTracking: data.usageTracking !== false, // Default to true
      lowThreshold: data.lowThreshold || InventoryService.DEFAULT_LOW_THRESHOLD
    });
  }

  /**
   * Update inventory record
   */
  async updateInventoryRecord(fragranceId: string, data: UpdateInventoryDto): Promise<Inventory> {
    const inventoryRepo = RepositoryFactory.getInventoryRepository();
    
    const inventory = await inventoryRepo.findByFragranceId(fragranceId);
    if (!inventory) {
      throw new Error(`No inventory found for fragrance ${fragranceId}`);
    }

    // If current level is being updated, recalculate estimated days remaining
    if (data.currentLevel !== undefined) {
      data.estimatedDaysRemaining = await this.calculateRemainingDays(fragranceId);
    }

    const updatedInventory = await inventoryRepo.update(inventory.id, data);
    if (!updatedInventory) {
      throw new Error('Failed to update inventory');
    }

    return updatedInventory;
  }

  /**
   * Get inventory record for a fragrance
   */
  async getInventory(fragranceId: string): Promise<Inventory | null> {
    const inventoryRepo = RepositoryFactory.getInventoryRepository();
    return await inventoryRepo.findByFragranceId(fragranceId);
  }

  /**
   * Background job to recalculate estimated remaining days for all inventories
   * This should be called periodically (e.g., daily) to keep estimates up to date
   */
  async recalculateAllEstimates(): Promise<void> {
    const fragranceRepo = RepositoryFactory.getFragranceRepository();
    const inventoryRepo = RepositoryFactory.getInventoryRepository();

    // Get all fragrances (we'll need to iterate through users in a real implementation)
    // For now, we'll use a placeholder user ID
    const result = await fragranceRepo.findByUserId('temp-user-id', { listType: 'owned' });
    const fragrances = result.data;

    for (const fragrance of fragrances) {
      const inventory = await inventoryRepo.findByFragranceId(fragrance.id);
      
      if (inventory && inventory.usageTracking) {
        try {
          const estimatedDays = await this.calculateRemainingDays(fragrance.id);
          await inventoryRepo.update(inventory.id, {
            estimatedDaysRemaining: estimatedDays
          });
        } catch (error) {
          console.error(`Failed to update estimates for fragrance ${fragrance.id}:`, error);
        }
      }
    }
  }
}

// Factory function for creating service instance
export function createInventoryService(): InventoryService {
  return new InventoryService();
}