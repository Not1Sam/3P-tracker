import { pgTable, text, integer, real, timestamp, primaryKey, uuid } from 'drizzle-orm/pg-core';

export const poopLogs = pgTable('poop_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  typeId: integer('type_id'),
  comment: text('comment'),
  locationLat: real('location_lat'),
  locationLng: real('location_lng'),
  locationCity: text('location_city'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const pissLogs = pgTable('piss_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  colorId: integer('color_id'),
  smell: text('smell'),
  comment: text('comment'),
  locationLat: real('location_lat'),
  locationLng: real('location_lng'),
  locationCity: text('location_city'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const customTypes = pgTable('custom_types', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull(),
});

export const customColors = pgTable('custom_colors', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  hexValue: text('hex_value').notNull(),
  createdAt: timestamp('created_at').notNull(),
});

export const userSettings = pgTable('user_settings', {
  key: text('key').primaryKey(),
  userId: text('user_id').notNull(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});
