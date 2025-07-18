# Fragrance Collection Tracker

A personal application for fragrance enthusiasts to manage their collection, track inventory levels, and maintain a calendar of daily fragrance wear.

## Features

- **Collection Management**: Add fragrances from online databases or manually
- **Rating & Notes System**: Rate fragrances (1-10 scale) and add personal notes
- **Inventory Tracking**: Monitor bottle levels and usage patterns
- **Daily Wear Calendar**: Record which fragrances you wore each day
- **List Organization**: Categorize fragrances as owned, tried, or wishlist items
- **Advanced Filtering**: Filter and sort by ratings, brands, and collection status

## Project Structure

```
fragrance-collection-tracker/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── services/        # Business logic layer
│   │   ├── models/          # Database models and repositories
│   │   ├── types/           # TypeScript type definitions
│   │   └── index.ts         # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── types/           # TypeScript type definitions
│   │   ├── test/            # Test setup and utilities
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # React entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── package.json             # Root package.json for scripts
```

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite (development), PostgreSQL (production)
- **Caching**: Redis
- **Testing**: Jest with Supertest

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router
- **State Management**: React Query
- **Testing**: Vitest with React Testing Library

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Redis (for caching)

### Installation

1. Clone the repository
2. Install dependencies for all packages:
   ```bash
   npm run install:all
   ```

3. Set up environment variables:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

4. Start the development servers:
   ```bash
   npm run dev
   ```

This will start:
- Backend API server on http://localhost:3001
- Frontend React app on http://localhost:3000

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both applications for production
- `npm run test` - Run tests for both applications
- `npm run dev:backend` - Start only the backend server
- `npm run dev:frontend` - Start only the frontend application

## Development Status

This project is actively under development with significant backend functionality completed. Current implementation status:

### ✅ **Completed Features**
1. **Project Setup** - Complete project structure and configuration
2. **Database Schema** - Full SQLite schema with migrations and seeding
3. **Core Data Models** - Repository pattern with comprehensive type definitions
4. **Fragrance Management** - Complete CRUD operations for fragrance collection
5. **Inventory Tracking** - Bottle level monitoring with usage calculations
6. **Calendar & Daily Wear** - Daily fragrance usage tracking with statistics
7. **Rating & Personal Notes System** - 1-10 rating scale with personal notes (2000 char limit)
8. **External API Integration** - Fragrance database search capabilities
9. **Background Jobs** - Automated inventory recalculation scheduling
10. **Comprehensive Testing** - Unit tests for all services and controllers (59 passing tests)

### 🔄 **In Progress**
- **API Documentation** - OpenAPI/Swagger documentation
- **Frontend Development** - React components and UI implementation

### ⏳ **Planned**
- **Frontend Integration** - Connect React app to backend APIs
- **User Authentication** - Login/registration system
- **Advanced Analytics** - Usage trends and collection insights
- **Mobile Responsiveness** - Optimized mobile experience
- **Deployment** - Production configuration and hosting

### **Current Backend API Endpoints**
- **Fragrances**: `/api/fragrances` - Collection management
- **Inventory**: `/api/inventory` - Bottle tracking and alerts
- **Daily Wear**: `/api/daily-wear` - Usage calendar and statistics
- **Health Check**: `/health` - System status monitoring

## API Documentation

API documentation will be available once the backend endpoints are implemented.

## Contributing

This is a personal project, but suggestions and feedback are welcome through issues.

## License

MIT License