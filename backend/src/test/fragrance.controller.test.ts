import request from 'supertest';
import express from 'express';
import { FragranceController } from '../controllers/fragrance.controller';
import { ExternalFragranceService } from '../services/external-fragrance.service';

// Mock the external fragrance service
jest.mock('../services/external-fragrance.service');

describe('FragranceController', () => {
  let app: express.Application;
  let controller: FragranceController;
  let mockExternalService: jest.Mocked<ExternalFragranceService>;

  beforeEach(() => {
    // Create Express app
    app = express();
    app.use(express.json());

    // Create controller instance
    controller = new FragranceController();

    // Get the mocked service instance
    mockExternalService = (controller as any).externalFragranceService;

    // Setup routes
    app.get('/api/fragrances/search', (req, res) => controller.searchFragrances(req, res));
    app.get('/api/fragrances/health', (req, res) => controller.getHealthStatus(req, res));
    app.delete('/api/fragrances/cache', (req, res) => controller.clearCache(req, res));
  });

  afterEach(async () => {
    await controller.cleanup();
    jest.clearAllMocks();
  });

  describe('GET /api/fragrances/search', () => {
    it('should return search results for valid query', async () => {
      const mockFragrances = [
        {
          id: 'test-1',
          name: 'Test Fragrance',
          brand: 'Test Brand',
          notes: { top: ['Bergamot'], middle: ['Rose'], base: ['Musk'] },
          source: 'fragrantica' as const,
        },
      ];

      mockExternalService.searchFragrances.mockResolvedValue(mockFragrances);

      const response = await request(app)
        .get('/api/fragrances/search')
        .query({ q: 'test' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockFragrances,
        count: 1,
      });
      expect(mockExternalService.searchFragrances).toHaveBeenCalledWith('test');
    });

    it('should return 400 for missing query parameter', async () => {
      const response = await request(app)
        .get('/api/fragrances/search');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Query parameter "q" is required and must be a string',
      });
      expect(mockExternalService.searchFragrances).not.toHaveBeenCalled();
    });

    it('should handle numeric query parameter (converted to string)', async () => {
      mockExternalService.searchFragrances.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/fragrances/search')
        .query({ q: 123 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: [],
        count: 0,
      });
      expect(mockExternalService.searchFragrances).toHaveBeenCalledWith('123');
    });

    it('should return 500 when service throws error', async () => {
      mockExternalService.searchFragrances.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/api/fragrances/search')
        .query({ q: 'test' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal server error while searching fragrances',
      });
    });

    it('should return empty array for no results', async () => {
      mockExternalService.searchFragrances.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/fragrances/search')
        .query({ q: 'nonexistent' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: [],
        count: 0,
      });
    });
  });

  describe('GET /api/fragrances/health', () => {
    it('should return health status', async () => {
      const mockHealth = {
        redis: true,
        externalApis: {
          fragrantica: true,
          parfumo: false,
        },
      };

      mockExternalService.healthCheck.mockResolvedValue(mockHealth);

      const response = await request(app)
        .get('/api/fragrances/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockHealth,
      });
      expect(mockExternalService.healthCheck).toHaveBeenCalled();
    });

    it('should return 500 when health check fails', async () => {
      mockExternalService.healthCheck.mockRejectedValue(new Error('Health check failed'));

      const response = await request(app)
        .get('/api/fragrances/health');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal server error while checking health status',
      });
    });
  });

  describe('DELETE /api/fragrances/cache', () => {
    it('should clear cache successfully', async () => {
      mockExternalService.clearCache.mockResolvedValue();

      const response = await request(app)
        .delete('/api/fragrances/cache');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Cache cleared successfully',
      });
      expect(mockExternalService.clearCache).toHaveBeenCalledWith(undefined);
    });

    it('should clear cache with pattern', async () => {
      mockExternalService.clearCache.mockResolvedValue();

      const response = await request(app)
        .delete('/api/fragrances/cache')
        .query({ pattern: 'fragrance_search:*' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Cache cleared successfully',
      });
      expect(mockExternalService.clearCache).toHaveBeenCalledWith('fragrance_search:*');
    });

    it('should return 500 when cache clear fails', async () => {
      mockExternalService.clearCache.mockRejectedValue(new Error('Cache clear failed'));

      const response = await request(app)
        .delete('/api/fragrances/cache');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal server error while clearing cache',
      });
    });
  });

  describe('cleanup', () => {
    it('should call disconnect on external service', async () => {
      mockExternalService.disconnect.mockResolvedValue();

      await controller.cleanup();

      expect(mockExternalService.disconnect).toHaveBeenCalled();
    });
  });
});