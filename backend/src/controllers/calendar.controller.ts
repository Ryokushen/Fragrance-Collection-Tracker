// Calendar controller for daily wear tracking endpoints

import { Request, Response } from 'express';
import { CalendarService, createCalendarService } from '../services/calendar.service';
import { createInventoryService } from '../services/inventory.service';
import { CreateDailyWearDto, DateRange } from '../types';

export class CalendarController {
  private calendarService: CalendarService;

  constructor() {
    const inventoryService = createInventoryService();
    this.calendarService = createCalendarService(inventoryService);
  }

  /**
   * POST /api/daily-wear
   * Record daily wear for a specific date
   */
  async recordDailyWear(req: Request, res: Response): Promise<void> {
    try {
      // In a real app, userId would come from authentication middleware
      const userId = req.headers['x-user-id'] as string || 'temp-user-id';
      const data: CreateDailyWearDto = req.body;

      // Validate that date is provided
      if (!data.date) {
        res.status(400).json({
          error: 'Date is required',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      // Validate that entries are provided
      if (!data.entries || data.entries.length === 0) {
        res.status(400).json({
          error: 'At least one fragrance entry is required',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      const date = new Date(data.date);
      
      // Validate date
      if (isNaN(date.getTime())) {
        res.status(400).json({
          error: 'Invalid date format',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      const dailyWear = await this.calendarService.recordDailyWear(userId, date, data);

      res.status(201).json({
        success: true,
        data: dailyWear
      });
    } catch (error: any) {
      console.error('Error recording daily wear:', error);
      
      if (error.message.includes('already exists')) {
        res.status(409).json({
          error: error.message,
          code: 'CONFLICT'
        });
        return;
      }

      res.status(500).json({
        error: 'Failed to record daily wear',
        code: 'INTERNAL_ERROR',
        details: error.message
      });
    }
  }

  /**
   * GET /api/daily-wear/:date
   * Get daily wear for a specific date
   */
  async getDailyWear(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string || 'temp-user-id';
      const dateParam = req.params.date;

      const date = new Date(dateParam);
      
      if (isNaN(date.getTime())) {
        res.status(400).json({
          error: 'Invalid date format',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      const dailyWear = await this.calendarService.getDailyWear(userId, date);

      if (!dailyWear) {
        res.status(404).json({
          error: 'No daily wear found for this date',
          code: 'NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        data: dailyWear
      });
    } catch (error: any) {
      console.error('Error getting daily wear:', error);
      res.status(500).json({
        error: 'Failed to get daily wear',
        code: 'INTERNAL_ERROR',
        details: error.message
      });
    }
  }

  /**
   * GET /api/daily-wear
   * Get daily wear history for a date range
   */
  async getWearHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string || 'temp-user-id';
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          error: 'Both startDate and endDate are required',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({
          error: 'Invalid date format',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      if (start > end) {
        res.status(400).json({
          error: 'Start date must be before end date',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      const dateRange: DateRange = { startDate: start, endDate: end };
      const wearHistory = await this.calendarService.getWearHistory(userId, dateRange);

      res.json({
        success: true,
        data: wearHistory
      });
    } catch (error: any) {
      console.error('Error getting wear history:', error);
      res.status(500).json({
        error: 'Failed to get wear history',
        code: 'INTERNAL_ERROR',
        details: error.message
      });
    }
  }

  /**
   * GET /api/daily-wear/statistics
   * Get usage statistics for a user or specific fragrance
   */
  async getUsageStatistics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string || 'temp-user-id';
      const { fragranceId } = req.query;

      const statistics = await this.calendarService.getUsageStatistics(
        userId, 
        fragranceId as string | undefined
      );

      res.json({
        success: true,
        data: statistics
      });
    } catch (error: any) {
      console.error('Error getting usage statistics:', error);
      res.status(500).json({
        error: 'Failed to get usage statistics',
        code: 'INTERNAL_ERROR',
        details: error.message
      });
    }
  }

  /**
   * PUT /api/daily-wear/:id
   * Update daily wear record
   */
  async updateDailyWear(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: Partial<CreateDailyWearDto> = req.body;

      if (!id) {
        res.status(400).json({
          error: 'Daily wear ID is required',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      const updatedDailyWear = await this.calendarService.updateDailyWear(id, data);

      if (!updatedDailyWear) {
        res.status(404).json({
          error: 'Daily wear not found',
          code: 'NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        data: updatedDailyWear
      });
    } catch (error: any) {
      console.error('Error updating daily wear:', error);
      res.status(500).json({
        error: 'Failed to update daily wear',
        code: 'INTERNAL_ERROR',
        details: error.message
      });
    }
  }

  /**
   * DELETE /api/daily-wear/:id
   * Delete daily wear record
   */
  async deleteDailyWear(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Daily wear ID is required',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      const deleted = await this.calendarService.deleteDailyWear(id);

      if (!deleted) {
        res.status(404).json({
          error: 'Daily wear not found',
          code: 'NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Daily wear deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting daily wear:', error);
      res.status(500).json({
        error: 'Failed to delete daily wear',
        code: 'INTERNAL_ERROR',
        details: error.message
      });
    }
  }
}