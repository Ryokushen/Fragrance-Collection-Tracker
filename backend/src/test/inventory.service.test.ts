import { InventoryService } from '../services/inventory.service';
import { RepositoryFactory } from '../models';
import { 
  Inventory, 
  UsageEntry, 
  CreateInventoryDto,
  Fragrance 
} from '../types';

// Mock the repository factory
jest.mock('../models', () => ({
  RepositoryFactory: {
    getInventoryRepository: jest.fn(),
    getUsageEntryRepository: jest.fn(),
    getFragranceRepository: jest.fn(),
  },
}));

describe('InventoryService', () => {
  let inventoryService: InventoryService;
  let mockInventoryRepo: any;
  let mockUsageRepo: any;
  let mockFragranceRepo: any;

  beforeEach(() => {
    inventoryService = new InventoryService();
    mockInventoryRepo = {
      findByFragranceId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    mockUsageRepo = {
      create: jest.fn(),
      findByFragranceId: jest.fn(),
      findByFragranceAndDateRange: jest.fn(),
    };
    mockFragranceRepo = {
      findByUserId: jest.fn(),
    };

    (RepositoryFactory.getInventoryRepository as jest.Mock).mockReturnValue(mockInventoryRepo);
    (RepositoryFactory.getUsageEntryRepository as jest.Mock).mockReturnValue(mockUsageRepo);
    (RepositoryFactory.getFragranceRepository as jest.Mock).mockReturnValue(mockFragranceRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateInventory', () => {
    const mockInventory: Inventory = {
      id: 'inventory-1',
      fragranceId: 'fragrance-1',
      bottleSize: 100,
      currentLevel: 80,
      purchaseDate: new Date('2024-01-01'),
      usageTracking: true,
      lowThreshold: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockUsageEntry: UsageEntry = {
      id: 'usage-1',
      fragranceId: 'fragrance-1',
      date: new Date(),
      sprayCount: 5,
      estimatedUsage: 0.5,
      createdAt: new Date(),
    };

    it('should update inventory when usage tracking is enabled', async () => {
      mockInventoryRepo.findByFragranceId.mockResolvedValue(mockInventory);
      mockUsageRepo.create.mockResolvedValue(mockUsageEntry);
      mockUsageRepo.findByFragranceAndDateRange.mockResolvedValue([mockUsageEntry]);
      
      const updatedInventory = { ...mockInventory, currentLevel: 79.5, estimatedDaysRemaining: 159 };
      mockInventoryRepo.update.mockResolvedValue(updatedInventory);

      const result = await inventoryService.updateInventory('fragrance-1', mockUsageEntry);

      expect(mockUsageRepo.create).toHaveBeenCalledWith({
        fragranceId: 'fragrance-1',
        date: mockUsageEntry.date,
        sprayCount: 5,
        estimatedUsage: 0.5,
        notes: undefined,
      });

      expect(mockInventoryRepo.update).toHaveBeenCalledWith('inventory-1', {
        currentLevel: 79.5, // 80 - (0.5/100 * 100)
        estimatedDaysRemaining: expect.any(Number),
      });

      expect(result).toEqual(updatedInventory);
    });

    it('should not update inventory level when usage tracking is disabled', async () => {
      const inventoryWithoutTracking = { ...mockInventory, usageTracking: false };
      mockInventoryRepo.findByFragranceId.mockResolvedValue(inventoryWithoutTracking);
      mockUsageRepo.create.mockResolvedValue(mockUsageEntry);

      const result = await inventoryService.updateInventory('fragrance-1', mockUsageEntry);

      expect(mockUsageRepo.create).toHaveBeenCalled();
      expect(mockInventoryRepo.update).not.toHaveBeenCalled();
      expect(result).toEqual(inventoryWithoutTracking);
    });

    it('should throw error when inventory not found', async () => {
      mockInventoryRepo.findByFragranceId.mockResolvedValue(null);

      await expect(
        inventoryService.updateInventory('fragrance-1', mockUsageEntry)
      ).rejects.toThrow('No inventory found for fragrance fragrance-1');
    });

    it('should use default spray-to-ml ratio when estimatedUsage not provided', async () => {
      const usageWithoutEstimate = { ...mockUsageEntry, estimatedUsage: undefined };
      mockInventoryRepo.findByFragranceId.mockResolvedValue(mockInventory);
      mockUsageRepo.create.mockResolvedValue(usageWithoutEstimate);
      mockUsageRepo.findByFragranceAndDateRange.mockResolvedValue([usageWithoutEstimate]);
      
      const updatedInventory = { ...mockInventory, currentLevel: 79.5, estimatedDaysRemaining: 159 };
      mockInventoryRepo.update.mockResolvedValue(updatedInventory);

      await inventoryService.updateInventory('fragrance-1', usageWithoutEstimate);

      expect(mockUsageRepo.create).toHaveBeenCalledWith({
        fragranceId: 'fragrance-1',
        date: usageWithoutEstimate.date,
        sprayCount: 5,
        estimatedUsage: 0.5, // 5 sprays * 0.1 ml/spray
        notes: undefined,
      });
    });
  });

  describe('getInventoryStatus', () => {
    const mockInventory: Inventory = {
      id: 'inventory-1',
      fragranceId: 'fragrance-1',
      bottleSize: 100,
      currentLevel: 15, // Below threshold
      purchaseDate: new Date('2024-01-01'),
      usageTracking: true,
      lowThreshold: 20,
      estimatedDaysRemaining: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return inventory status with low inventory flag', async () => {
      const mockUsageEntries = [
        {
          id: 'usage-1',
          fragranceId: 'fragrance-1',
          date: new Date('2024-01-15'),
          sprayCount: 3,
          createdAt: new Date(),
        },
      ];

      mockInventoryRepo.findByFragranceId.mockResolvedValue(mockInventory);
      mockUsageRepo.findByFragranceId.mockResolvedValue(mockUsageEntries);

      const result = await inventoryService.getInventoryStatus('fragrance-1');

      expect(result).toEqual({
        fragranceId: 'fragrance-1',
        currentLevel: 15,
        isLow: true, // 15 <= 20
        estimatedDaysRemaining: 30,
        lastUsed: new Date('2024-01-15'),
      });
    });

    it('should return status without lastUsed when no usage entries exist', async () => {
      mockInventoryRepo.findByFragranceId.mockResolvedValue(mockInventory);
      mockUsageRepo.findByFragranceId.mockResolvedValue([]);

      const result = await inventoryService.getInventoryStatus('fragrance-1');

      expect(result.lastUsed).toBeUndefined();
    });

    it('should throw error when inventory not found', async () => {
      mockInventoryRepo.findByFragranceId.mockResolvedValue(null);

      await expect(
        inventoryService.getInventoryStatus('fragrance-1')
      ).rejects.toThrow('No inventory found for fragrance fragrance-1');
    });
  });

  describe('getLowInventoryAlerts', () => {
    const mockFragrances: Fragrance[] = [
      {
        id: 'fragrance-1',
        userId: 'user-1',
        name: 'Test Fragrance 1',
        brand: 'Test Brand',
        notes: { top: [], middle: [], base: [] },
        listType: 'owned',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'fragrance-2',
        userId: 'user-1',
        name: 'Test Fragrance 2',
        brand: 'Test Brand',
        notes: { top: [], middle: [], base: [] },
        listType: 'owned',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return low inventory alerts sorted by urgency', async () => {
      const lowInventory1: Inventory = {
        id: 'inventory-1',
        fragranceId: 'fragrance-1',
        bottleSize: 100,
        currentLevel: 10, // Very low
        purchaseDate: new Date(),
        usageTracking: true,
        lowThreshold: 20,
        estimatedDaysRemaining: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const lowInventory2: Inventory = {
        id: 'inventory-2',
        fragranceId: 'fragrance-2',
        bottleSize: 100,
        currentLevel: 15, // Low but not as urgent
        purchaseDate: new Date(),
        usageTracking: true,
        lowThreshold: 20,
        estimatedDaysRemaining: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFragranceRepo.findByUserId.mockResolvedValue({ data: mockFragrances });
      mockInventoryRepo.findByFragranceId
        .mockResolvedValueOnce(lowInventory1)
        .mockResolvedValueOnce(lowInventory2);

      const result = await inventoryService.getLowInventoryAlerts('user-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        fragranceId: 'fragrance-1',
        name: 'Test Fragrance 1',
        brand: 'Test Brand',
        currentLevel: 10,
        threshold: 20,
        estimatedDaysRemaining: 5,
      });
      expect(result[1]).toEqual({
        fragranceId: 'fragrance-2',
        name: 'Test Fragrance 2',
        brand: 'Test Brand',
        currentLevel: 15,
        threshold: 20,
        estimatedDaysRemaining: 10,
      });
    });

    it('should return empty array when no low inventory alerts', async () => {
      const normalInventory: Inventory = {
        id: 'inventory-1',
        fragranceId: 'fragrance-1',
        bottleSize: 100,
        currentLevel: 50, // Above threshold
        purchaseDate: new Date(),
        usageTracking: true,
        lowThreshold: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFragranceRepo.findByUserId.mockResolvedValue({ data: [mockFragrances[0]] });
      mockInventoryRepo.findByFragranceId.mockResolvedValue(normalInventory);

      const result = await inventoryService.getLowInventoryAlerts('user-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('calculateRemainingDays', () => {
    const mockInventory: Inventory = {
      id: 'inventory-1',
      fragranceId: 'fragrance-1',
      bottleSize: 100,
      currentLevel: 50,
      purchaseDate: new Date(),
      usageTracking: true,
      lowThreshold: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should calculate remaining days based on recent usage', async () => {
      const recentUsage = [
        {
          id: 'usage-1',
          fragranceId: 'fragrance-1',
          date: new Date(),
          sprayCount: 5,
          estimatedUsage: 0.5,
          createdAt: new Date(),
        },
        {
          id: 'usage-2',
          fragranceId: 'fragrance-1',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          sprayCount: 3,
          estimatedUsage: 0.3,
          createdAt: new Date(),
        },
      ];

      mockInventoryRepo.findByFragranceId.mockResolvedValue(mockInventory);
      mockUsageRepo.findByFragranceAndDateRange.mockResolvedValue(recentUsage);

      const result = await inventoryService.calculateRemainingDays('fragrance-1');

      // 50ml remaining, 0.8ml total usage over 2 days = 0.4ml/day average
      // 50ml / 0.4ml/day = 125 days
      expect(result).toBe(125);
    });

    it('should return 0 when inventory is empty', async () => {
      const emptyInventory = { ...mockInventory, currentLevel: 0 };
      mockInventoryRepo.findByFragranceId.mockResolvedValue(emptyInventory);

      const result = await inventoryService.calculateRemainingDays('fragrance-1');

      expect(result).toBe(0);
    });

    it('should return conservative estimate when no recent usage', async () => {
      mockInventoryRepo.findByFragranceId.mockResolvedValue(mockInventory);
      mockUsageRepo.findByFragranceAndDateRange.mockResolvedValue([]);

      const result = await inventoryService.calculateRemainingDays('fragrance-1');

      // Conservative estimate: 50ml / 0.5ml per day = 100 days
      expect(result).toBe(100);
    });
  });

  describe('createInventory', () => {
    const createDto: CreateInventoryDto = {
      fragranceId: 'fragrance-1',
      bottleSize: 100,
      purchaseDate: new Date('2024-01-01'),
    };

    it('should create inventory with default values', async () => {
      const expectedInventory: Inventory = {
        id: 'inventory-1',
        fragranceId: 'fragrance-1',
        bottleSize: 100,
        currentLevel: 100,
        purchaseDate: new Date('2024-01-01'),
        usageTracking: true,
        lowThreshold: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInventoryRepo.findByFragranceId.mockResolvedValue(null);
      mockInventoryRepo.create.mockResolvedValue(expectedInventory);

      const result = await inventoryService.createInventory(createDto);

      expect(mockInventoryRepo.create).toHaveBeenCalledWith({
        fragranceId: 'fragrance-1',
        bottleSize: 100,
        purchaseDate: new Date('2024-01-01'),
        currentLevel: 100,
        usageTracking: true,
        lowThreshold: 20,
      });
      expect(result).toEqual(expectedInventory);
    });

    it('should throw error when inventory already exists', async () => {
      const existingInventory: Inventory = {
        id: 'inventory-1',
        fragranceId: 'fragrance-1',
        bottleSize: 50,
        currentLevel: 80,
        purchaseDate: new Date(),
        usageTracking: true,
        lowThreshold: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInventoryRepo.findByFragranceId.mockResolvedValue(existingInventory);

      await expect(
        inventoryService.createInventory(createDto)
      ).rejects.toThrow('Inventory already exists for fragrance fragrance-1');
    });
  });
});