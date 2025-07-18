import request from 'supertest';
import express from 'express';
import { FragranceController } from '../controllers/fragrance.controller';
import { ExternalFragranceService } from '../services/external-fragrance.service';
import { RepositoryFactory } from '../models';
import { Fragrance, CreateFragranceDto, UpdateFragranceDto } from '../types';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { afterEach } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the external fragrance service and repository factory
jest.mock('../services/external-fragrance.service');
jest.mock('../models');

describe('FragranceController', () => {
  let app: express.Application;
  let controller: FragranceController;
  let mockExternalService: jest.Mocked<ExternalFragranceService>;
  let mockFragranceRepo: any;

  beforeEach(() => {
    // Create Express app
    app = express();
    app.use(express.json());

    // Create controller instance
    controller = new FragranceController();

    // Get the mocked service instance
    mockExternalService = (controller as any).externalFragranceService;

    // Mock repository
    mockFragranceRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    (RepositoryFactory.getFragranceRepository as jest.Mock).mockReturnValue(mockFragranceRepo);

    // Setup routes - external API routes first
    app.get('/api/fragrances/search', (req, res) => controller.searchFragrances(req, res));
    app.get('/api/fragrances/health', (req, res) => controller.getHealthStatus(req, res));
    app.delete('/api/fragrances/cache', (req, res) => controller.clearCache(req, res));
    
    // CRUD routes
    app.post('/api/fragrances', (req, res) => controller.createFragrance(req, res));
    app.get('/api/fragrances', (req, res) => controller.getFragrances(req, res));
    app.get('/api/fragrances/:id', (req, res) => controller.getFragranceById(req, res));
    app.put('/api/fragrances/:id', (req, res) => controller.updateFragrance(req, res));
    app.delete('/api/fragrances/:id', (req, res) => controller.deleteFragrance(req, res));
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

  describe('POST /api/fragrances', () => {
    const mockFragrance: Fragrance = {
      id: 'test-fragrance-id',
      userId: 'temp-user-id',
      name: 'Test Fragrance',
      brand: 'Test Brand',
      year: 2023,
      concentration: 'EDP',
      notes: {
        top: ['Bergamot', 'Lemon'],
        middle: ['Rose', 'Jasmine'],
        base: ['Musk', 'Sandalwood']
      },
      personalRating: 8,
      personalNotes: 'Great for evening wear',
      listType: 'owned',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create a new fragrance successfully', async () => {
      mockFragranceRepo.create.mockResolvedValue(mockFragrance);

      const createData: CreateFragranceDto = {
        name: 'Test Fragrance',
        brand: 'Test Brand',
        year: 2023,
        concentration: 'EDP',
        notes: {
          top: ['Bergamot', 'Lemon'],
          middle: ['Rose', 'Jasmine'],
          base: ['Musk', 'Sandalwood']
        },
        personalRating: 8,
        personalNotes: 'Great for evening wear',
        listType: 'owned'
      };

      const response = await request(app)
        .post('/api/fragrances')
        .send(createData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: {
          ...mockFragrance,
          createdAt: mockFragrance.createdAt.toISOString(),
          updatedAt: mockFragrance.updatedAt.toISOString()
        }
      });
      expect(mockFragranceRepo.create).toHaveBeenCalledWith('temp-user-id', createData);
    });

    it('should handle repository errors', async () => {
      mockFragranceRepo.create.mockRejectedValue(new Error('Database error'));

      const createData: CreateFragranceDto = {
        name: 'Test Fragrance',
        brand: 'Test Brand'
      };

      const response = await request(app)
        .post('/api/fragrances')
        .send(createData);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create fragrance'
        }
      });
    });
  });

  describe('GET /api/fragrances', () => {
    const mockFragrances: Fragrance[] = [
      {
        id: 'fragrance-1',
        userId: 'temp-user-id',
        name: 'Fragrance One',
        brand: 'Brand A',
        listType: 'owned',
        notes: { top: [], middle: [], base: [] },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'fragrance-2',
        userId: 'temp-user-id',
        name: 'Fragrance Two',
        brand: 'Brand B',
        listType: 'wishlist',
        notes: { top: [], middle: [], base: [] },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should return user fragrances with default pagination', async () => {
      const mockResult = {
        data: mockFragrances,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1
        }
      };

      mockFragranceRepo.findByUserId.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/fragrances');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockFragrances.map(f => ({
          ...f,
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString()
        })),
        pagination: mockResult.pagination
      });
      expect(mockFragranceRepo.findByUserId).toHaveBeenCalledWith(
        'temp-user-id',
        {},
        { field: 'createdAt', direction: 'desc' },
        { page: 1, limit: 20 }
      );
    });

    it('should apply filters and sorting', async () => {
      const mockResult = {
        data: [mockFragrances[0]],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      };

      mockFragranceRepo.findByUserId.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/fragrances')
        .query({
          brand: 'Brand A',
          listType: 'owned',
          minRating: '7',
          sortBy: 'name',
          sortOrder: 'asc',
          page: '1',
          limit: '10'
        });

      expect(response.status).toBe(200);
      expect(mockFragranceRepo.findByUserId).toHaveBeenCalledWith(
        'temp-user-id',
        {
          brand: 'Brand A',
          listType: 'owned',
          minRating: '7',
          maxRating: undefined,
          hasLowInventory: undefined,
          search: undefined
        },
        { field: 'name', direction: 'asc' },
        { page: '1', limit: '10' }
      );
    });

    it('should handle repository errors', async () => {
      mockFragranceRepo.findByUserId.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/fragrances');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch fragrances'
        }
      });
    });
  });

  describe('GET /api/fragrances/:id', () => {
    const mockFragrance: Fragrance = {
      id: 'test-fragrance-id',
      userId: 'temp-user-id',
      name: 'Test Fragrance',
      brand: 'Test Brand',
      listType: 'owned',
      notes: { top: [], middle: [], base: [] },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should return fragrance by id', async () => {
      mockFragranceRepo.findById.mockResolvedValue(mockFragrance);

      const response = await request(app)
        .get('/api/fragrances/test-fragrance-id');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          ...mockFragrance,
          createdAt: mockFragrance.createdAt.toISOString(),
          updatedAt: mockFragrance.updatedAt.toISOString()
        }
      });
      expect(mockFragranceRepo.findById).toHaveBeenCalledWith('test-fragrance-id');
    });

    it('should return 404 when fragrance not found', async () => {
      mockFragranceRepo.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/fragrances/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Fragrance not found'
        }
      });
    });

    it('should handle repository errors', async () => {
      mockFragranceRepo.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/fragrances/test-fragrance-id');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch fragrance'
        }
      });
    });
  });

  describe('PUT /api/fragrances/:id', () => {
    const mockFragrance: Fragrance = {
      id: 'test-fragrance-id',
      userId: 'temp-user-id',
      name: 'Updated Fragrance',
      brand: 'Updated Brand',
      personalRating: 9,
      listType: 'owned',
      notes: { top: [], middle: [], base: [] },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should update fragrance successfully', async () => {
      mockFragranceRepo.findById.mockResolvedValue(mockFragrance);
      mockFragranceRepo.update.mockResolvedValue(mockFragrance);

      const updateData: UpdateFragranceDto = {
        name: 'Updated Fragrance',
        personalRating: 9
      };

      const response = await request(app)
        .put('/api/fragrances/test-fragrance-id')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          ...mockFragrance,
          createdAt: mockFragrance.createdAt.toISOString(),
          updatedAt: mockFragrance.updatedAt.toISOString()
        }
      });
      expect(mockFragranceRepo.findById).toHaveBeenCalledWith('test-fragrance-id');
      expect(mockFragranceRepo.update).toHaveBeenCalledWith('test-fragrance-id', updateData);
    });

    it('should return 404 when fragrance not found', async () => {
      mockFragranceRepo.findById.mockResolvedValue(null);

      const updateData: UpdateFragranceDto = {
        name: 'Updated Fragrance'
      };

      const response = await request(app)
        .put('/api/fragrances/nonexistent-id')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Fragrance not found'
        }
      });
      expect(mockFragranceRepo.update).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      mockFragranceRepo.findById.mockRejectedValue(new Error('Database error'));

      const updateData: UpdateFragranceDto = {
        name: 'Updated Fragrance'
      };

      const response = await request(app)
        .put('/api/fragrances/test-fragrance-id')
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update fragrance'
        }
      });
    });
  });

  describe('DELETE /api/fragrances/:id', () => {
    const mockFragrance: Fragrance = {
      id: 'test-fragrance-id',
      userId: 'temp-user-id',
      name: 'Test Fragrance',
      brand: 'Test Brand',
      listType: 'owned',
      notes: { top: [], middle: [], base: [] },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should delete fragrance successfully', async () => {
      mockFragranceRepo.findById.mockResolvedValue(mockFragrance);
      mockFragranceRepo.delete.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/fragrances/test-fragrance-id');

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
      expect(mockFragranceRepo.findById).toHaveBeenCalledWith('test-fragrance-id');
      expect(mockFragranceRepo.delete).toHaveBeenCalledWith('test-fragrance-id');
    });

    it('should return 404 when fragrance not found', async () => {
      mockFragranceRepo.findById.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/fragrances/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Fragrance not found'
        }
      });
      expect(mockFragranceRepo.delete).not.toHaveBeenCalled();
    });

    it('should handle delete failure', async () => {
      mockFragranceRepo.findById.mockResolvedValue(mockFragrance);
      mockFragranceRepo.delete.mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/fragrances/test-fragrance-id');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete fragrance'
        }
      });
    });

    it('should handle repository errors', async () => {
      mockFragranceRepo.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/fragrances/test-fragrance-id');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete fragrance'
        }
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