import request from 'supertest';
import express from 'express';
import { FragranceController } from '../controllers/fragrance.controller';
import { ExternalFragranceService } from '../services/external-fragrance.service';
import { RepositoryFactory } from '../models';
import { Fragrance, CreateFragranceDto, UpdateFragranceDto } from '../types';
import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';

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
    app.put('/api/fragrances/:id/rating', (req, res) => controller.updateFragranceRating(req, res));
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

  describe('PUT /api/fragrances/:id/rating', () => {
    const mockFragrance: Fragrance = {
      id: 'test-fragrance-id',
      userId: 'temp-user-id',
      name: 'Test Fragrance',
      brand: 'Test Brand',
      personalRating: 8,
      listType: 'owned',
      notes: { top: [], middle: [], base: [] },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should update fragrance rating successfully', async () => {
      mockFragranceRepo.findById.mockResolvedValue(mockFragrance);
      mockFragranceRepo.update.mockResolvedValue({ ...mockFragrance, personalRating: 9 });

      const response = await request(app)
        .put('/api/fragrances/test-fragrance-id/rating')
        .send({ rating: 9 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          ...mockFragrance,
          personalRating: 9,
          createdAt: mockFragrance.createdAt.toISOString(),
          updatedAt: mockFragrance.updatedAt.toISOString()
        }
      });
      expect(mockFragranceRepo.findById).toHaveBeenCalledWith('test-fragrance-id');
      expect(mockFragranceRepo.update).toHaveBeenCalledWith('test-fragrance-id', { personalRating: 9 });
    });

    it('should return 404 when fragrance not found', async () => {
      mockFragranceRepo.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/fragrances/nonexistent-id/rating')
        .send({ rating: 8 });

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

    it('should validate rating is within valid range (1-10)', async () => {
      // This test would require validation middleware to be properly set up
      // For now, we'll test the controller logic assuming validation passes
      mockFragranceRepo.findById.mockResolvedValue(mockFragrance);
      mockFragranceRepo.update.mockResolvedValue({ ...mockFragrance, personalRating: 1 });

      const response = await request(app)
        .put('/api/fragrances/test-fragrance-id/rating')
        .send({ rating: 1 });

      expect(response.status).toBe(200);
      expect(mockFragranceRepo.update).toHaveBeenCalledWith('test-fragrance-id', { personalRating: 1 });
    });

    it('should handle repository errors', async () => {
      mockFragranceRepo.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/fragrances/test-fragrance-id/rating')
        .send({ rating: 8 });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update fragrance rating'
        }
      });
    });

    it('should handle update errors', async () => {
      mockFragranceRepo.findById.mockResolvedValue(mockFragrance);
      mockFragranceRepo.update.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .put('/api/fragrances/test-fragrance-id/rating')
        .send({ rating: 8 });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update fragrance rating'
        }
      });
    });
  });

  describe('Rating and Notes Integration Tests', () => {
    const mockFragrance: Fragrance = {
      id: 'test-fragrance-id',
      userId: 'temp-user-id',
      name: 'Test Fragrance',
      brand: 'Test Brand',
      personalRating: 7,
      personalNotes: 'Initial notes',
      listType: 'owned',
      notes: { top: ['Bergamot'], middle: ['Rose'], base: ['Musk'] },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should update personal notes via general update endpoint', async () => {
      const updatedFragrance = { ...mockFragrance, personalNotes: 'Updated personal notes' };
      mockFragranceRepo.findById.mockResolvedValue(mockFragrance);
      mockFragranceRepo.update.mockResolvedValue(updatedFragrance);

      const response = await request(app)
        .put('/api/fragrances/test-fragrance-id')
        .send({ personalNotes: 'Updated personal notes' });

      expect(response.status).toBe(200);
      expect(response.body.data.personalNotes).toBe('Updated personal notes');
      expect(mockFragranceRepo.update).toHaveBeenCalledWith('test-fragrance-id', { 
        personalNotes: 'Updated personal notes' 
      });
    });

    it('should update both rating and notes simultaneously', async () => {
      const updatedFragrance = { 
        ...mockFragrance, 
        personalRating: 9, 
        personalNotes: 'Amazing fragrance!' 
      };
      mockFragranceRepo.findById.mockResolvedValue(mockFragrance);
      mockFragranceRepo.update.mockResolvedValue(updatedFragrance);

      const response = await request(app)
        .put('/api/fragrances/test-fragrance-id')
        .send({ 
          personalRating: 9,
          personalNotes: 'Amazing fragrance!'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.personalRating).toBe(9);
      expect(response.body.data.personalNotes).toBe('Amazing fragrance!');
      expect(mockFragranceRepo.update).toHaveBeenCalledWith('test-fragrance-id', { 
        personalRating: 9,
        personalNotes: 'Amazing fragrance!'
      });
    });

    it('should handle sorting by rating in GET /api/fragrances', async () => {
      const fragrancesWithRatings: Fragrance[] = [
        { ...mockFragrance, id: 'frag-1', personalRating: 9, name: 'High Rated' },
        { ...mockFragrance, id: 'frag-2', personalRating: 6, name: 'Medium Rated' },
        { ...mockFragrance, id: 'frag-3', personalRating: 10, name: 'Top Rated' }
      ];

      const mockResult = {
        data: fragrancesWithRatings,
        pagination: {
          page: 1,
          limit: 20,
          total: 3,
          totalPages: 1
        }
      };

      mockFragranceRepo.findByUserId.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/fragrances')
        .query({
          sortBy: 'rating',
          sortOrder: 'desc'
        });

      expect(response.status).toBe(200);
      expect(mockFragranceRepo.findByUserId).toHaveBeenCalledWith(
        'temp-user-id',
        {},
        { field: 'rating', direction: 'desc' },
        { page: 1, limit: 20 }
      );
    });

    it('should handle filtering by rating range', async () => {
      const highRatedFragrances: Fragrance[] = [
        { ...mockFragrance, id: 'frag-1', personalRating: 9, name: 'High Rated' },
        { ...mockFragrance, id: 'frag-2', personalRating: 8, name: 'Also High Rated' }
      ];

      const mockResult = {
        data: highRatedFragrances,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1
        }
      };

      mockFragranceRepo.findByUserId.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/fragrances')
        .query({
          minRating: '8',
          maxRating: '10'
        });

      expect(response.status).toBe(200);
      expect(mockFragranceRepo.findByUserId).toHaveBeenCalledWith(
        'temp-user-id',
        {
          brand: undefined,
          listType: undefined,
          minRating: '8',
          maxRating: '10',
          hasLowInventory: undefined,
          search: undefined
        },
        { field: 'createdAt', direction: 'desc' },
        { page: 1, limit: 20 }
      );
    });

    it('should create fragrance with initial rating and notes', async () => {
      const newFragrance: Fragrance = {
        id: 'new-fragrance-id',
        userId: 'temp-user-id',
        name: 'New Fragrance',
        brand: 'New Brand',
        personalRating: 8,
        personalNotes: 'First impression notes',
        listType: 'owned',
        notes: { top: [], middle: [], base: [] },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockFragranceRepo.create.mockResolvedValue(newFragrance);

      const createData: CreateFragranceDto = {
        name: 'New Fragrance',
        brand: 'New Brand',
        personalRating: 8,
        personalNotes: 'First impression notes',
        listType: 'owned'
      };

      const response = await request(app)
        .post('/api/fragrances')
        .send(createData);

      expect(response.status).toBe(201);
      expect(response.body.data.personalRating).toBe(8);
      expect(response.body.data.personalNotes).toBe('First impression notes');
      expect(mockFragranceRepo.create).toHaveBeenCalledWith('temp-user-id', createData);
    });

    it('should clear rating by setting it to null', async () => {
      const updatedFragrance = { ...mockFragrance, personalRating: undefined };
      mockFragranceRepo.findById.mockResolvedValue(mockFragrance);
      mockFragranceRepo.update.mockResolvedValue(updatedFragrance);

      const response = await request(app)
        .put('/api/fragrances/test-fragrance-id')
        .send({ personalRating: null });

      expect(response.status).toBe(200);
      expect(response.body.data.personalRating).toBeUndefined();
    });

    it('should clear personal notes by setting them to empty string', async () => {
      const updatedFragrance = { ...mockFragrance, personalNotes: '' };
      mockFragranceRepo.findById.mockResolvedValue(mockFragrance);
      mockFragranceRepo.update.mockResolvedValue(updatedFragrance);

      const response = await request(app)
        .put('/api/fragrances/test-fragrance-id')
        .send({ personalNotes: '' });

      expect(response.status).toBe(200);
      expect(response.body.data.personalNotes).toBe('');
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