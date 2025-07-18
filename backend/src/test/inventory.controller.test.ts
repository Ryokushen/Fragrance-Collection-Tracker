import { Request, Response } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { InventoryService } from '../services/inventory.service';
import { 
  Inventory, 
  InventoryStatus, 
  LowInventoryAlert 
} from '../types';

// Mock the inventory service
jest.mock('../services/inventory.service');

describe('InventoryController', () => {
  let inventoryController: InventoryController;
  let mockInventoryService: jest.Mocked<InventoryService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockInventoryService = new InventoryService() as jest.Mocked<InventoryService>;
    inventoryController = new InventoryController();
    (inventoryController as any).inventoryService = mockInventoryService;

    mockRequest = {
      body: {},
      params: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateInventory', () => {
    const mockInventory: Inventory = {
      id: 'inventory-1',
      fragranceId: 'fragrance-1',
      bottleSize: 100,
      currentLevel: 75,
      purchaseDate: new Date(),
      usageTracking: true,
      lowThreshold: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update inventory successfully', async () => {
      mockRequest.body = {
        fragranceId: 'fragrance-1',
        sprayCount: 5,
        estimatedUsage: 0.5,
        notes: 'Test usage',
      };

      mockInventoryService.updateInventory.mockResolvedValue(mockInventory);

      await inventoryController.updateInventory(mockRequest as Request, mockResponse as Response);

      expect(mockInventoryService.updateInventory).toHaveBeenCalledWith(
        'fragrance-1',
        expect.objectContaining({
          fragranceId: 'fragrance-1',
          sprayCount: 5,
          estimatedUsage: 0.5,
          notes: 'Test usage',
        })
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockInventory,
      });
    });

    it('should return validation error when required fields missing', async () => {
      mockRequest.body = {
        fragranceId: 'fragrance-1',
        // Missing sprayCount
      };

      await inventoryController.updateInventory(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'fragranceId and sprayCount are required',
        },
      });
    });

    it('should handle service errors', async () => {
      mockRequest.body = {
        fragranceId: 'fragrance-1',
        sprayCount: 5,
      };

      mockInventoryService.updateInventory.mockRejectedValue(
        new Error('No inventory found for fragrance fragrance-1')
      );

      await inventoryController.updateInventory(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'No inventory found for fragrance fragrance-1',
        },
      });
    });
  });

  describe('getLowInventoryAlerts', () => {
    const mockAlerts: LowInventoryAlert[] = [
      {
        fragranceId: 'fragrance-1',
        name: 'Test Fragrance 1',
        brand: 'Test Brand',
        currentLevel: 10,
        threshold: 20,
        estimatedDaysRemaining: 5,
      },
      {
        fragranceId: 'fragrance-2',
        name: 'Test Fragrance 2',
        brand: 'Test Brand',
        currentLevel: 15,
        threshold: 20,
        estimatedDaysRemaining: 10,
      },
    ];

    it('should return low inventory alerts', async () => {
      mockInventoryService.getLowInventoryAlerts.mockResolvedValue(mockAlerts);

      await inventoryController.getLowInventoryAlerts(mockRequest as Request, mockResponse as Response);

      expect(mockInventoryService.getLowInventoryAlerts).toHaveBeenCalledWith('temp-user-id');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAlerts,
        count: 2,
      });
    });

    it('should handle service errors', async () => {
      mockInventoryService.getLowInventoryAlerts.mockRejectedValue(
        new Error('Database connection failed')
      );

      await inventoryController.getLowInventoryAlerts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch low inventory alerts',
        },
      });
    });
  });

  describe('getInventoryStatus', () => {
    const mockStatus: InventoryStatus = {
      fragranceId: 'fragrance-1',
      currentLevel: 75,
      isLow: false,
      estimatedDaysRemaining: 120,
      lastUsed: new Date('2024-01-15'),
    };

    it('should return inventory status', async () => {
      mockRequest.params = { fragranceId: 'fragrance-1' };
      mockInventoryService.getInventoryStatus.mockResolvedValue(mockStatus);

      await inventoryController.getInventoryStatus(mockRequest as Request, mockResponse as Response);

      expect(mockInventoryService.getInventoryStatus).toHaveBeenCalledWith('fragrance-1');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatus,
      });
    });

    it('should handle service errors', async () => {
      mockRequest.params = { fragranceId: 'fragrance-1' };
      mockInventoryService.getInventoryStatus.mockRejectedValue(
        new Error('No inventory found for fragrance fragrance-1')
      );

      await inventoryController.getInventoryStatus(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'No inventory found for fragrance fragrance-1',
        },
      });
    });
  });

  describe('createInventory', () => {
    const mockInventory: Inventory = {
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

    it('should create inventory successfully', async () => {
      mockRequest.body = {
        fragranceId: 'fragrance-1',
        bottleSize: 100,
        purchaseDate: '2024-01-01T00:00:00.000Z',
        usageTracking: true,
        lowThreshold: 20,
      };

      mockInventoryService.createInventory.mockResolvedValue(mockInventory);

      await inventoryController.createInventory(mockRequest as Request, mockResponse as Response);

      expect(mockInventoryService.createInventory).toHaveBeenCalledWith({
        fragranceId: 'fragrance-1',
        bottleSize: 100,
        purchaseDate: new Date('2024-01-01T00:00:00.000Z'),
        usageTracking: true,
        lowThreshold: 20,
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockInventory,
      });
    });

    it('should handle service errors', async () => {
      mockRequest.body = {
        fragranceId: 'fragrance-1',
        bottleSize: 100,
        purchaseDate: '2024-01-01T00:00:00.000Z',
      };

      mockInventoryService.createInventory.mockRejectedValue(
        new Error('Inventory already exists for fragrance fragrance-1')
      );

      await inventoryController.createInventory(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Inventory already exists for fragrance fragrance-1',
        },
      });
    });
  });

  describe('updateInventoryRecord', () => {
    const mockInventory: Inventory = {
      id: 'inventory-1',
      fragranceId: 'fragrance-1',
      bottleSize: 100,
      currentLevel: 80,
      purchaseDate: new Date(),
      usageTracking: true,
      lowThreshold: 15,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update inventory record successfully', async () => {
      mockRequest.params = { fragranceId: 'fragrance-1' };
      mockRequest.body = {
        currentLevel: 80,
        lowThreshold: 15,
      };

      mockInventoryService.updateInventoryRecord.mockResolvedValue(mockInventory);

      await inventoryController.updateInventoryRecord(mockRequest as Request, mockResponse as Response);

      expect(mockInventoryService.updateInventoryRecord).toHaveBeenCalledWith('fragrance-1', {
        currentLevel: 80,
        lowThreshold: 15,
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockInventory,
      });
    });
  });

  describe('getInventory', () => {
    const mockInventory: Inventory = {
      id: 'inventory-1',
      fragranceId: 'fragrance-1',
      bottleSize: 100,
      currentLevel: 75,
      purchaseDate: new Date(),
      usageTracking: true,
      lowThreshold: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return inventory when found', async () => {
      mockRequest.params = { fragranceId: 'fragrance-1' };
      mockInventoryService.getInventory.mockResolvedValue(mockInventory);

      await inventoryController.getInventory(mockRequest as Request, mockResponse as Response);

      expect(mockInventoryService.getInventory).toHaveBeenCalledWith('fragrance-1');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockInventory,
      });
    });

    it('should return 404 when inventory not found', async () => {
      mockRequest.params = { fragranceId: 'fragrance-1' };
      mockInventoryService.getInventory.mockResolvedValue(null);

      await inventoryController.getInventory(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Inventory not found for this fragrance',
        },
      });
    });
  });

  describe('getRemainingDays', () => {
    it('should return remaining days calculation', async () => {
      mockRequest.params = { fragranceId: 'fragrance-1' };
      mockInventoryService.calculateRemainingDays.mockResolvedValue(120);

      await inventoryController.getRemainingDays(mockRequest as Request, mockResponse as Response);

      expect(mockInventoryService.calculateRemainingDays).toHaveBeenCalledWith('fragrance-1');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          fragranceId: 'fragrance-1',
          estimatedDaysRemaining: 120,
        },
      });
    });
  });

  describe('recalculateEstimates', () => {
    it('should trigger recalculation successfully', async () => {
      mockInventoryService.recalculateAllEstimates.mockResolvedValue();

      await inventoryController.recalculateEstimates(mockRequest as Request, mockResponse as Response);

      expect(mockInventoryService.recalculateAllEstimates).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Inventory estimates recalculated successfully',
      });
    });

    it('should handle service errors', async () => {
      mockInventoryService.recalculateAllEstimates.mockRejectedValue(
        new Error('Database error')
      );

      await inventoryController.recalculateEstimates(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to recalculate inventory estimates',
        },
      });
    });
  });
});