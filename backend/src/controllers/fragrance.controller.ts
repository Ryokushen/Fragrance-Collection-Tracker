import { Request, Response } from 'express';
import { ExternalFragranceService } from '../services/external-fragrance.service';
import { RepositoryFactory } from '../models';
import { 
  CreateFragranceDto, 
  UpdateFragranceDto, 
  FragranceFilters, 
  FragranceSortOptions, 
  PaginationOptions 
} from '../types';

export class FragranceController {
  private externalFragranceService: ExternalFragranceService;

  constructor() {
    this.externalFragranceService = new ExternalFragranceService();
  }

  /**
   * Create a new fragrance in user's collection
   * POST /api/fragrances
   */
  async createFragrance(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Get userId from authentication middleware
      const userId = 'temp-user-id'; // Temporary until auth is implemented
      const fragranceData: CreateFragranceDto = req.body;

      // Convert date strings to Date objects if present
      if (fragranceData.purchaseInfo?.date) {
        fragranceData.purchaseInfo.date = new Date(fragranceData.purchaseInfo.date);
      }

      const fragranceRepo = RepositoryFactory.getFragranceRepository();
      const fragrance = await fragranceRepo.create(userId, fragranceData);

      res.status(201).json({
        success: true,
        data: fragrance,
      });
    } catch (error) {
      console.error('Error creating fragrance:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create fragrance',
        },
      });
    }
  }

  /**
   * Get user's fragrances with filtering and sorting
   * GET /api/fragrances
   */
  async getFragrances(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Get userId from authentication middleware
      const userId = 'temp-user-id'; // Temporary until auth is implemented
      
      const {
        brand,
        listType,
        minRating,
        maxRating,
        hasLowInventory,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20,
      } = req.query as any;

      const filters: FragranceFilters = {
        brand,
        listType,
        minRating,
        maxRating,
        hasLowInventory,
        search,
      };

      const sort: FragranceSortOptions = {
        field: sortBy,
        direction: sortOrder,
      };

      const pagination: PaginationOptions = {
        page,
        limit,
      };

      const fragranceRepo = RepositoryFactory.getFragranceRepository();
      const result = await fragranceRepo.findByUserId(userId, filters, sort, pagination);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Error fetching fragrances:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch fragrances',
        },
      });
    }
  }

  /**
   * Get a specific fragrance by ID
   * GET /api/fragrances/:id
   */
  async getFragranceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const fragranceRepo = RepositoryFactory.getFragranceRepository();
      const fragrance = await fragranceRepo.findById(id);

      if (!fragrance) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Fragrance not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: fragrance,
      });
    } catch (error) {
      console.error('Error fetching fragrance:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch fragrance',
        },
      });
    }
  }

  /**
   * Update a fragrance
   * PUT /api/fragrances/:id
   */
  async updateFragrance(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateFragranceDto = req.body;

      // Convert date strings to Date objects if present
      if (updateData.purchaseInfo?.date) {
        updateData.purchaseInfo.date = new Date(updateData.purchaseInfo.date);
      }

      const fragranceRepo = RepositoryFactory.getFragranceRepository();
      
      // Check if fragrance exists first
      const existingFragrance = await fragranceRepo.findById(id);
      if (!existingFragrance) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Fragrance not found',
          },
        });
        return;
      }

      const updatedFragrance = await fragranceRepo.update(id, updateData);

      res.json({
        success: true,
        data: updatedFragrance,
      });
    } catch (error) {
      console.error('Error updating fragrance:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update fragrance',
        },
      });
    }
  }

  /**
   * Update fragrance rating
   * PUT /api/fragrances/:id/rating
   */
  async updateFragranceRating(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { rating } = req.body;

      const fragranceRepo = RepositoryFactory.getFragranceRepository();
      
      // Check if fragrance exists first
      const existingFragrance = await fragranceRepo.findById(id);
      if (!existingFragrance) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Fragrance not found',
          },
        });
        return;
      }

      const updatedFragrance = await fragranceRepo.update(id, { personalRating: rating });

      res.json({
        success: true,
        data: updatedFragrance,
      });
    } catch (error) {
      console.error('Error updating fragrance rating:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update fragrance rating',
        },
      });
    }
  }

  /**
   * Delete a fragrance
   * DELETE /api/fragrances/:id
   */
  async deleteFragrance(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const fragranceRepo = RepositoryFactory.getFragranceRepository();
      
      // Check if fragrance exists first
      const existingFragrance = await fragranceRepo.findById(id);
      if (!existingFragrance) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Fragrance not found',
          },
        });
        return;
      }

      const deleted = await fragranceRepo.delete(id);
      
      if (!deleted) {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to delete fragrance',
          },
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting fragrance:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete fragrance',
        },
      });
    }
  }

  /**
   * Search for fragrances using external APIs
   * GET /api/fragrances/search?q=query
   */
  async searchFragrances(req: Request, res: Response): Promise<void> {
    try {
      const { q: query } = req.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          error: 'Query parameter "q" is required and must be a string',
        });
        return;
      }

      const fragrances = await this.externalFragranceService.searchFragrances(query);

      res.json({
        success: true,
        data: fragrances,
        count: fragrances.length,
      });
    } catch (error) {
      console.error('Error searching fragrances:', error);
      res.status(500).json({
        error: 'Internal server error while searching fragrances',
      });
    }
  }

  /**
   * Get health status of external fragrance services
   * GET /api/fragrances/health
   */
  async getHealthStatus(_req: Request, res: Response): Promise<void> {
    try {
      const health = await this.externalFragranceService.healthCheck();

      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      console.error('Error checking health status:', error);
      res.status(500).json({
        error: 'Internal server error while checking health status',
      });
    }
  }

  /**
   * Clear fragrance search cache
   * DELETE /api/fragrances/cache
   */
  async clearCache(req: Request, res: Response): Promise<void> {
    try {
      const { pattern } = req.query;

      await this.externalFragranceService.clearCache(
        pattern ? String(pattern) : undefined
      );

      res.json({
        success: true,
        message: 'Cache cleared successfully',
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({
        error: 'Internal server error while clearing cache',
      });
    }
  }

  /**
   * Cleanup method to be called when shutting down the application
   */
  async cleanup(): Promise<void> {
    await this.externalFragranceService.disconnect();
  }
}

// Factory function for creating controller instance
export function createFragranceController(): FragranceController {
  return new FragranceController();
}