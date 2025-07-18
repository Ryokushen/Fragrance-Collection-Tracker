import { Request, Response } from 'express';
import { ExternalFragranceService } from '../services/external-fragrance.service';

export class FragranceController {
  private externalFragranceService: ExternalFragranceService;

  constructor() {
    this.externalFragranceService = new ExternalFragranceService();
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