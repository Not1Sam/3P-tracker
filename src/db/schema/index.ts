import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Poop logs table - Tier 2 (syncs monthly)
export const poopLogs = sqliteTable('poop_logs', {
  id: text('id').primaryKey(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  typeId: integer('type_id'), // References Bristol chart 1-7 or custom_types
  comment: text('comment'),
  locationLat: real('location_lat'),
  locationLng: real('location_lng'),
  locationCity: text('location_city'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Piss logs table - Tier 2 (syncs monthly)
export const pissLogs = sqliteTable('piss_logs', {
  id: text('id').primaryKey(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  colorId: integer('color_id'), // References medical palette or custom_colors
  smell: text('smell'), // enum: none/mild/strong/unusual, nullable
  comment: text('comment'),
  locationLat: real('location_lat'),
  locationLng: real('location_lng'),
  locationCity: text('location_city'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Period logs table - Tier 1 (NEVER syncs)
// NO location columns - period data stays local-only
// NO isSynced column - this data NEVER syncs
export const periodLogs = sqliteTable('period_logs', {
  id: text('id').primaryKey(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  flowLevel: text('flow_level'), // enum: light/medium/heavy
  symptoms: text('symptoms'), // JSON array
  mood: text('mood'),
  cycleDay: integer('cycle_day'),
  comment: text('comment'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Custom types table - for user-defined poop types
export const customTypes = sqliteTable('custom_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Custom colors table - for user-defined piss colors
export const customColors = sqliteTable('custom_colors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  hexValue: text('hex_value').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// User settings table - for key-value settings
export const userSettings = sqliteTable('user_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
