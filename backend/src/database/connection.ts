import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function initializeDatabase(): Promise<Database> {
  if (db) {
    return db;
  }

  const dbPath = process.env.NODE_ENV === 'test' 
    ? ':memory:' 
    : path.join(process.cwd(), 'data', 'fragrance_tracker.db');

  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');
    
    console.log(`📦 Database connected: ${dbPath}`);
    return db;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw new Error(`Failed to connect to database: ${error}`);
  }
}

export async function getDatabase(): Promise<Database> {
  if (!db) {
    return await initializeDatabase();
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    console.log('📦 Database connection closed');
  }
}

// Error handling utility
export class DatabaseError extends Error {
  constructor(message: string, public code?: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}