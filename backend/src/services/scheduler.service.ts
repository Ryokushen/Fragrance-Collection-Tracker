import { InventoryService } from './inventory.service';

export class SchedulerService {
  private inventoryService: InventoryService;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  /**
   * Start the background job to recalculate inventory estimates
   * Runs daily at midnight
   */
  startInventoryRecalculationJob(): void {
    // Calculate milliseconds until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    // Set initial timeout to run at midnight
    setTimeout(() => {
      this.runInventoryRecalculation();
      
      // Then set up daily interval (24 hours = 24 * 60 * 60 * 1000 ms)
      this.intervalId = setInterval(() => {
        this.runInventoryRecalculation();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    console.log(`📅 Inventory recalculation job scheduled to start in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);
  }

  /**
   * Stop the background job
   */
  stopInventoryRecalculationJob(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('📅 Inventory recalculation job stopped');
    }
  }

  /**
   * Run the inventory recalculation job immediately
   */
  async runInventoryRecalculation(): Promise<void> {
    try {
      console.log('📊 Starting inventory recalculation job...');
      const startTime = Date.now();
      
      await this.inventoryService.recalculateAllEstimates();
      
      const duration = Date.now() - startTime;
      console.log(`📊 Inventory recalculation completed in ${duration}ms`);
    } catch (error) {
      console.error('❌ Error during inventory recalculation:', error);
    }
  }

  /**
   * Schedule a one-time job to run after a delay
   */
  scheduleOneTimeJob(delayMs: number, jobFn: () => Promise<void>): void {
    setTimeout(async () => {
      try {
        await jobFn();
      } catch (error) {
        console.error('❌ Error in scheduled job:', error);
      }
    }, delayMs);
  }
}

// Singleton instance
let schedulerInstance: SchedulerService | null = null;

export function getSchedulerService(): SchedulerService {
  if (!schedulerInstance) {
    schedulerInstance = new SchedulerService();
  }
  return schedulerInstance;
}

export function createSchedulerService(): SchedulerService {
  return new SchedulerService();
}