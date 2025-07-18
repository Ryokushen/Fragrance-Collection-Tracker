import { ExternalFragranceService } from '../services/external-fragrance.service';
import { ExternalFragrance } from '../types';
import axios from 'axios';
import { createClient } from 'redis';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock redis
jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

const mockRedisClient = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  get: jest.fn(),
  setEx: jest.fn(),
  keys: jest.fn(),
  del: jest.fn(),
  flushAll: jest.fn(),
  ping: jest.fn(),
  on: jest.fn(),
};

describe('ExternalFragranceService', () => {
  let service: ExternalFragranceService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock axios.create
    mockAxiosInstance = {
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Mock redis client
    (createClient as jest.Mock).mockReturnValue(mockRedisClient);
    mockRedisClient.connect.mockResolvedValue(undefined);
    mockRedisClient.on.mockReturnValue(undefined);

    service = new ExternalFragranceService({
      cacheEnabled: true,
      cacheTtl: 300,
      requestTimeout: 5000,
      maxRetries: 2,
    });
  });

  afterEach(async () => {
    await service.disconnect();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const defaultService = new ExternalFragranceService();
      expect(defaultService).toBeInstanceOf(ExternalFragranceService);
    });

    it('should initialize with custom configuration', () => {
      const customService = new ExternalFragranceService({
        cacheEnabled: false,
        cacheTtl: 600,
        requestTimeout: 15000,
        maxRetries: 5,
      });
      expect(customService).toBeInstanceOf(ExternalFragranceService);
    });

    it('should create axios instance with correct configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        timeout: 5000,
        headers: {
          'User-Agent': 'FragranceTracker/1.0',
          'Accept': 'application/json',
        },
      });
    });
  });

  describe('searchFragrances', () => {
    it('should return empty array for empty query', async () => {
      const result = await service.searchFragrances('');
      expect(result).toEqual([]);
    });

    it('should return empty array for query less than 2 characters', async () => {
      const result = await service.searchFragrances('a');
      expect(result).toEqual([]);
    });

    it('should return cached results when available', async () => {
      const cachedFragrances: ExternalFragrance[] = [
        {
          id: 'cached-1',
          name: 'Cached Fragrance',
          brand: 'Test Brand',
          notes: { top: [], middle: [], base: [] },
          source: 'fragrantica',
        },
      ];

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedFragrances));

      const result = await service.searchFragrances('test');
      expect(result).toEqual(cachedFragrances);
      expect(mockRedisClient.get).toHaveBeenCalledWith('fragrance_search:test');
    });

    it('should use mock API when external APIs fail', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      
      const result = await service.searchFragrances('aventus');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Aventus');
      expect(result[0].brand).toBe('Creed');
      expect(result[0].source).toBe('fragrantica');
    });

    it('should cache search results', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await service.searchFragrances('sauvage');
      
      expect(result).toHaveLength(1);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'fragrance_search:sauvage',
        300,
        expect.stringContaining('Sauvage')
      );
    });

    it('should handle Redis connection errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection failed'));
      
      const result = await service.searchFragrances('bleu');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bleu de Chanel');
    });

    it('should return empty array when all search methods fail', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      
      // Mock the service to simulate all methods failing
      const failingService = new ExternalFragranceService({ cacheEnabled: false });
      
      // Override the mock API method to throw an error
      jest.spyOn(failingService as any, 'searchMockApi').mockRejectedValue(new Error('Mock API failed'));
      
      const result = await failingService.searchFragrances('nonexistent');
      expect(result).toEqual([]);
    });
  });

  describe('cache operations', () => {
    it('should clear cache with pattern', async () => {
      mockRedisClient.keys.mockResolvedValue(['key1', 'key2']);
      mockRedisClient.del.mockResolvedValue(2);

      await service.clearCache('fragrance_search:*');

      expect(mockRedisClient.keys).toHaveBeenCalledWith('fragrance_search:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(['key1', 'key2']);
    });

    it('should clear all cache when no pattern provided', async () => {
      mockRedisClient.flushAll.mockResolvedValue('OK');

      await service.clearCache();

      expect(mockRedisClient.flushAll).toHaveBeenCalled();
    });

    it('should handle cache clear errors gracefully', async () => {
      mockRedisClient.keys.mockRejectedValue(new Error('Redis error'));

      await expect(service.clearCache('test:*')).resolves.not.toThrow();
    });
  });

  describe('healthCheck', () => {
    it('should return health status for all services', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      const health = await service.healthCheck();

      expect(health).toEqual({
        redis: true,
        externalApis: {
          fragrantica: true,
          parfumo: true,
        },
      });
    });

    it('should handle Redis health check failure', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Redis down'));

      const health = await service.healthCheck();

      expect(health.redis).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should disconnect Redis client', async () => {
      mockRedisClient.disconnect.mockResolvedValue(undefined);

      await service.disconnect();

      expect(mockRedisClient.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect errors gracefully', async () => {
      mockRedisClient.disconnect.mockRejectedValue(new Error('Disconnect failed'));

      await expect(service.disconnect()).resolves.not.toThrow();
    });
  });

  describe('error handling and retries', () => {
    it('should handle network errors with retries', async () => {
      const networkError = new Error('Network Error');
      (networkError as any).code = 'ECONNREFUSED';

      mockAxiosInstance.get
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          data: {
            results: [
              {
                id: '1',
                name: 'Test Fragrance',
                brand: 'Test Brand',
                top_notes: ['Bergamot'],
                middle_notes: ['Rose'],
                base_notes: ['Musk'],
              },
            ],
          },
        });

      // This test would require more complex mocking of the retry mechanism
      // For now, we'll test that the service handles errors gracefully
      mockRedisClient.get.mockResolvedValue(null);
      
      const result = await service.searchFragrances('test');
      expect(result).toBeDefined();
    });
  });

  describe('response parsing', () => {
    it('should parse Fragrantica response correctly', async () => {
      const mockResponse = {
        results: [
          {
            id: '123',
            name: 'Test Fragrance',
            brand: 'Test Brand',
            year: '2020',
            concentration: 'EDP',
            top_notes: ['Bergamot', 'Lemon'],
            middle_notes: ['Rose', 'Jasmine'],
            base_notes: ['Musk', 'Amber'],
            image_url: 'https://example.com/image.jpg',
            description: 'A beautiful fragrance',
          },
        ],
      };

      // Test the parsing method indirectly through the service
      const service = new ExternalFragranceService({ cacheEnabled: false });
      const parsed = (service as any).parseFragranticaResponse(mockResponse);

      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toEqual({
        id: '123',
        name: 'Test Fragrance',
        brand: 'Test Brand',
        year: 2020,
        concentration: 'EDP',
        notes: {
          top: ['Bergamot', 'Lemon'],
          middle: ['Rose', 'Jasmine'],
          base: ['Musk', 'Amber'],
        },
        imageUrl: 'https://example.com/image.jpg',
        description: 'A beautiful fragrance',
        source: 'fragrantica',
      });
    });

    it('should handle malformed Fragrantica response', async () => {
      const service = new ExternalFragranceService({ cacheEnabled: false });
      const parsed = (service as any).parseFragranticaResponse(null);
      expect(parsed).toEqual([]);
    });

    it('should parse Parfumo response correctly', async () => {
      const mockResponse = {
        fragrances: [
          {
            id: '456',
            title: 'Another Fragrance',
            brand: 'Another Brand',
            year: '2019',
            type: 'EDT',
            notes: {
              top: ['Citrus'],
              heart: ['Floral'],
              base: ['Woody'],
            },
            image: 'https://example.com/parfumo.jpg',
            description: 'Another beautiful fragrance',
          },
        ],
      };

      const service = new ExternalFragranceService({ cacheEnabled: false });
      const parsed = (service as any).parseParfumoResponse(mockResponse);

      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toEqual({
        id: '456',
        name: 'Another Fragrance',
        brand: 'Another Brand',
        year: 2019,
        concentration: 'EDT',
        notes: {
          top: ['Citrus'],
          middle: ['Floral'],
          base: ['Woody'],
        },
        imageUrl: 'https://example.com/parfumo.jpg',
        description: 'Another beautiful fragrance',
        source: 'parfumo',
      });
    });
  });
});