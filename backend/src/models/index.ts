// Data access layer with repository pattern for Fragrance Collection Tracker

import { Database } from 'sqlite';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, DatabaseError } from '../database/connection';
import {
  Fragrance,
  CreateFragranceDto,
  UpdateFragranceDto,
  FragranceRow,
  Inventory,
  CreateInventoryDto,
  UpdateInventoryDto,
  InventoryRow,
  DailyWear,
  CreateDailyWearDto,
  DailyWearRow,
  DailyWearEntryRow,
  UsageEntry,
  CreateUsageEntryDto,
  UsageEntryRow,
  FragranceFilters,
  FragranceSortOptions,
  PaginationOptions,
  PaginatedResult
} from '../types';

// Base repository class with common functionality
abstract class BaseRepository {
  protected db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  protected handleError(error: any, operation: string): never {
    console.error(`Database error in ${operation}:`, error);
    throw new DatabaseError(`Failed to ${operation}`, 'DATABASE_ERROR', error);
  }
}

// Fragrance Repository
export class FragranceRepository extends BaseRepository {
  private mapRowToFragrance(row: FragranceRow): Fragrance {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      brand: row.brand,
      year: row.year || undefined,
      concentration: row.concentration || undefined,
      notes: {
        top: row.top_notes ? JSON.parse(row.top_notes) : [],
        middle: row.middle_notes ? JSON.parse(row.middle_notes) : [],
        base: row.base_notes ? JSON.parse(row.base_notes) : []
      },
      externalId: row.external_id || undefined,
      personalRating: row.personal_rating || undefined,
      personalNotes: row.personal_notes || undefined,
      purchaseInfo: row.purchase_date ? {
        date: new Date(row.purchase_date),
        price: row.purchase_price || 0,
        retailer: row.purchase_retailer || ''
      } : undefined,
      listType: row.list_type as 'owned' | 'tried' | 'wishlist',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  async create(userId: string, data: CreateFragranceDto): Promise<Fragrance> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();

      await this.db.run(`
        INSERT INTO fragrances (
          id, user_id, name, brand, year, concentration,
          top_notes, middle_notes, base_notes, external_id,
          personal_rating, personal_notes, purchase_date,
          purchase_price, purchase_retailer, list_type,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, userId, data.name, data.brand, data.year, data.concentration,
        JSON.stringify(data.notes?.top || []),
        JSON.stringify(data.notes?.middle || []),
        JSON.stringify(data.notes?.base || []),
        data.externalId,
        data.personalRating,
        data.personalNotes,
        data.purchaseInfo?.date.toISOString(),
        data.purchaseInfo?.price,
        data.purchaseInfo?.retailer,
        data.listType || 'owned',
        now, now
      ]);

      const row = await this.db.get<FragranceRow>(
        'SELECT * FROM fragrances WHERE id = ?',
        [id]
      );

      if (!row) {
        throw new Error('Failed to retrieve created fragrance');
      }

      return this.mapRowToFragrance(row);
    } catch (error) {
      this.handleError(error, 'create fragrance');
    }
  }

  async findById(id: string): Promise<Fragrance | null> {
    try {
      const row = await this.db.get<FragranceRow>(
        'SELECT * FROM fragrances WHERE id = ?',
        [id]
      );

      return row ? this.mapRowToFragrance(row) : null;
    } catch (error) {
      this.handleError(error, 'find fragrance by id');
    }
  }

  async findByUserId(
    userId: string,
    filters?: FragranceFilters,
    sort?: FragranceSortOptions,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Fragrance>> {
    try {
      let whereClause = 'WHERE user_id = ?';
      const params: any[] = [userId];

      // Apply filters
      if (filters) {
        if (filters.brand) {
          whereClause += ' AND brand LIKE ?';
          params.push(`%${filters.brand}%`);
        }
        if (filters.listType) {
          whereClause += ' AND list_type = ?';
          params.push(filters.listType);
        }
        if (filters.minRating) {
          whereClause += ' AND personal_rating >= ?';
          params.push(filters.minRating);
        }
        if (filters.maxRating) {
          whereClause += ' AND personal_rating <= ?';
          params.push(filters.maxRating);
        }
        if (filters.search) {
          whereClause += ' AND (name LIKE ? OR brand LIKE ?)';
          params.push(`%${filters.search}%`, `%${filters.search}%`);
        }
      }

      // Count total records
      const countResult = await this.db.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM fragrances ${whereClause}`,
        params
      );
      const total = countResult?.count || 0;

      // Apply sorting
      let orderClause = 'ORDER BY created_at DESC';
      if (sort) {
        let field: string = sort.field;
        // Map camelCase to snake_case for database columns
        switch (sort.field) {
          case 'createdAt':
            field = 'created_at';
            break;
          case 'lastWorn':
            field = 'updated_at';
            break;
          case 'rating':
            field = 'personal_rating';
            break;
          // name and brand are already correct
        }
        orderClause = `ORDER BY ${field} ${sort.direction.toUpperCase()}`;
      }

      // Apply pagination
      let limitClause = '';
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        limitClause = `LIMIT ${pagination.limit} OFFSET ${offset}`;
      }

