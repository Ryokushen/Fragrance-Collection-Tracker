import { Database } from 'sqlite';
import { getDatabase, DatabaseError } from '../connection';
import fs from 'fs/promises';
import path from 'path';

interface Migration {
  id: string;
  filename: string;
  sql: string;
}

export class MigrationRunner {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  async initialize(): Promise<void> {
    // Create migrations table to track applied migrations
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async getAppliedMigrations(): Promise<string[]> {
    const result = await this.db.all('SELECT id FROM migrations ORDER BY applied_at');
    return result.map(row => row.id);
  }

  async loadMigrations(): Promise<Migration[]> {
    const migrationsDir = __dirname;
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(file => file.endsWith('.sql')).sort();

    const migrations: Migration[] = [];
    for (const filename of sqlFiles) {
      const filePath = path.join(migrationsDir, filename);
      const sql = await fs.readFile(filePath, 'utf-8');
      const id = filename.replace('.sql', '');
      migrations.push({ id, filename, sql });
    }

    return migrations;
  }

  async runMigrations(): Promise<void> {
    try {
      await this.initialize();
      
      const appliedMigrations = await this.getAppliedMigrations();
      const allMigrations = await this.loadMigrations();
      
      const pendingMigrations = allMigrations.filter(
        migration => !appliedMigrations.includes(migration.id)
      );

      if (pendingMigrations.length === 0) {
        console.log('📦 No pending migrations');
        return;
      }

      console.log(`📦 Running ${pendingMigrations.length} migration(s)...`);

      for (const migration of pendingMigrations) {
        console.log(`📦 Applying migration: ${migration.filename}`);
        
        await this.db.exec('BEGIN TRANSACTION');
        
        try {
          await this.db.exec(migration.sql);
          await this.db.run(
            'INSERT INTO migrations (id, filename) VALUES (?, ?)',
            [migration.id, migration.filename]
          );
          await this.db.exec('COMMIT');
          
          console.log(`✅ Migration applied: ${migration.filename}`);
        } catch (error) {
          await this.db.exec('ROLLBACK');
          throw new DatabaseError(
            `Failed to apply migration ${migration.filename}`,
            'MIGRATION_ERROR',
            error
          );
        }
      }

      console.log('✅ All migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
}

export async function runMigrations(): Promise<void> {
  const db = await getDatabase();
  const runner = new MigrationRunner(db);
  await runner.runMigrations();
}