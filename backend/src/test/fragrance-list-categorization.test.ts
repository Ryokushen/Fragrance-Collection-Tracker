import request from 'supertest';
import { Express } from 'express';
import { RepositoryFactory } from '../models';
import { createTestApp } from '../index';
import { CreateFragranceDto, Fragrance } from '../types';

describe('Fragrance List Categorization', () => {
  let app: Express;
  let testFragrances: Fragrance[] = [];

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Initialize database and run migrations
    const { initializeDatabase } = await import('../database/connection');
    const { runMigrations } = await import('../database/migrations');
    
    await initializeDatabase();
    await runMigrations();
    
    // Initialize repository factory
    await RepositoryFactory.initialize();
    
    // Create test user
    const db = await import('../database/connection').then(m => m.getDatabase());
    await db.run(`
      INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at, updated_at) 
      VALUES ('temp-user-id', 'test@example.com', 'hash', 'Test User', datetime('now'), datetime('now'))
    `);
    
    // Create app without starting server
    app = createTestApp();
  });

  afterAll(async () => {
    // Close database connections and cleanup
    const { closeDatabase } = await import('../database/connection');
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up and create test data
    const fragranceRepo = RepositoryFactory.getFragranceRepository();
    
    // Create test fragrances with different list types
    const testData: CreateFragranceDto[] = [
      {
        name: 'Owned Fragrance 1',
        brand: 'Test Brand A',
        listType: 'owned',
        personalRating: 8,
        personalNotes: 'Love this one'
      },
      {
        name: 'Owned Fragrance 2',
        brand: 'Test Brand B',
        listType: 'owned',
        personalRating: 6
      },
      {
        name: 'Tried Fragrance 1',
        brand: 'Test Brand A',
        listType: 'tried',
        personalRating: 7,
        personalNotes: 'Nice but not for me'
      },
      {
        name: 'Wishlist Fragrance 1',
        brand: 'Test Brand C',
        listType: 'wishlist',
        personalNotes: 'Want to try this'
      },
      {
        name: 'Wishlist Fragrance 2',
        brand: 'Test Brand A',
        listType: 'wishlist'
      }
    ];

    testFragrances = [];
    for (const data of testData) {
      const fragrance = await fragranceRepo.create('temp-user-id', data);
      testFragrances.push(fragrance);
    }
  });

  afterEach(async () => {
    // Clean up test data
    const fragranceRepo = RepositoryFactory.getFragranceRepository();
    for (const fragrance of testFragrances) {
      await fragranceRepo.delete(fragrance.id);
    }
    testFragrances = [];
  });

  describe('GET /api/fragrances - List Type Filtering', () => {
    it('should filter fragrances by owned list type', async () => {
      const response = await request(app)
        .get('/api/fragrances')
        .query({ listType: 'owned' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((f: Fragrance) => f.listType === 'owned')).toBe(true);
      
      const names = response.body.data.map((f: Fragrance) => f.name);
      expect(names).toContain('Owned Fragrance 1');
      expect(names).toContain('Owned Fragrance 2');
    });

    it('should filter fragrances by tried list type', async () => {
      const response = await request(app)
        .get('/api/fragrances')
        .query({ listType: 'tried' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].listType).toBe('tried');
      expect(response.body.data[0].name).toBe('Tried Fragrance 1');
    });

    it('should filter fragrances by wishlist list type', async () => {
      const response = await request(app)
        .get('/api/fragrances')
        .query({ listType: 'wishlist' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((f: Fragrance) => f.listType === 'wishlist')).toBe(true);
      
      const names = response.body.data.map((f: Fragrance) => f.name);
      expect(names).toContain('Wishlist Fragrance 1');
      expect(names).toContain('Wishlist Fragrance 2');
    });

    it('should return all fragrances when no list type filter is applied', async () => {
      const response = await request(app)
        .get('/api/fragrances')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
    });

    it('should combine list type filter with other filters', async () => {
      const response = await request(app)
        .get('/api/fragrances')
        .query({ 
          listType: 'owned',
          brand: 'Test Brand A'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].listType).toBe('owned');
      expect(response.body.data[0].brand).toBe('Test Brand A');
      expect(response.body.data[0].name).toBe('Owned Fragrance 1');
    });

    it('should return empty array for invalid list type filter', async () => {
      const response = await request(app)
        .get('/api/fragrances')
        .query({ listType: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/fragrances/:id/list-type', () => {
    it('should successfully update fragrance list type from wishlist to owned', async () => {
      const wishlistFragrance = testFragrances.find(f => f.listType === 'wishlist');
      expect(wishlistFragrance).toBeDefined();

      const response = await request(app)
        .put(`/api/fragrances/${wishlistFragrance!.id}/list-type`)
        .send({ listType: 'owned' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.listType).toBe('owned');
      expect(response.body.message).toContain('moved to owned list');

      // Verify the change persisted
      const getResponse = await request(app)
        .get(`/api/fragrances/${wishlistFragrance!.id}`)
        .expect(200);

      expect(getResponse.body.data.listType).toBe('owned');
    });

    it('should successfully update fragrance list type from tried to owned', async () => {
      const triedFragrance = testFragrances.find(f => f.listType === 'tried');
      expect(triedFragrance).toBeDefined();

      const response = await request(app)
        .put(`/api/fragrances/${triedFragrance!.id}/list-type`)
        .send({ listType: 'owned' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.listType).toBe('owned');
      expect(response.body.message).toContain('moved to owned list');
    });

    it('should successfully update fragrance list type from owned to wishlist', async () => {
      const ownedFragrance = testFragrances.find(f => f.listType === 'owned');
      expect(ownedFragrance).toBeDefined();

      const response = await request(app)
        .put(`/api/fragrances/${ownedFragrance!.id}/list-type`)
        .send({ listType: 'wishlist' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.listType).toBe('wishlist');
      expect(response.body.message).toContain('moved to wishlist list');
    });

    it('should successfully update fragrance list type from owned to tried', async () => {
      const ownedFragrance = testFragrances.find(f => f.listType === 'owned');
      expect(ownedFragrance).toBeDefined();

      const response = await request(app)
        .put(`/api/fragrances/${ownedFragrance!.id}/list-type`)
        .send({ listType: 'tried' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.listType).toBe('tried');
      expect(response.body.message).toContain('moved to tried list');
    });

    it('should return 400 for invalid list type', async () => {
      const fragrance = testFragrances[0];

      const response = await request(app)
        .put(`/api/fragrances/${fragrance.id}/list-type`)
        .send({ listType: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Invalid request data');
    });

    it('should return 400 for missing list type', async () => {
      const fragrance = testFragrances[0];

      const response = await request(app)
        .put(`/api/fragrances/${fragrance.id}/list-type`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent fragrance', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .put(`/api/fragrances/${nonExistentId}/list-type`)
        .send({ listType: 'owned' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Fragrance not found');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .put('/api/fragrances/invalid-uuid/list-type')
        .send({ listType: 'owned' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should preserve other fragrance properties when updating list type', async () => {
      const originalFragrance = testFragrances.find(f => f.personalRating && f.personalNotes);
      expect(originalFragrance).toBeDefined();

      const response = await request(app)
        .put(`/api/fragrances/${originalFragrance!.id}/list-type`)
        .send({ listType: 'tried' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.listType).toBe('tried');
      expect(response.body.data.personalRating).toBe(originalFragrance!.personalRating);
      expect(response.body.data.personalNotes).toBe(originalFragrance!.personalNotes);
      expect(response.body.data.name).toBe(originalFragrance!.name);
      expect(response.body.data.brand).toBe(originalFragrance!.brand);
    });
  });

  describe('List Type Transitions and Business Logic', () => {
    it('should handle multiple transitions correctly', async () => {
      const fragrance = testFragrances.find(f => f.listType === 'wishlist');
      expect(fragrance).toBeDefined();

      // Wishlist -> Tried
      let response = await request(app)
        .put(`/api/fragrances/${fragrance!.id}/list-type`)
        .send({ listType: 'tried' })
        .expect(200);

      expect(response.body.data.listType).toBe('tried');

      // Tried -> Owned
      response = await request(app)
        .put(`/api/fragrances/${fragrance!.id}/list-type`)
        .send({ listType: 'owned' })
        .expect(200);

      expect(response.body.data.listType).toBe('owned');

      // Owned -> Wishlist
      response = await request(app)
        .put(`/api/fragrances/${fragrance!.id}/list-type`)
        .send({ listType: 'wishlist' })
        .expect(200);

      expect(response.body.data.listType).toBe('wishlist');
    });

    it('should maintain data integrity during list type changes', async () => {
      // Get initial counts for each list type
      const initialOwned = await request(app)
        .get('/api/fragrances')
        .query({ listType: 'owned' });
      
      const initialTried = await request(app)
        .get('/api/fragrances')
        .query({ listType: 'tried' });

      const initialWishlist = await request(app)
        .get('/api/fragrances')
        .query({ listType: 'wishlist' });

      const ownedCount = initialOwned.body.data.length;
      const triedCount = initialTried.body.data.length;
      const wishlistCount = initialWishlist.body.data.length;

      // Move one fragrance from wishlist to owned
      const wishlistFragrance = testFragrances.find(f => f.listType === 'wishlist');
      await request(app)
        .put(`/api/fragrances/${wishlistFragrance!.id}/list-type`)
        .send({ listType: 'owned' })
        .expect(200);

      // Verify counts changed correctly
      const finalOwned = await request(app)
        .get('/api/fragrances')
        .query({ listType: 'owned' });
      
      const finalWishlist = await request(app)
        .get('/api/fragrances')
        .query({ listType: 'wishlist' });

      expect(finalOwned.body.data.length).toBe(ownedCount + 1);
      expect(finalWishlist.body.data.length).toBe(wishlistCount - 1);

      // Tried count should remain the same
      const finalTried = await request(app)
        .get('/api/fragrances')
        .query({ listType: 'tried' });
      expect(finalTried.body.data.length).toBe(triedCount);
    });
  });

  describe('Integration with Existing Functionality', () => {
    it('should work with sorting and list type filtering', async () => {
      const response = await request(app)
        .get('/api/fragrances')
        .query({ 
          listType: 'owned',
          sortBy: 'rating',
          sortOrder: 'desc'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((f: Fragrance) => f.listType === 'owned')).toBe(true);
      
      // Should be sorted by rating descending
      expect(response.body.data[0].personalRating).toBeGreaterThanOrEqual(
        response.body.data[1].personalRating || 0
      );
    });

    it('should work with pagination and list type filtering', async () => {
      const response = await request(app)
        .get('/api/fragrances')
        .query({ 
          listType: 'wishlist',
          page: 1,
          limit: 1
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].listType).toBe('wishlist');
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    it('should work with search and list type filtering', async () => {
      const response = await request(app)
        .get('/api/fragrances')
        .query({ 
          listType: 'owned',
          search: 'Brand A'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].listType).toBe('owned');
      expect(response.body.data[0].brand).toBe('Test Brand A');
    });
  });
});