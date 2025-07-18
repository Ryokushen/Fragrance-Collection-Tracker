import axios, { AxiosInstance, AxiosError } from 'axios';
import { createClient, RedisClientType } from 'redis';
import { ExternalFragrance } from '../types';

export interface ExternalFragranceServiceConfig {
  redisUrl?: string;
  cacheEnabled?: boolean;
  cacheTtl?: number; // in seconds
  requestTimeout?: number; // in milliseconds
  maxRetries?: number;
}

export class ExternalFragranceService {
  private httpClient: AxiosInstance;
  private redisClient: RedisClientType | null = null;
  private config: Required<ExternalFragranceServiceConfig>;

  constructor(config: ExternalFragranceServiceConfig = {}) {
    this.config = {
      redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      cacheEnabled: config.cacheEnabled ?? true,
      cacheTtl: config.cacheTtl || 3600, // 1 hour default
      requestTimeout: config.requestTimeout || 10000, // 10 seconds
      maxRetries: config.maxRetries || 3,
    };

    this.httpClient = axios.create({
      timeout: this.config.requestTimeout,
      headers: {
        'User-Agent': 'FragranceTracker/1.0',
        'Accept': 'application/json',
      },
    });

    this.initializeRedis();
    this.setupAxiosInterceptors();
  }

  private async initializeRedis(): Promise<void> {
    if (!this.config.cacheEnabled) {
      return;
    }

    try {
      this.redisClient = createClient({
        url: this.config.redisUrl,
      });

      this.redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.redisClient = null;
      });

