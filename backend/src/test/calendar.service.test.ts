// Unit tests for CalendarService

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CalendarServiceImpl } from '../services/calendar.service';
import { InventoryService } from '../services/inventory.service';
import { RepositoryFactory } from '../models';
import { 
  CreateDailyWearDto, 
  DailyWear, 
  DateRange, 
  WearHistory,
  Fragrance
} from '../types';

// Mock the repository factory
jest.mock('../models', () => ({
  RepositoryFactory: {
    getDailyWearRepository: jest.fn(),
    getUsageEntryRepository: jest.fn(),
    getFragranceRepository: jest.fn()
  }
}));

// Mock the inventory service
const mockInventoryService = {
  updateInventoryFromUsage: jest.fn(),
  updateInventory: jest.fn(),
  getInventoryStatus: jest.fn(),
  getLowInventoryAlerts: jest.fn(),
  calculateRemainingDays: jest.fn(),
  createInventory: jest.fn(),
  updateInventoryRecord: jest.fn(),
  getInventory: jest.fn(),
  recalculateAllEstimates: jest.fn()
} as jest.Mocked<InventoryService>;

describe('CalendarService', () => {
  let calendarService: CalendarServiceImpl;
  let mockDailyWearRepo: any;
  let mockUsageEntryRepo: any;
  let mockFragranceRepo: any;

  const testUserId = 'test-user-123';
  const testDate = new Date('2024-01-15');
  const testFragranceId = 'fragrance-123';

  const mockFragrance: Fragrance = {
    id: testFragranceId,
    userId: testUserId,
    name: 'Test Fragrance',
    brand: 'Test Brand',
    notes: { top: [], middle: [], base: [] },
    listType: 'owned',
    createdAt: new Date(),
    updatedAt: new Date()
  };

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

    // Setup mock repositories
    mockDailyWearRepo = {
      create: jest.fn(),
      findByUserAndDate: jest.fn(),
      findByUserAndDateRange: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn()
    };

    mockUsageEntryRepo = {
      create: jest.fn()
    };

    mockFragranceRepo = {
      findById: jest.fn()
    };

    // Mock repository factory methods
    (RepositoryFactory.getDailyWearRepository as jest.Mock).mockReturnValue(mockDailyWearRepo);
    (RepositoryFactory.getUsageEntryRepository as jest.Mock).mockReturnValue(mockUsageEntryRepo);
    (RepositoryFactory.getFragranceRepository as jest.Mock).mockReturnValue(mockFragranceRepo);

    // Create service instance
    calendarService = new CalendarServiceImpl(mockInventoryService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('recordDailyWear', () => {
    it('should successfully record daily wear', async () => {
      // Arrange
      mockDailyWearRepo.findByUserAndDate.mockResolvedValue(null);
      mockDailyWearRepo.create.mockResolvedValue(mockDailyWear);
      mockUsageEntryRepo.create.mockResolvedValue({});
      mockInventoryService.updateInventoryFromUsage.mockResolvedValue({} as any);

      // Act
      const result = await calendarService.recordDailyWear(testUserId, testDate, mockDailyWearData);

      // Assert
      expect(result).toEqual(mockDailyWear);
      expect(mockDailyWearRepo.findByUserAndDate).toHaveBeenCalledWith(testUserId, testDate);
      expect(mockDailyWearRepo.create).toHaveBeenCalledWith(testUserId, mockDailyWearData);
      expect(mockUsageEntryRepo.create).toHaveBeenCalledWith({
        fragranceId: testFragranceId,
        date: testDate,
        sprayCount: 3,
        estimatedUsage: expect.closeTo(0.3, 5), // 3 sprays * 0.1ml per spray
        notes: 'Light application'
      });
      expect(mockInventoryService.updateInventoryFromUsage).toHaveBeenCalled();
    });

    it('should throw error if daily wear already exists', async () => {
      // Arrange
      mockDailyWearRepo.findByUserAndDate.mockResolvedValue(mockDailyWear);

      // Act & Assert
      await expect(
        calendarService.recordDailyWear(testUserId, testDate, mockDailyWearData)
      ).rejects.toThrow('Daily wear entry already exists for this date');
    });

    it('should handle entries without spray count', async () => {
      // Arrange
      const dataWithoutSprayCount: CreateDailyWearDto = {
        ...mockDailyWearData,
        entries: [
          {
            fragranceId: testFragranceId,
            notes: 'No spray count'
          }
        ]
      };

      mockDailyWearRepo.findByUserAndDate.mockResolvedValue(null);
      mockDailyWearRepo.create.mockResolvedValue(mockDailyWear);

      // Act
      await calendarService.recordDailyWear(testUserId, testDate, dataWithoutSprayCount);

      // Assert
      expect(mockUsageEntryRepo.create).not.toHaveBeenCalled();
      expect(mockInventoryService.updateInventoryFromUsage).not.toHaveBeenCalled();
    });

    it('should continue if inventory update fails', async () => {
      // Arrange
      mockDailyWearRepo.findByUserAndDate.mockResolvedValue(null);
      mockDailyWearRepo.create.mockResolvedValue(mockDailyWear);
      mockUsageEntryRepo.create.mockResolvedValue({});
      mockInventoryService.updateInventoryFromUsage.mockRejectedValue(new Error('Inventory error'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      const result = await calendarService.recordDailyWear(testUserId, testDate, mockDailyWearData);

      // Assert
      expect(result).toEqual(mockDailyWear);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update inventory'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getDailyWear', () => {
    it('should return daily wear for a specific date', async () => {
      // Arrange
      mockDailyWearRepo.findByUserAndDate.mockResolvedValue(mockDailyWear);

      // Act
      const result = await calendarService.getDailyWear(testUserId, testDate);

      // Assert
      expect(result).toEqual(mockDailyWear);
      expect(mockDailyWearRepo.findByUserAndDate).toHaveBeenCalledWith(testUserId, testDate);
    });

    it('should return null if no daily wear found', async () => {
      // Arrange
      mockDailyWearRepo.findByUserAndDate.mockResolvedValue(null);

      // Act
      const result = await calendarService.getDailyWear(testUserId, testDate);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getWearHistory', () => {
    it('should return wear history for date range', async () => {
      // Arrange
      const dateRange: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };

      const expectedWearHistory: WearHistory[] = [
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

      mockDailyWearRepo.findByUserAndDateRange.mockResolvedValue([mockDailyWear]);
      mockFragranceRepo.findById.mockResolvedValue(mockFragrance);

      // Act
      const result = await calendarService.getWearHistory(testUserId, dateRange);

      // Assert
      expect(result).toEqual(expectedWearHistory);
      expect(mockDailyWearRepo.findByUserAndDateRange).toHaveBeenCalledWith(
        testUserId,
        dateRange.startDate,
        dateRange.endDate
      );
      expect(mockFragranceRepo.findById).toHaveBeenCalledWith(testFragranceId);
    });

    it('should handle missing fragrances gracefully', async () => {
      // Arrange
      const dateRange: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };

      mockDailyWearRepo.findByUserAndDateRange.mockResolvedValue([mockDailyWear]);
      mockFragranceRepo.findById.mockResolvedValue(null);

      // Act
      const result = await calendarService.getWearHistory(testUserId, dateRange);

      // Assert
      expect(result).toEqual([
        {
          date: testDate,
          fragrances: []
        }
      ]);
    });
  });

  describe('getUsageStatistics', () => {
    it('should return usage statistics for user', async () => {
      // Arrange
      const mockDailyWears = [mockDailyWear];
      mockDailyWearRepo.findByUserAndDateRange.mockResolvedValue(mockDailyWears);
      mockFragranceRepo.findById.mockResolvedValue(mockFragrance);

      // Act
      const result = await calendarService.getUsageStatistics(testUserId);

      // Assert
      expect(result.totalWears).toBe(1);
      expect(result.lastWornDate).toEqual(testDate);
      expect(result.favoriteFragrances).toHaveLength(1);
      expect(result.favoriteFragrances[0]).toEqual({
        fragranceId: testFragranceId,
        name: 'Test Fragrance',
        brand: 'Test Brand',
        wearCount: 1
      });
      expect(result.wearsByMonth).toHaveLength(1);
    });

    it('should filter by specific fragrance when provided', async () => {
      // Arrange
      const otherFragranceId = 'other-fragrance-123';
      const dailyWearWithMultipleFragrances: DailyWear = {
        ...mockDailyWear,
        entries: [
          ...mockDailyWear.entries,
          {
            id: 'entry-456',
            dailyWearId: 'daily-wear-123',
            fragranceId: otherFragranceId,
            sprayCount: 2,
            createdAt: new Date()
          }
        ]
      };

      mockDailyWearRepo.findByUserAndDateRange.mockResolvedValue([dailyWearWithMultipleFragrances]);
      mockFragranceRepo.findById.mockResolvedValue(mockFragrance);

      // Act
      const result = await calendarService.getUsageStatistics(testUserId, testFragranceId);

      // Assert
      expect(result.totalWears).toBe(1); // Only the specified fragrance
      expect(result.favoriteFragrances).toHaveLength(1);
      expect(result.favoriteFragrances[0].fragranceId).toBe(testFragranceId);
    });

    it('should handle empty wear history', async () => {
      // Arrange
      mockDailyWearRepo.findByUserAndDateRange.mockResolvedValue([]);

      // Act
      const result = await calendarService.getUsageStatistics(testUserId);

      // Assert
      expect(result.totalWears).toBe(0);
      expect(result.lastWornDate).toBeUndefined();
      expect(result.favoriteFragrances).toHaveLength(0);
      expect(result.wearsByMonth).toHaveLength(0);
    });
  });

  describe('updateDailyWear', () => {
    it('should update daily wear by recreating record', async () => {
      // Arrange
      const updateData: Partial<CreateDailyWearDto> = {
        weather: 'rainy',
        notes: 'Updated notes'
      };

      mockDailyWearRepo.findById.mockResolvedValue(mockDailyWear);
      mockDailyWearRepo.delete.mockResolvedValue(true);
      mockDailyWearRepo.findByUserAndDate.mockResolvedValue(null);
      mockDailyWearRepo.create.mockResolvedValue({
        ...mockDailyWear,
        weather: 'rainy',
        notes: 'Updated notes'
      });
      mockUsageEntryRepo.create.mockResolvedValue({});

      // Act
      const result = await calendarService.updateDailyWear('daily-wear-123', updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result?.weather).toBe('rainy');
      expect(result?.notes).toBe('Updated notes');
      expect(mockDailyWearRepo.delete).toHaveBeenCalledWith('daily-wear-123');
    });

    it('should return null if daily wear not found', async () => {
      // Arrange
      mockDailyWearRepo.findById.mockResolvedValue(null);

      // Act
      const result = await calendarService.updateDailyWear('nonexistent-id', {});

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('deleteDailyWear', () => {
    it('should delete daily wear successfully', async () => {
      // Arrange
      mockDailyWearRepo.delete.mockResolvedValue(true);

      // Act
      const result = await calendarService.deleteDailyWear('daily-wear-123');

      // Assert
      expect(result).toBe(true);
      expect(mockDailyWearRepo.delete).toHaveBeenCalledWith('daily-wear-123');
    });

    it('should return false if daily wear not found', async () => {
      // Arrange
      mockDailyWearRepo.delete.mockResolvedValue(false);

      // Act
      const result = await calendarService.deleteDailyWear('nonexistent-id');

      // Assert
      expect(result).toBe(false);
    });
  });
});