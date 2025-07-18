-- Initial database schema for Fragrance Collection Tracker
-- Migration: 001_initial_schema

-- Users table (for future authentication)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fragrances table
CREATE TABLE IF NOT EXISTS fragrances (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    year INTEGER,
    concentration TEXT, -- EDT, EDP, Parfum, etc.
    top_notes TEXT, -- JSON array as string
    middle_notes TEXT, -- JSON array as string
    base_notes TEXT, -- JSON array as string
    external_id TEXT, -- Reference to external database
    personal_rating INTEGER CHECK (personal_rating >= 1 AND personal_rating <= 10),
    personal_notes TEXT,
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    purchase_retailer TEXT,
    list_type TEXT NOT NULL DEFAULT 'owned' CHECK (list_type IN ('owned', 'tried', 'wishlist')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    fragrance_id TEXT NOT NULL,
    bottle_size INTEGER NOT NULL, -- in ml
    current_level INTEGER NOT NULL DEFAULT 100 CHECK (current_level >= 0 AND current_level <= 100), -- percentage
    purchase_date DATE NOT NULL,
    opened_date DATE,
    usage_tracking BOOLEAN DEFAULT 1,
    low_threshold INTEGER DEFAULT 20 CHECK (low_threshold >= 0 AND low_threshold <= 100), -- percentage
    estimated_days_remaining INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fragrance_id) REFERENCES fragrances(id) ON DELETE CASCADE
);

-- Daily wear tracking table
CREATE TABLE IF NOT EXISTS daily_wear (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    weather TEXT,
    occasion TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, date)
);

-- Daily wear entries (many-to-many relationship between daily_wear and fragrances)
CREATE TABLE IF NOT EXISTS daily_wear_entries (
    id TEXT PRIMARY KEY,
    daily_wear_id TEXT NOT NULL,
    fragrance_id TEXT NOT NULL,
    spray_count INTEGER,
    body_parts TEXT, -- JSON array as string
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (daily_wear_id) REFERENCES daily_wear(id) ON DELETE CASCADE,
    FOREIGN KEY (fragrance_id) REFERENCES fragrances(id) ON DELETE CASCADE
);

-- Usage entries for detailed tracking
CREATE TABLE IF NOT EXISTS usage_entries (
    id TEXT PRIMARY KEY,
    fragrance_id TEXT NOT NULL,
    date DATE NOT NULL,
    spray_count INTEGER NOT NULL,
    estimated_usage DECIMAL(5,2), -- in ml
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fragrance_id) REFERENCES fragrances(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fragrances_user_id ON fragrances(user_id);
CREATE INDEX IF NOT EXISTS idx_fragrances_brand ON fragrances(brand);
CREATE INDEX IF NOT EXISTS idx_fragrances_list_type ON fragrances(list_type);
CREATE INDEX IF NOT EXISTS idx_fragrances_rating ON fragrances(personal_rating);
CREATE INDEX IF NOT EXISTS idx_inventory_fragrance_id ON inventory(fragrance_id);
CREATE INDEX IF NOT EXISTS idx_daily_wear_user_date ON daily_wear(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_wear_entries_fragrance ON daily_wear_entries(fragrance_id);
CREATE INDEX IF NOT EXISTS idx_usage_entries_fragrance_date ON usage_entries(fragrance_id, date);

-- Triggers to update updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON users
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_fragrances_timestamp 
    AFTER UPDATE ON fragrances
    BEGIN
        UPDATE fragrances SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_inventory_timestamp 
    AFTER UPDATE ON inventory
    BEGIN
        UPDATE inventory SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_daily_wear_timestamp 
    AFTER UPDATE ON daily_wear
    BEGIN
        UPDATE daily_wear SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;