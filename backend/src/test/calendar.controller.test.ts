// Unit tests for CalendarController

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { CalendarController } from '../controllers/calendar.controller';
import { CalendarService } from '../services/calendar.service';
import { InventoryService } from '../services/inventory.service';
import { 
  CreateDailyWearDto, 
  DailyWear, 
  WearHistory, 
  UsageStats 
} from '../types';

// Mock the services
jest.mock('../services/calendar.service');
jest.mock('../services/inventory.service');

describe('CalendarController', () => {
  let calendarController: CalendarController;
  let mockCalendarService: jest.Mocked<CalendarService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const testUserId = 'test-user-123';
  const testDate = new Date('2024-01-15');
  const testFragranceId = 'fragrance-123';

  const mockDailyWearData: CreateDailyWearDto = {
    date: testDate,
    weather: 'sunny',
    occasion: 'work',
    notes: 'Great day',
    entries: [
      {
        fragranceId: testFragranceId,
        sprayCount: 3,
        bodyParts: ['wrists', 'neck'],
        notes: 'Light application'
      }
    ]
  };

  const mockDailyWear: DailyWear = {
    id: 'daily-wear-123',
    userId: testUserId,
    date: testDate,
    weather: 'sunny',
    occasion: 'work',
    notes: 'Great day',
    entries: [
      {
        id: 'entry-123',
        dailyWearId: 'daily-wear-123',
        fragranceId: testFragranceId,
        sprayCount: 3,
        bodyParts: ['wrists', 'neck'],
        notes: 'Light application',
        createdAt: new Date()
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock service
    mockCalendarService = {
      recordDailyWear: jest.fn(),
      getDailyWear: jest.fn(),
      getWearHistory: jest.fn(),
      getUsageStatistics: jest.fn(),
      updateDailyWear: jest.fn(),
      deleteDailyWear: jest.fn()
    } as jest.Mocked<CalendarService>;

    // Mock the service creation
    (require('../services/calendar.service').createCalendarService as jest.Mock).mockReturnValue(mockCalendarService);
    (require('../services/inventory.service').createInventoryService as jest.Mock).mockReturnValue({} as InventoryService);

    // Create controller instance
    calendarController = new CalendarController();

    // Setup mock request and response
    mockRequest = {
      headers: { 'x-user-id': testUserId },
      body: {},
      params: {},
      query: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    } as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('recordDailyWear', () => {
    it('should successfully record daily wear', async () => {
      // Arrange
      mockRequest.body = mockDailyWearData;
      mockCalendarService.recordDailyWear.mockResolvedValue(mockDailyWear);

      // Act
      await calendarController.recordDailyWear(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockCalendarService.recordDailyWear).toHaveBeenCalledWith(
        testUserId,
        expect.any(Date),
        mockDailyWearData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockDailyWear
      });
    });

    it('should return 400 if date is missing', async () => {
      // Arrange
      mockRequest.body = { ...mockDailyWearData, date: undefined };

      // Act
      await calendarController.recordDailyWear(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Date is required',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should return 400 if entries are missing', async () => {
      // Arrange
      mockRequest.body = { ...mockDailyWearData, entries: [] };

      // Act
      await calendarController.recordDailyWear(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'At least one fragrance entry is required',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should return 400 for invalid date format', async () => {
      // Arrange
      mockRequest.body = { ...mockDailyWearData, date: 'invalid-date' };

      // Act
      await calendarController.recordDailyWear(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid date format',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should return 409 if daily wear already exists', async () => {
      // Arrange
      mockRequest.body = mockDailyWearData;
      mockCalendarService.recordDailyWear.mockRejectedValue(
        new Error('Daily wear entry already exists for this date')
      );

      // Act
      await calendarController.recordDailyWear(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Daily wear entry already exists for this date',
        code: 'CONFLICT'
      });
    });

    it('should return 500 for other errors', async () => {
      // Arrange
      mockRequest.body = mockDailyWearData;
      mockCalendarService.recordDailyWear.mockRejectedValue(new Error('Database error'));

      // Act
      await calendarController.recordDailyWear(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to record daily wear',
        code: 'INTERNAL_ERROR',
        details: 'Database error'
      });
    });
  });

  describe('getDailyWear', () => {
    it('should return daily wear for valid date', async () => {
      // Arrange
      mockRequest.params = { date: '2024-01-15' };
      mockCalendarService.getDailyWear.mockResolvedValue(mockDailyWear);

      // Act
      await calendarController.getDailyWear(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockCalendarService.getDailyWear).toHaveBeenCalledWith(
        testUserId,
        expect.any(Date)
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockDailyWear
      });
    });

    it('should return 404 if no daily wear found', async () => {
      // Arrange
      mockRequest.params = { date: '2024-01-15' };
      mockCalendarService.getDailyWear.mockResolvedValue(null);

      // Act
      await calendarController.getDailyWear(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'No daily wear found for this date',
        code: 'NOT_FOUND'
      });
    });

    it('should return 400 for invalid date format', async () => {
      // Arrange
      mockRequest.params = { date: 'invalid-date' };

      // Act
      await calendarController.getDailyWear(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid date format',
        code: 'VALIDATION_ERROR'
      });
    });
  });

  describe('getWearHistory', () => {
    it('should return wear history for valid date range', async () => {
      // Arrange
      const mockWearHistory: WearHistory[] = [
        {
          date: testDate,
          fragrances: [
            {
              fragranceId: testFragranceId,
              name: 'Test Fragrance',
              brand: 'Test Brand',
              sprayCount: 3
            }
          ]
        }
      ];

      mockRequest.query = {
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z'
      };
      mockCalendarService.getWearHistory.mockResolvedValue(mockWearHistory);

      // Act
      await calendarController.getWearHistory(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockCalendarService.getWearHistory).toHaveBeenCalledWith(
        testUserId,
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date)
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockWearHistory
      });
    });

    it('should return 400 if date parameters are missing', async () => {
      // Arrange
      mockRequest.query = { startDate: '2024-01-01T00:00:00.000Z' }; // Missing endDate

      // Act
      await calendarController.getWearHistory(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Both startDate and endDate are required',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should return 400 if start date is after end date', async () => {
      // Arrange
      mockRequest.query = {
        startDate: '2024-01-31T00:00:00.000Z',
        endDate: '2024-01-01T00:00:00.000Z'
      };

      // Act
      await calendarController.getWearHistory(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Start date must be before end date',
        code: 'VALIDATION_ERROR'
      });
    });
  });

  describe('getUsageStatistics', () => {
    it('should return usage statistics', async () => {
      // Arrange
      const mockStats: UsageStats = {
        totalWears: 10,
        averageWearsPerMonth: 2.5,
        lastWornDate: testDate,
        favoriteFragrances: [
          {
            fragranceId: testFragranceId,
            name: 'Test Fragrance',
            brand: 'Test Brand',
            wearCount: 5
          }
        ],
        wearsByMonth: [
          { month: '2024-01', count: 10 }
        ]
      };

      mockCalendarService.getUsageStatistics.mockResolvedValue(mockStats);

      // Act
      await calendarController.getUsageStatistics(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockCalendarService.getUsageStatistics).toHaveBeenCalledWith(
        testUserId,
        undefined
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('should pass fragrance ID filter when provided', async () => {
      // Arrange
      mockRequest.query = { fragranceId: testFragranceId };
      mockCalendarService.getUsageStatistics.mockResolvedValue({} as UsageStats);

      // Act
      await calendarController.getUsageStatistics(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockCalendarService.getUsageStatistics).toHaveBeenCalledWith(
        testUserId,
        testFragranceId
      );
    });
  });

  describe('updateDailyWear', () => {
    it('should update daily wear successfully', async () => {
      // Arrange
      const updateData = { weather: 'rainy', notes: 'Updated notes' };
      mockRequest.params = { id: 'daily-wear-123' };
      mockRequest.body = updateData;
      mockCalendarService.updateDailyWear.mockResolvedValue({
        ...mockDailyWear,
        ...updateData
      });

      // Act
      await calendarController.updateDailyWear(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockCalendarService.updateDailyWear).toHaveBeenCalledWith(
        'daily-wear-123',
        updateData
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining(updateData)
      });
    });

    it('should return 404 if daily wear not found', async () => {
      // Arrange
      mockRequest.params = { id: 'nonexistent-id' };
      mockRequest.body = { weather: 'rainy' };
      mockCalendarService.updateDailyWear.mockResolvedValue(null);

      // Act
      await calendarController.updateDailyWear(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Daily wear not found',
        code: 'NOT_FOUND'
      });
    });
  });

  describe('deleteDailyWear', () => {
    it('should delete daily wear successfully', async () => {
      // Arrange
      mockRequest.params = { id: 'daily-wear-123' };
      mockCalendarService.deleteDailyWear.mockResolvedValue(true);

      // Act
      await calendarController.deleteDailyWear(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockCalendarService.deleteDailyWear).toHaveBeenCalledWith('daily-wear-123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Daily wear deleted successfully'
      });
    });

    it('should return 404 if daily wear not found', async () => {
      // Arrange
      mockRequest.params = { id: 'nonexistent-id' };
      mockCalendarService.deleteDailyWear.mockResolvedValue(false);

      // Act
      await calendarController.deleteDailyWear(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Daily wear not found',
        code: 'NOT_FOUND'
      });
    });
  });
});