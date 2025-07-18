# External Fragrance API Integration Service

This service provides integration with external fragrance databases to search for fragrance information.

## Features

- **Multi-source search**: Supports multiple external APIs (Fragrantica, Parfumo) with fallback to mock data
- **Redis caching**: Caches search results to improve performance and reduce API calls
- **Error handling**: Graceful fallback when external APIs are unavailable
- **Retry mechanism**: Automatic retry with exponential backoff for transient failures
- **Health monitoring**: Built-in health check for Redis and external APIs

## Usage

### Basic Usage

```typescript
import { ExternalFragranceService } from './external-fragrance.service';

const service = new ExternalFragranceService({
  cacheEnabled: true,
  cacheTtl: 3600, // 1 hour
  requestTimeout: 10000, // 10 seconds
  maxRetries: 3
});

// Search for fragrances
const fragrances = await service.searchFragrances('aventus');

// Health check
const health = await service.healthCheck();

// Clear cache
await service.clearCache('fragrance_search:*');

// Cleanup
await service.disconnect();
```

### Configuration Options

- `redisUrl`: Redis connection URL (default: `redis://localhost:6379`)
- `cacheEnabled`: Enable/disable caching (default: `true`)
- `cacheTtl`: Cache time-to-live in seconds (default: `3600`)
- `requestTimeout`: HTTP request timeout in milliseconds (default: `10000`)
- `maxRetries`: Maximum number of retry attempts (default: `3`)

### Environment Variables

Set these in your `.env` file:

```bash
REDIS_URL=redis://localhost:6379
FRAGRANTICA_API_KEY=your-api-key
PARFUMO_API_KEY=your-api-key
```

## API Response Format

The service returns an array of `ExternalFragrance` objects:

```typescript
interface ExternalFragrance {
  id: string;
  name: string;
  brand: string;
  year?: number;
  concentration?: string;
  notes: {
    top: string[];
    middle: string[];
    base: string[];
  };
  imageUrl?: string;
  description?: string;
  source: 'fragrantica' | 'parfumo' | 'manual';
}
```

## Error Handling

The service implements comprehensive error handling:

- **Network errors**: Automatic retry with exponential backoff
- **API failures**: Fallback to alternative sources
- **Cache errors**: Graceful degradation without caching
- **Invalid responses**: Safe parsing with default values

## Testing

Run the test suite:

```bash
npm test -- external-fragrance.service.test.ts
```

The tests cover:
- Service initialization
- Search functionality
- Caching behavior
- Error handling
- Health checks
- Response parsing

## Integration with Controllers

The service integrates with Express.js controllers:

```typescript
import { FragranceController } from '../controllers/fragrance.controller';

const controller = new FragranceController();

// GET /api/fragrances/search?q=query
app.get('/api/fragrances/search', (req, res) => 
  controller.searchFragrances(req, res)
);
```

## Production Considerations

1. **Redis Setup**: Ensure Redis is properly configured and monitored
2. **API Keys**: Secure your external API keys
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Monitoring**: Monitor cache hit rates and API response times
5. **Fallback Data**: Consider maintaining a local database for critical fragrances

## Future Enhancements

- Support for additional fragrance databases
- Advanced search filters (brand, year, notes)
- Image processing and optimization
- Batch search capabilities
- Real-time fragrance data updates