-- Initial migration: Create all 6 tables
-- This migration is idempotent (uses IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS poop_logs (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  type_id INTEGER,
  comment TEXT,
  location_lat REAL,
  location_lng REAL,
  location_city TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS piss_logs (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  color_id INTEGER,
  smell TEXT,
  comment TEXT,
  location_lat REAL,
  location_lng REAL,
  location_city TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS period_logs (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  flow_level TEXT,
  symptoms TEXT,
  mood TEXT,
  cycle_day INTEGER,
  comment TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_colors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hex_value TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Migration journal table for tracking applied migrations
CREATE TABLE IF NOT EXISTS _journal (
  idx INTEGER PRIMARY KEY,
  version TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
