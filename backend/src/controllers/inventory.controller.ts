import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import { 
  CreateInventoryDto, 
  UpdateInventoryDto, 
  CreateUsageEntryDto 
} from '../types';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  /**
   * Update inventory levels based on usage
   * POST /api/inventory
   */
  async updateInventory(req: Request, res: Response): Promise<void> {
    try {
      const { fragranceId, sprayCount, estimatedUsage, notes } = req.body;

      if (!fragranceId || !sprayCount) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'fragranceId and sprayCount are required',
          },
        });
        return;
      }

      const usageEntry: CreateUsageEntryDto = {
        fragranceId,
        date: new Date(),
        sprayCount: parseInt(sprayCount),
        ...(estimatedUsage && { estimatedUsage: parseFloat(estimatedUsage) }),
        ...(notes && { notes })
      };

      const updatedInventory = await this.inventoryService.updateInventory(
        fragranceId, 
        {
          id: '', // Will be generated
          fragranceId,
          date: usageEntry.date,
          sprayCount: usageEntry.sprayCount,
          estimatedUsage: usageEntry.estimatedUsage,
          notes: usageEntry.notes,
          createdAt: new Date()
        }
      );

      res.json({
        success: true,
        data: updatedInventory,
      });
    } catch (error) {
      console.error('Error updating inventory:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update inventory',
        },
      });
    }
  }

  /**
   * Get low inventory alerts for user
   * GET /api/inventory/alerts
   */
  async getLowInventoryAlerts(_req: Request, res: Response): Promise<void> {
    try {
      // TODO: Get userId from authentication middleware
      const userId = 'temp-user-id'; // Temporary until auth is implemented

      const alerts = await this.inventoryService.getLowInventoryAlerts(userId);

      res.json({
        success: true,
        data: alerts,
        count: alerts.length,
      });
    } catch (error) {
      console.error('Error fetching low inventory alerts:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch low inventory alerts',
        },
      });
    }
  }

  /**
   * Get inventory status for a specific fragrance
   * GET /api/inventory/:fragranceId/status
   */
  async getInventoryStatus(req: Request, res: Response): Promise<void> {
    try {
      const { fragranceId } = req.params;

      const status = await this.inventoryService.getInventoryStatus(fragranceId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error('Error fetching inventory status:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch inventory status',
        },
      });
    }
  }

  /**
   * Create inventory record for a fragrance
   * POST /api/inventory/create
   */
  async createInventory(req: Request, res: Response): Promise<void> {
    try {
      const inventoryData: CreateInventoryDto = req.body;

      // Convert date strings to Date objects
      if (inventoryData.purchaseDate) {
        inventoryData.purchaseDate = new Date(inventoryData.purchaseDate);
      }
      if (inventoryData.openedDate) {
        inventoryData.openedDate = new Date(inventoryData.openedDate);
      }

      const inventory = await this.inventoryService.createInventory(inventoryData);

      res.status(201).json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      console.error('Error creating inventory:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create inventory',
        },
      });
    }
  }

  /**
   * Update inventory record
   * PUT /api/inventory/:fragranceId
   */
  async updateInventoryRecord(req: Request, res: Response): Promise<void> {
    try {
      const { fragranceId } = req.params;
      const updateData: UpdateInventoryDto = req.body;

      // Convert date strings to Date objects if present
      if (updateData.openedDate) {
        updateData.openedDate = new Date(updateData.openedDate);
      }

      const updatedInventory = await this.inventoryService.updateInventoryRecord(
        fragranceId, 
        updateData
      );

      res.json({
        success: true,
        data: updatedInventory,
      });
    } catch (error) {
      console.error('Error updating inventory record:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update inventory record',
        },
      });
    }
  }

  /**
   * Get inventory record for a fragrance
   * GET /api/inventory/:fragranceId
   */
  async getInventory(req: Request, res: Response): Promise<void> {
    try {
      const { fragranceId } = req.params;

      const inventory = await this.inventoryService.getInventory(fragranceId);

      if (!inventory) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Inventory not found for this fragrance',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch inventory',
        },
      });
    }
  }

  /**
   * Calculate estimated remaining days for a fragrance
   * GET /api/inventory/:fragranceId/remaining-days
   */
  async getRemainingDays(req: Request, res: Response): Promise<void> {
    try {
      const { fragranceId } = req.params;

      const remainingDays = await this.inventoryService.calculateRemainingDays(fragranceId);

      res.json({
        success: true,
        data: {
          fragranceId,
          estimatedDaysRemaining: remainingDays,
        },
      });
    } catch (error) {
      console.error('Error calculating remaining days:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to calculate remaining days',
        },
      });
    }
  }

  /**
   * Trigger recalculation of all inventory estimates
   * POST /api/inventory/recalculate
   */
  async recalculateEstimates(_req: Request, res: Response): Promise<void> {
    try {
      await this.inventoryService.recalculateAllEstimates();

      res.json({
        success: true,
        message: 'Inventory estimates recalculated successfully',
      });
    } catch (error) {
      console.error('Error recalculating estimates:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to recalculate inventory estimates',
        },
      });
    }
  }
}

// Factory function for creating controller instance
export function createInventoryController(): InventoryController {
  return new InventoryController();
}