      const rows = await this.db.all<FragranceRow[]>(
        `SELECT * FROM fragrances ${whereClause} ${orderClause} ${limitClause}`,
        params
      );

      const fragrances = rows.map(row => this.mapRowToFragrance(row));

      return {
        data: fragrances,
        pagination: pagination ? {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit)
        } : {
          page: 1,
          limit: total,
          total,
          totalPages: 1
        }
      };
    } catch (error) {
      this.handleError(error, 'find fragrances by user');
    }
  }

  async update(id: string, data: UpdateFragranceDto): Promise<Fragrance | null> {
    try {
      const updates: string[] = [];
      const params: any[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        params.push(data.name);
      }
      if (data.brand !== undefined) {
        updates.push('brand = ?');
        params.push(data.brand);
      }
      if (data.year !== undefined) {
        updates.push('year = ?');
        params.push(data.year);
      }
      if (data.concentration !== undefined) {
        updates.push('concentration = ?');
        params.push(data.concentration);
      }
      if (data.notes !== undefined) {
        if (data.notes.top !== undefined) {
          updates.push('top_notes = ?');
          params.push(JSON.stringify(data.notes.top));
        }
        if (data.notes.middle !== undefined) {
          updates.push('middle_notes = ?');
          params.push(JSON.stringify(data.notes.middle));
        }
        if (data.notes.base !== undefined) {
          updates.push('base_notes = ?');
          params.push(JSON.stringify(data.notes.base));
        }
      }
      if (data.personalRating !== undefined) {
        updates.push('personal_rating = ?');
        params.push(data.personalRating);
      }
      if (data.personalNotes !== undefined) {
        updates.push('personal_notes = ?');
        params.push(data.personalNotes);
      }
      if (data.purchaseInfo !== undefined) {
        updates.push('purchase_date = ?, purchase_price = ?, purchase_retailer = ?');
        params.push(
          data.purchaseInfo.date.toISOString(),
          data.purchaseInfo.price,
          data.purchaseInfo.retailer
        );
      }
      if (data.listType !== undefined) {
        updates.push('list_type = ?');
        params.push(data.listType);
      }

      if (updates.length === 0) {
        return this.findById(id);
      }

      updates.push('updated_at = ?');
      params.push(new Date().toISOString());
      params.push(id);

      await this.db.run(
        `UPDATE fragrances SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      return this.findById(id);
    } catch (error) {
      this.handleError(error, 'update fragrance');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.db.run('DELETE FROM fragrances WHERE id = ?', [id]);
      return (result.changes || 0) > 0;
    } catch (error) {
      this.handleError(error, 'delete fragrance');
    }
  }
}

// Inventory Repository
export class InventoryRepository extends BaseRepository {
  private mapRowToInventory(row: InventoryRow): Inventory {
    return {
      id: row.id,
      fragranceId: row.fragrance_id,
      bottleSize: row.bottle_size,
      currentLevel: row.current_level,
      purchaseDate: new Date(row.purchase_date),
      openedDate: row.opened_date ? new Date(row.opened_date) : undefined,
      usageTracking: Boolean(row.usage_tracking),
      lowThreshold: row.low_threshold,
      estimatedDaysRemaining: row.estimated_days_remaining || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  async create(data: CreateInventoryDto): Promise<Inventory> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();

      await this.db.run(`
        INSERT INTO inventory (
          id, fragrance_id, bottle_size, current_level,
          purchase_date, opened_date, usage_tracking, low_threshold,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, data.fragranceId, data.bottleSize, data.currentLevel || 100,
        data.purchaseDate.toISOString(), data.openedDate?.toISOString(),
        data.usageTracking ? 1 : 0, data.lowThreshold || 20,
        now, now
      ]);

      const row = await this.db.get<InventoryRow>(
        'SELECT * FROM inventory WHERE id = ?',
        [id]
      );

      if (!row) {
        throw new Error('Failed to retrieve created inventory');
      }

      return this.mapRowToInventory(row);
    } catch (error) {
      this.handleError(error, 'create inventory');
    }
  }

  async findByFragranceId(fragranceId: string): Promise<Inventory | null> {
    try {
      const row = await this.db.get<InventoryRow>(
        'SELECT * FROM inventory WHERE fragrance_id = ?',
        [fragranceId]
      );

      return row ? this.mapRowToInventory(row) : null;
    } catch (error) {
      this.handleError(error, 'find inventory by fragrance id');
    }
  }

  async update(id: string, data: UpdateInventoryDto): Promise<Inventory | null> {
    try {
      const updates: string[] = [];
      const params: any[] = [];

      if (data.bottleSize !== undefined) {
        updates.push('bottle_size = ?');
        params.push(data.bottleSize);
      }
      if (data.currentLevel !== undefined) {
        updates.push('current_level = ?');
        params.push(data.currentLevel);
      }
      if (data.openedDate !== undefined) {
        updates.push('opened_date = ?');
        params.push(data.openedDate.toISOString());
      }
      if (data.usageTracking !== undefined) {
        updates.push('usage_tracking = ?');
        params.push(data.usageTracking ? 1 : 0);
      }
      if (data.lowThreshold !== undefined) {
        updates.push('low_threshold = ?');
        params.push(data.lowThreshold);
      }
      if (data.estimatedDaysRemaining !== undefined) {
        updates.push('estimated_days_remaining = ?');
        params.push(data.estimatedDaysRemaining);
      }

      if (updates.length === 0) {
        const row = await this.db.get<InventoryRow>('SELECT * FROM inventory WHERE id = ?', [id]);
        return row ? this.mapRowToInventory(row) : null;
      }

      updates.push('updated_at = ?');
      params.push(new Date().toISOString());
      params.push(id);

      await this.db.run(
        `UPDATE inventory SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      const row = await this.db.get<InventoryRow>('SELECT * FROM inventory WHERE id = ?', [id]);
      return row ? this.mapRowToInventory(row) : null;
    } catch (error) {
      this.handleError(error, 'update inventory');
    }
  }
}

// Daily Wear Repository
export class DailyWearRepository extends BaseRepository {
  private mapRowToDailyWear(row: DailyWearRow, entries: DailyWearEntryRow[]): DailyWear {
    return {
      id: row.id,
      userId: row.user_id,
      date: new Date(row.date),
      weather: row.weather || undefined,
      occasion: row.occasion || undefined,
      notes: row.notes || undefined,
      entries: entries.map(entry => ({
        id: entry.id,
        dailyWearId: entry.daily_wear_id,
        fragranceId: entry.fragrance_id,
        sprayCount: entry.spray_count || undefined,
        bodyParts: entry.body_parts ? JSON.parse(entry.body_parts) : undefined,
        notes: entry.notes || undefined,
        createdAt: new Date(entry.created_at)
      })),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  async create(userId: string, data: CreateDailyWearDto): Promise<DailyWear> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();

      await this.db.exec('BEGIN TRANSACTION');

      try {
        // Insert daily wear record
        await this.db.run(`
          INSERT INTO daily_wear (
            id, user_id, date, weather, occasion, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, userId, data.date.toISOString().split('T')[0],
          data.weather, data.occasion, data.notes, now, now
        ]);

        // Insert daily wear entries
        for (const entry of data.entries) {
          const entryId = uuidv4();
          await this.db.run(`
            INSERT INTO daily_wear_entries (
              id, daily_wear_id, fragrance_id, spray_count, body_parts, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            entryId, id, entry.fragranceId, entry.sprayCount,
            entry.bodyParts ? JSON.stringify(entry.bodyParts) : null,
            entry.notes, now
          ]);
        }

        await this.db.exec('COMMIT');

        const dailyWear = await this.findById(id);
        if (!dailyWear) {
          throw new Error('Failed to retrieve created daily wear');
        }

        return dailyWear;
      } catch (error) {
        await this.db.exec('ROLLBACK');
        throw error;
      }
    } catch (error) {
      this.handleError(error, 'create daily wear');
    }
  }

  async findById(id: string): Promise<DailyWear | null> {
    try {
      const row = await this.db.get<DailyWearRow>(
        'SELECT * FROM daily_wear WHERE id = ?',
        [id]
      );

      if (!row) {
        return null;
      }

      const entries = await this.db.all<DailyWearEntryRow[]>(
        'SELECT * FROM daily_wear_entries WHERE daily_wear_id = ? ORDER BY created_at',
        [id]
      );

      return this.mapRowToDailyWear(row, entries);
    } catch (error) {
      this.handleError(error, 'find daily wear by id');
    }
  }

  async findByUserAndDate(userId: string, date: Date): Promise<DailyWear | null> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const row = await this.db.get<DailyWearRow>(
        'SELECT * FROM daily_wear WHERE user_id = ? AND date = ?',
        [userId, dateStr]
      );

      if (!row) {
        return null;
      }

      const entries = await this.db.all<DailyWearEntryRow[]>(
        'SELECT * FROM daily_wear_entries WHERE daily_wear_id = ? ORDER BY created_at',
        [row.id]
      );

      return this.mapRowToDailyWear(row, entries);
    } catch (error) {
      this.handleError(error, 'find daily wear by user and date');
    }
  }

  async findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyWear[]> {
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const rows = await this.db.all<DailyWearRow[]>(`
        SELECT * FROM daily_wear 
        WHERE user_id = ? AND date BETWEEN ? AND ?
        ORDER BY date DESC
      `, [userId, startDateStr, endDateStr]);

      const dailyWears: DailyWear[] = [];
      for (const row of rows) {
        const entries = await this.db.all<DailyWearEntryRow[]>(
          'SELECT * FROM daily_wear_entries WHERE daily_wear_id = ? ORDER BY created_at',
          [row.id]
        );
        dailyWears.push(this.mapRowToDailyWear(row, entries));
      }

      return dailyWears;
    } catch (error) {
      this.handleError(error, 'find daily wear by user and date range');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.db.run('DELETE FROM daily_wear WHERE id = ?', [id]);
      return (result.changes || 0) > 0;
    } catch (error) {
      this.handleError(error, 'delete daily wear');
    }
  }
}

// Usage Entry Repository
export class UsageEntryRepository extends BaseRepository {
  private mapRowToUsageEntry(row: UsageEntryRow): UsageEntry {
    return {
      id: row.id,
      fragranceId: row.fragrance_id,
      date: new Date(row.date),
      sprayCount: row.spray_count,
      estimatedUsage: row.estimated_usage || undefined,
      notes: row.notes || undefined,
      createdAt: new Date(row.created_at)
    };
  }

  async create(data: CreateUsageEntryDto): Promise<UsageEntry> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();

      await this.db.run(`
        INSERT INTO usage_entries (
          id, fragrance_id, date, spray_count, estimated_usage, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        id, data.fragranceId, data.date.toISOString().split('T')[0],
        data.sprayCount, data.estimatedUsage, data.notes, now
      ]);

      const row = await this.db.get<UsageEntryRow>(
        'SELECT * FROM usage_entries WHERE id = ?',
        [id]
      );

      if (!row) {
        throw new Error('Failed to retrieve created usage entry');
      }

      return this.mapRowToUsageEntry(row);
    } catch (error) {
      this.handleError(error, 'create usage entry');
    }
  }

  async findByFragranceId(fragranceId: string): Promise<UsageEntry[]> {
    try {
      const rows = await this.db.all<UsageEntryRow[]>(
        'SELECT * FROM usage_entries WHERE fragrance_id = ? ORDER BY date DESC',
        [fragranceId]
      );

      return rows.map(row => this.mapRowToUsageEntry(row));
    } catch (error) {
      this.handleError(error, 'find usage entries by fragrance id');
    }
  }

  async findByFragranceAndDateRange(
    fragranceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageEntry[]> {
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const rows = await this.db.all<UsageEntryRow[]>(`
        SELECT * FROM usage_entries 
        WHERE fragrance_id = ? AND date BETWEEN ? AND ?
        ORDER BY date DESC
      `, [fragranceId, startDateStr, endDateStr]);

      return rows.map(row => this.mapRowToUsageEntry(row));
    } catch (error) {
      this.handleError(error, 'find usage entries by fragrance and date range');
    }
  }
}

// Updated Repository factory to include new repositories
export class RepositoryFactory {
  private static db: Database | null = null;

  static async initialize(): Promise<void> {
    this.db = await getDatabase();
  }

  static getFragranceRepository(): FragranceRepository {
    if (!this.db) {
      throw new Error('Database not initialized. Call RepositoryFactory.initialize() first.');
    }
    return new FragranceRepository(this.db);
  }

  static getInventoryRepository(): InventoryRepository {
    if (!this.db) {
      throw new Error('Database not initialized. Call RepositoryFactory.initialize() first.');
    }
    return new InventoryRepository(this.db);
  }

  static getDailyWearRepository(): DailyWearRepository {
    if (!this.db) {
      throw new Error('Database not initialized. Call RepositoryFactory.initialize() first.');
    }
    return new DailyWearRepository(this.db);
  }

  static getUsageEntryRepository(): UsageEntryRepository {
    if (!this.db) {
      throw new Error('Database not initialized. Call RepositoryFactory.initialize() first.');
    }
    return new UsageEntryRepository(this.db);
  }
}