// Main server entry point - basic setup for now

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase } from './database/connection';
import { runMigrations } from './database/migrations';
import { seedTestData } from './database/seed';
import { RepositoryFactory } from './models';
import { getSchedulerService } from './services';
import fragranceRoutes from './routes/fragrance.routes';
import inventoryRoutes from './routes/inventory.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (_req, res) => {
  res.json({ message: 'Fragrance Collection Tracker API' });
});

app.use('/api/fragrances', fragranceRoutes);
app.use('/api/inventory', inventoryRoutes);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: { 
      code: 'INTERNAL_ERROR', 
      message: 'Something went wrong!' 
    } 
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ 
    success: false, 
    error: { 
      code: 'NOT_FOUND', 
      message: 'Route not found' 
    } 
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase();
    console.log('📦 Database initialized');

    // Run migrations
    await runMigrations();
    console.log('📦 Database migrations completed');

    // Seed test data
    await seedTestData();
    console.log('📦 Test data seeded');

    // Initialize repository factory
    await RepositoryFactory.initialize();
    console.log('📦 Repository factory initialized');

    // Start background jobs
    const scheduler = getSchedulerService();
    scheduler.startInventoryRecalculationJob();
    console.log('📅 Background jobs started');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();