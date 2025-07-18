import request from 'supertest';
import express from 'express';
import { FragranceController } from '../controllers/fragrance.controller';
import { RepositoryFactory } from '../models';
import { 
  validateBody, 
  validateParams,
  updateRatingSchema,
  uuidParamSchema
} from '../middleware/validation';
import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';

// Mock the repository factory
jest.mock('../models');

describe('Rating and Notes Integration Tests', () => {
  let app: express.Application;
  let controller: FragranceController;
  let mockFragranceRepo: any;

  beforeEach(() => {
    // Create Express app with validation middleware
    app = express();
    app.use(express.json());

    // Create controller instance
    controller = new FragranceController();

    // Mock repository
    mockFragranceRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    (RepositoryFactory.getFragranceRepository as jest.Mock).mockReturnValue(mockFragranceRepo);

    // Setup routes with validation middleware
    app.put('/api/fragrances/:id/rating', 
      validateParams(uuidParamSchema),
      validateBody(updateRatingSchema),
      (req, res) => controller.updateFragranceRating(req, res)
    );
  });

  afterEach(async () => {
    await controller.cleanup();
    jest.clearAllMocks();
  });

  describe('PUT /api/fragrances/:id/rating - Validation Tests', () => {
    const mockFragrance = {
      id: 'test-fragrance-id',
      userId: 'temp-user-id',
      name: 'Test Fragrance',
      brand: 'Test Brand',
      personalRating: 7,
      listType: 'owned',
      notes: { top: [], middle: [], base: [] },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should accept valid rating (1-10)', async () => {
      mockFragranceRepo.findById.mockResolvedValue(mockFragrance);
      mockFragranceRepo.update.mockResolvedValue({ ...mockFragrance, personalRating: 8 });

      const response = await request(app)
        .put('/api/fragrances/550e8400-e29b-41d4-a716-446655440000/rating')
        .send({ rating: 8 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockFragranceRepo.update).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000', 
        { personalRating: 8 }
      );
    });

    it('should reject rating below 1', async () => {
      const response = await request(app)
        .put('/api/fragrances/550e8400-e29b-41d4-a716-446655440000/rating')
        .send({ rating: 0 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockFragranceRepo.update).not.toHaveBeenCalled();
    });

    it('should reject rating above 10', async () => {
      const response = await request(app)
        .put('/api/fragrances/550e8400-e29b-41d4-a716-446655440000/rating')
        .send({ rating: 11 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockFragranceRepo.update).not.toHaveBeenCalled();
    });

    it('should reject non-integer rating', async () => {
      const response = await request(app)
        .put('/api/fragrances/550e8400-e29b-41d4-a716-446655440000/rating')
        .send({ rating: 7.5 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockFragranceRepo.update).not.toHaveBeenCalled();
    });

    it('should reject missing rating field', async () => {
      const response = await request(app)
        .put('/api/fragrances/550e8400-e29b-41d4-a716-446655440000/rating')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockFragranceRepo.update).not.toHaveBeenCalled();
    });

    it('should reject invalid UUID format', async () => {
      const response = await request(app)
        .put('/api/fragrances/invalid-uuid/rating')
        .send({ rating: 8 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockFragranceRepo.update).not.toHaveBeenCalled();
    });

    it('should reject rating as string', async () => {
      const response = await request(app)
        .put('/api/fragrances/550e8400-e29b-41d4-a716-446655440000/rating')
        .send({ rating: "9" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockFragranceRepo.update).not.toHaveBeenCalled();
    });

    it('should accept minimum valid rating (1)', async () => {
      mockFragranceRepo.findById.mockResolvedValue(mockFragrance);
      mockFragranceRepo.update.mockResolvedValue({ ...mockFragrance, personalRating: 1 });

      const response = await request(app)
        .put('/api/fragrances/550e8400-e29b-41d4-a716-446655440000/rating')
        .send({ rating: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockFragranceRepo.update).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000', 
        { personalRating: 1 }
      );
    });

    it('should accept maximum valid rating (10)', async () => {
      mockFragranceRepo.findById.mockResolvedValue(mockFragrance);
      mockFragranceRepo.update.mockResolvedValue({ ...mockFragrance, personalRating: 10 });

      const response = await request(app)
        .put('/api/fragrances/550e8400-e29b-41d4-a716-446655440000/rating')
        .send({ rating: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockFragranceRepo.update).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000', 
        { personalRating: 10 }
      );
    });
  });
});