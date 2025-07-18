import { Router } from 'express';
import { CalendarController } from '../controllers/calendar.controller';
import { 
  validateBody, 
  validateParams,
  validateQuery,
  uuidParamSchema
} from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const calendarController = new CalendarController();

// Validation schemas
const dailyWearEntrySchema = z.object({
  fragranceId: z.string().uuid('Invalid fragrance ID format'),
  sprayCount: z.number().int().min(1, 'Spray count must be at least 1').optional(),
  bodyParts: z.array(z.string()).optional(),
  notes: z.string().optional()
});

const createDailyWearSchema = z.object({
  date: z.string().datetime('Invalid date format'),
  weather: z.string().optional(),
  occasion: z.string().optional(),
  notes: z.string().optional(),
  entries: z.array(dailyWearEntrySchema).min(1, 'At least one fragrance entry is required')
});

const updateDailyWearSchema = z.object({
  date: z.string().datetime('Invalid date format').optional(),
  weather: z.string().optional(),
  occasion: z.string().optional(),
  notes: z.string().optional(),
  entries: z.array(dailyWearEntrySchema).optional()
});

const dateParamSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});

const dateRangeQuerySchema = z.object({
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  fragranceId: z.string().uuid('Invalid fragrance ID format').optional()
});

const statisticsQuerySchema = z.object({
  fragranceId: z.string().uuid('Invalid fragrance ID format').optional()
});

// Daily wear endpoints
router.post('/', 
  validateBody(createDailyWearSchema),
  calendarController.recordDailyWear.bind(calendarController)
);

router.get('/statistics', 
  validateQuery(statisticsQuerySchema),
  calendarController.getUsageStatistics.bind(calendarController)
);

router.get('/:date', 
  validateParams(dateParamSchema),
  calendarController.getDailyWear.bind(calendarController)
);

router.get('/', 
  validateQuery(dateRangeQuerySchema),
  calendarController.getWearHistory.bind(calendarController)
);

router.put('/:id', 
  validateParams(uuidParamSchema),
  validateBody(updateDailyWearSchema),
  calendarController.updateDailyWear.bind(calendarController)
);

router.delete('/:id', 
  validateParams(uuidParamSchema),
  calendarController.deleteDailyWear.bind(calendarController)
);

export default router;