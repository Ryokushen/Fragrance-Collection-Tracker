import { Router } from 'express';
import { FragranceController } from '../controllers/fragrance.controller';
import { 
  validateBody, 
  validateQuery, 
  validateParams,
  createFragranceSchema,
  updateFragranceSchema,
  fragranceFiltersSchema,
  uuidParamSchema
} from '../middleware/validation';

const router = Router();
const fragranceController = new FragranceController();

// External API endpoints (existing functionality) - must come before parameterized routes
router.get('/search', fragranceController.searchFragrances.bind(fragranceController));
router.get('/health', fragranceController.getHealthStatus.bind(fragranceController));
router.delete('/cache', fragranceController.clearCache.bind(fragranceController));

// CRUD endpoints for fragrance management
router.post('/', 
  validateBody(createFragranceSchema),
  fragranceController.createFragrance.bind(fragranceController)
);

router.get('/', 
  validateQuery(fragranceFiltersSchema),
  fragranceController.getFragrances.bind(fragranceController)
);

router.get('/:id', 
  validateParams(uuidParamSchema),
  fragranceController.getFragranceById.bind(fragranceController)
);

router.put('/:id', 
  validateParams(uuidParamSchema),
  validateBody(updateFragranceSchema),
  fragranceController.updateFragrance.bind(fragranceController)
);

router.delete('/:id', 
  validateParams(uuidParamSchema),
  fragranceController.deleteFragrance.bind(fragranceController)
);

export default router;