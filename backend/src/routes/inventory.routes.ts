import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { 
  validateBody, 
  validateParams,
  uuidParamSchema
} from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const inventoryController = new InventoryController();

// Validation schemas
const updateInventorySchema = z.object({
  fragranceId: z.string().uuid('Invalid fragrance ID format'),
  sprayCount: z.number().int().positive('Spray count must be a positive integer'),
  estimatedUsage: z.number().positive('Estimated usage must be positive').optional(),
  notes: z.string().optional()
});

const createInventorySchema = z.object({
  fragranceId: z.string().uuid('Invalid fragrance ID format'),
  bottleSize: z.number().positive('Bottle size must be positive'),
  currentLevel: z.number().min(0).max(100, 'Current level must be between 0 and 100').optional(),
  purchaseDate: z.string().datetime('Invalid purchase date format'),
  openedDate: z.string().datetime('Invalid opened date format').optional(),
  usageTracking: z.boolean().optional(),
  lowThreshold: z.number().min(0).max(100, 'Low threshold must be between 0 and 100').optional()
});

const updateInventoryRecordSchema = z.object({
  bottleSize: z.number().positive('Bottle size must be positive').optional(),
  currentLevel: z.number().min(0).max(100, 'Current level must be between 0 and 100').optional(),
  openedDate: z.string().datetime('Invalid opened date format').optional(),
  usageTracking: z.boolean().optional(),
  lowThreshold: z.number().min(0).max(100, 'Low threshold must be between 0 and 100').optional()
});

// Inventory management endpoints
router.post('/', 
  validateBody(updateInventorySchema),
  inventoryController.updateInventory.bind(inventoryController)
);

router.get('/alerts', 
  inventoryController.getLowInventoryAlerts.bind(inventoryController)
);

router.post('/create', 
  validateBody(createInventorySchema),
  inventoryController.createInventory.bind(inventoryController)
);

router.post('/recalculate', 
  inventoryController.recalculateEstimates.bind(inventoryController)
);

router.get('/:fragranceId', 
  validateParams(uuidParamSchema),
  inventoryController.getInventory.bind(inventoryController)
);

router.put('/:fragranceId', 
  validateParams(uuidParamSchema),
  validateBody(updateInventoryRecordSchema),
  inventoryController.updateInventoryRecord.bind(inventoryController)
);

router.get('/:fragranceId/status', 
  validateParams(uuidParamSchema),
  inventoryController.getInventoryStatus.bind(inventoryController)
);

router.get('/:fragranceId/remaining-days', 
  validateParams(uuidParamSchema),
  inventoryController.getRemainingDays.bind(inventoryController)
);

export default router;