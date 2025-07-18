import { initializeDatabase, closeDatabase } from '../database/connection';
import { runMigrations } from '../database/migrations';
import { RepositoryFactory } from '../models';
import { CreateFragranceDto } from '../types';

describe('Database Setup', () => {
  beforeAll(async () => {
    // Use in-memory database for tests
    process.env.NODE_ENV = 'test';
    await initializeDatabase();
    await runMigrations();
    await RepositoryFactory.initialize();

    // Create test users for foreign key constraints
    const db = await initializeDatabase();
    await db.run(`
      INSERT INTO users (id, email, password_hash, name) 
      VALUES (?, ?, ?, ?)
    `, ['test-user-123', 'test@example.com', 'hashed_password', 'Test User']);
    
    await db.run(`
      INSERT INTO users (id, email, password_hash, name) 
      VALUES (?, ?, ?, ?)
    `, ['test-user-inventory', 'inventory@example.com', 'hashed_password', 'Inventory User']);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Database Connection', () => {
    it('should initialize database successfully', async () => {
      const db = await initializeDatabase();
      expect(db).toBeDefined();
    });

    it('should run migrations successfully', async () => {
      // This test passes if migrations run without throwing
      await expect(runMigrations()).resolves.not.toThrow();
    });
  });

  describe('Fragrance Repository', () => {
    let fragranceRepo: any;
    const testUserId = 'test-user-123';

    beforeAll(() => {
      fragranceRepo = RepositoryFactory.getFragranceRepository();
    });

    it('should create a fragrance', async () => {
      const fragranceData: CreateFragranceDto = {
        name: 'Test Fragrance',
        brand: 'Test Brand',
        year: 2023,
        concentration: 'EDP',
        notes: {
          top: ['bergamot', 'lemon'],
          middle: ['rose', 'jasmine'],
          base: ['sandalwood', 'musk']
        },
        personalRating: 8,
        personalNotes: 'Great for evening wear',
        listType: 'owned'
      };

      const fragrance = await fragranceRepo.create(testUserId, fragranceData);

      expect(fragrance).toBeDefined();
      expect(fragrance.name).toBe(fragranceData.name);
      expect(fragrance.brand).toBe(fragranceData.brand);
      expect(fragrance.year).toBe(fragranceData.year);
      expect(fragrance.notes.top).toEqual(fragranceData.notes!.top);
      expect(fragrance.personalRating).toBe(fragranceData.personalRating);
      expect(fragrance.listType).toBe(fragranceData.listType);
    });

    it('should find fragrance by id', async () => {
      const fragranceData: CreateFragranceDto = {
        name: 'Another Test Fragrance',
        brand: 'Another Brand',
        listType: 'wishlist'
      };

      const created = await fragranceRepo.create(testUserId, fragranceData);
      const found = await fragranceRepo.findById(created.id);

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.name).toBe(fragranceData.name);
    });

    it('should find fragrances by user id', async () => {
      const result = await fragranceRepo.findByUserId(testUserId);

      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
    });

    it('should update fragrance', async () => {
      const fragranceData: CreateFragranceDto = {
        name: 'Update Test',
        brand: 'Update Brand',
        personalRating: 5
      };

      const created = await fragranceRepo.create(testUserId, fragranceData);
      const updated = await fragranceRepo.update(created.id, {
        personalRating: 9,
        personalNotes: 'Updated notes'
      });

      expect(updated).toBeDefined();
      expect(updated!.personalRating).toBe(9);
      expect(updated!.personalNotes).toBe('Updated notes');
    });

    it('should delete fragrance', async () => {
      const fragranceData: CreateFragranceDto = {
        name: 'Delete Test',
        brand: 'Delete Brand'
      };

      const created = await fragranceRepo.create(testUserId, fragranceData);
      const deleted = await fragranceRepo.delete(created.id);

      expect(deleted).toBe(true);

      const found = await fragranceRepo.findById(created.id);
      expect(found).toBeNull();
    });
  });

  describe('Inventory Repository', () => {
    let fragranceRepo: any;
    let inventoryRepo: any;
    const testUserId = 'test-user-inventory';

    beforeAll(() => {
      fragranceRepo = RepositoryFactory.getFragranceRepository();
      inventoryRepo = RepositoryFactory.getInventoryRepository();
    });

    it('should create inventory for fragrance', async () => {
      // First create a fragrance
      const fragrance = await fragranceRepo.create(testUserId, {
        name: 'Inventory Test',
        brand: 'Test Brand'
      });

      const inventoryData = {
        fragranceId: fragrance.id,
        bottleSize: 100,
        currentLevel: 80,
        purchaseDate: new Date('2023-01-01'),
        usageTracking: true,
        lowThreshold: 25
      };

      const inventory = await inventoryRepo.create(inventoryData);

      expect(inventory).toBeDefined();
      expect(inventory.fragranceId).toBe(fragrance.id);
      expect(inventory.bottleSize).toBe(100);
      expect(inventory.currentLevel).toBe(80);
      expect(inventory.usageTracking).toBe(true);
    });

    it('should find inventory by fragrance id', async () => {
      const fragrance = await fragranceRepo.create(testUserId, {
        name: 'Find Inventory Test',
        brand: 'Test Brand'
      });

      const created = await inventoryRepo.create({
        fragranceId: fragrance.id,
        bottleSize: 50,
        purchaseDate: new Date()
      });

      const found = await inventoryRepo.findByFragranceId(fragrance.id);

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.bottleSize).toBe(50);
    });
  });
});