import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Validation schemas
export const createFragranceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  brand: z.string().min(1, 'Brand is required').max(100, 'Brand too long'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  concentration: z.string().max(50).optional(),
  notes: z.object({
    top: z.array(z.string()).optional(),
    middle: z.array(z.string()).optional(),
    base: z.array(z.string()).optional(),
  }).optional(),
  externalId: z.string().max(100).optional(),
  personalRating: z.number().int().min(1).max(10).optional(),
  personalNotes: z.string().max(2000).optional(),
  purchaseInfo: z.object({
    date: z.string().datetime().or(z.date()),
    price: z.number().min(0),
    retailer: z.string().max(100),
  }).optional(),
  listType: z.enum(['owned', 'tried', 'wishlist']).optional(),
});

export const updateFragranceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long').optional(),
  brand: z.string().min(1, 'Brand is required').max(100, 'Brand too long').optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  concentration: z.string().max(50).optional(),
  notes: z.object({
    top: z.array(z.string()).optional(),
    middle: z.array(z.string()).optional(),
    base: z.array(z.string()).optional(),
  }).optional(),
  personalRating: z.number().int().min(1).max(10).optional(),
  personalNotes: z.string().max(2000).optional(),
  purchaseInfo: z.object({
    date: z.string().datetime().or(z.date()),
    price: z.number().min(0),
    retailer: z.string().max(100),
  }).optional(),
  listType: z.enum(['owned', 'tried', 'wishlist']).optional(),
});

export const fragranceFiltersSchema = z.object({
  brand: z.string().optional(),
  listType: z.enum(['owned', 'tried', 'wishlist']).optional(),
  minRating: z.string().transform(val => parseInt(val)).pipe(z.number().int().min(1).max(10)).optional(),
  maxRating: z.string().transform(val => parseInt(val)).pipe(z.number().int().min(1).max(10)).optional(),
  hasLowInventory: z.string().transform(val => val === 'true').optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'brand', 'rating', 'createdAt', 'lastWorn']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().transform(val => parseInt(val)).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform(val => parseInt(val)).pipe(z.number().int().min(1).max(100)).optional(),
});

// Validation middleware factory
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.issues.map((err: z.ZodIssue) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        });
        return;
      }
      next(error);
    }
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.query);
      req.query = result as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.issues.map((err: z.ZodIssue) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        });
        return;
      }
      next(error);
    }
  };
}

export function validateParams(schema: z.ZodSchema<any>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.params);
      req.params = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid URL parameters',
            details: error.issues.map((err: z.ZodIssue) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        });
        return;
      }
      next(error);
    }
  };
}

// Common parameter schemas
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid fragrance ID format'),
});