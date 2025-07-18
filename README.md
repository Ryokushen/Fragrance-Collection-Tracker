# Fragrance Collection Tracker

A personal application for fragrance enthusiasts to manage their collection, track inventory levels, and maintain a calendar of daily fragrance wear.

## Features

- **Collection Management**: Add fragrances from online databases or manually
- **Inventory Tracking**: Monitor bottle levels and usage patterns
- **Daily Wear Calendar**: Record which fragrances you wore each day
- **Rating System**: Rate and organize your fragrances
- **List Organization**: Categorize fragrances as owned, tried, or wishlist items

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

This project is currently in development. The basic project structure and core interfaces have been established. Implementation will proceed through the following phases:

1. ✅ **Project Setup** - Basic structure and configuration
2. 🔄 **Database Schema** - Data models and migrations
3. ⏳ **API Development** - Backend services and endpoints
4. ⏳ **Frontend Components** - React UI components
5. ⏳ **Integration** - Connect frontend to backend
6. ⏳ **Testing** - Comprehensive test suite
7. ⏳ **Deployment** - Production configuration

## API Documentation

API documentation will be available once the backend endpoints are implemented.

## Contributing

This is a personal project, but suggestions and feedback are welcome through issues.

## License

MIT License