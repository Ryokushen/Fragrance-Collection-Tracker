// Controller interfaces and implementations

import { Request, Response } from 'express';

// Export the actual controller implementation
export { FragranceController as FragranceControllerImpl, createFragranceController } from './fragrance.controller';
export { InventoryController as InventoryControllerImpl, createInventoryController } from './inventory.controller';
export { CalendarController } from './calendar.controller';

export interface FragranceController {
  searchExternal(req: Request, res: Response): Promise<void>;
  createFragrance(req: Request, res: Response): Promise<void>;
  getUserFragrances(req: Request, res: Response): Promise<void>;
  getFragranceById(req: Request, res: Response): Promise<void>;
  updateFragrance(req: Request, res: Response): Promise<void>;
  deleteFragrance(req: Request, res: Response): Promise<void>;
}

export interface InventoryController {
  updateInventory(req: Request, res: Response): Promise<void>;
  getInventoryStatus(req: Request, res: Response): Promise<void>;
  getLowInventoryAlerts(req: Request, res: Response): Promise<void>;
}

export interface ICalendarController {
  recordDailyWear(req: Request, res: Response): Promise<void>;
  getDailyWear(req: Request, res: Response): Promise<void>;
  getWearHistory(req: Request, res: Response): Promise<void>;
  getUsageStatistics(req: Request, res: Response): Promise<void>;
}

export interface AuthController {
  register(req: Request, res: Response): Promise<void>;
  login(req: Request, res: Response): Promise<void>;
  getProfile(req: Request, res: Response): Promise<void>;
}