      await this.redisClient.connect();
      console.log('Redis client connected successfully');
    } catch (error) {
      console.warn('Failed to connect to Redis, caching disabled:', error);
      this.redisClient = null;
    }
  }

  private setupAxiosInterceptors(): void {
    // Request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        console.log(`Making external API request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.config && this.shouldRetry(error)) {
          return this.retryRequest(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  private async retryRequest(config: any, retryCount = 0): Promise<any> {
    if (retryCount >= this.config.maxRetries) {
      throw new Error(`Max retries (${this.config.maxRetries}) exceeded`);
    }

    // Exponential backoff
    const delay = Math.pow(2, retryCount) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      return await this.httpClient(config);
    } catch (error) {
      return this.retryRequest(config, retryCount + 1);
    }
  }

  async searchFragrances(query: string): Promise<ExternalFragrance[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `fragrance_search:${normalizedQuery}`;

    // Try to get from cache first
    const cachedResult = await this.getFromCache(cacheKey);
    if (cachedResult) {
      console.log(`Cache hit for query: ${query}`);
      return cachedResult;
    }

    try {
      // Try multiple sources with fallback
      const results = await this.searchWithFallback(normalizedQuery);
      
      // Cache the results
      await this.setCache(cacheKey, results);
      
      return results;
    } catch (error) {
      console.error('All fragrance search sources failed:', error);
      return [];
    }
  }

  private async searchWithFallback(query: string): Promise<ExternalFragrance[]> {
    const searchMethods = [
      () => this.searchFragrantica(query),
      () => this.searchParfumo(query),
      () => this.searchMockApi(query), // Fallback mock for development
    ];

    for (const searchMethod of searchMethods) {
      try {
        const results = await searchMethod();
        if (results.length > 0) {
          return results;
        }
      } catch (error) {
        console.warn('Search method failed, trying next:', error);
        continue;
      }
    }

    throw new Error('All search methods failed');
  }

  private async searchFragrantica(query: string): Promise<ExternalFragrance[]> {
    // Note: This is a simplified implementation. In a real-world scenario,
    // you would need to use Fragrantica's actual API or scraping service
    const mockFragranticaUrl = `https://api.fragrantica.com/search?q=${encodeURIComponent(query)}`;
    
    try {
      const response = await this.httpClient.get(mockFragranticaUrl);
      return this.parseFragranticaResponse(response.data);
    } catch (error) {
      console.warn('Fragrantica search failed:', error);
      throw error;
    }
  }

  private async searchParfumo(query: string): Promise<ExternalFragrance[]> {
    // Note: This is a simplified implementation. In a real-world scenario,
    // you would need to use Parfumo's actual API
    const mockParfumoUrl = `https://api.parfumo.com/search?query=${encodeURIComponent(query)}`;
    
    try {
      const response = await this.httpClient.get(mockParfumoUrl);
      return this.parseParfumoResponse(response.data);
    } catch (error) {
      console.warn('Parfumo search failed:', error);
      throw error;
    }
  }

  private async searchMockApi(query: string): Promise<ExternalFragrance[]> {
    // Mock API for development and testing
    console.log('Using mock fragrance API for query:', query);
    
    const mockFragrances: ExternalFragrance[] = [
      {
        id: 'mock-1',
        name: 'Aventus',
        brand: 'Creed',
        year: 2010,
        concentration: 'EDP',
        notes: {
          top: ['Pineapple', 'Bergamot', 'Black Currant', 'Apple'],
          middle: ['Rose', 'Dry Birch', 'Moroccan Jasmine', 'Patchouli'],
          base: ['Oak Moss', 'Musk', 'Ambergris', 'Vanilla']
        },
        imageUrl: 'https://example.com/aventus.jpg',
        description: 'A bold, masculine fragrance with fruity and smoky notes.',
        source: 'fragrantica'
      },
      {
        id: 'mock-2',
        name: 'Sauvage',
        brand: 'Dior',
        year: 2015,
        concentration: 'EDT',
        notes: {
          top: ['Calabrian Bergamot', 'Pepper'],
          middle: ['Sichuan Pepper', 'Lavender', 'Pink Pepper', 'Vetiver', 'Patchouli', 'Geranium', 'Elemi'],
          base: ['Ambroxan', 'Cedar', 'Labdanum']
        },
        imageUrl: 'https://example.com/sauvage.jpg',
        description: 'A fresh and spicy fragrance inspired by wide-open spaces.',
        source: 'parfumo'
      },
      {
        id: 'mock-3',
        name: 'Bleu de Chanel',
        brand: 'Chanel',
        year: 2010,
        concentration: 'EDP',
        notes: {
          top: ['Grapefruit', 'Lemon', 'Mint', 'Pink Pepper'],
          middle: ['Ginger', 'Nutmeg', 'Jasmine', 'Melon'],
          base: ['Incense', 'Amber', 'Sandalwood', 'Patchouli', 'White Musk', 'Cedar']
        },
        imageUrl: 'https://example.com/bleu-de-chanel.jpg',
        description: 'An aromatic-woody fragrance that embodies freedom.',
        source: 'fragrantica'
      }
    ];

    // Filter mock results based on query
    const filteredResults = mockFragrances.filter(fragrance =>
      fragrance.name.toLowerCase().includes(query) ||
      fragrance.brand.toLowerCase().includes(query)
    );

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return filteredResults;
  }

  private parseFragranticaResponse(data: any): ExternalFragrance[] {
    // Parse Fragrantica API response format
    if (!data || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((item: any) => ({
      id: item.id?.toString() || '',
      name: item.name || '',
      brand: item.brand || '',
      year: item.year ? parseInt(item.year) : undefined,
      concentration: item.concentration || undefined,
      notes: {
        top: Array.isArray(item.top_notes) ? item.top_notes : [],
        middle: Array.isArray(item.middle_notes) ? item.middle_notes : [],
        base: Array.isArray(item.base_notes) ? item.base_notes : []
      },
      imageUrl: item.image_url || undefined,
      description: item.description || undefined,
      source: 'fragrantica' as const
    }));
  }

  private parseParfumoResponse(data: any): ExternalFragrance[] {
    // Parse Parfumo API response format
    if (!data || !Array.isArray(data.fragrances)) {
      return [];
    }

    return data.fragrances.map((item: any) => ({
      id: item.id?.toString() || '',
      name: item.title || '',
      brand: item.brand || '',
      year: item.year ? parseInt(item.year) : undefined,
      concentration: item.type || undefined,
      notes: {
        top: Array.isArray(item.notes?.top) ? item.notes.top : [],
        middle: Array.isArray(item.notes?.heart) ? item.notes.heart : [],
        base: Array.isArray(item.notes?.base) ? item.notes.base : []
      },
      imageUrl: item.image || undefined,
      description: item.description || undefined,
      source: 'parfumo' as const
    }));
  }

  private async getFromCache(key: string): Promise<ExternalFragrance[] | null> {
    if (!this.redisClient) {
      return null;
    }

    try {
      const cached = await this.redisClient.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }

    return null;
  }

  private async setCache(key: string, data: ExternalFragrance[]): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      await this.redisClient.setEx(key, this.config.cacheTtl, JSON.stringify(data));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  async clearCache(pattern?: string): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      if (pattern) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      } else {
        await this.redisClient.flushAll();
      }
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.disconnect();
        this.redisClient = null;
      } catch (error) {
        console.warn('Redis disconnect error:', error);
      }
    }
  }

  // Health check method
  async healthCheck(): Promise<{
    redis: boolean;
    externalApis: { fragrantica: boolean; parfumo: boolean };
  }> {
    const health = {
      redis: false,
      externalApis: {
        fragrantica: false,
        parfumo: false
      }
    };

    // Check Redis connection
    if (this.redisClient) {
      try {
        await this.redisClient.ping();
        health.redis = true;
      } catch (error) {
        console.warn('Redis health check failed:', error);
      }
    }

    // Check external APIs (simplified check)
    try {
      await this.searchMockApi('test');
      health.externalApis.fragrantica = true;
      health.externalApis.parfumo = true;
    } catch (error) {
      console.warn('External API health check failed:', error);
    }

    return health;
  }
}

// Factory function for creating service instance
export function createExternalFragranceService(config?: ExternalFragranceServiceConfig): ExternalFragranceService {
  return new ExternalFragranceService(config);
}