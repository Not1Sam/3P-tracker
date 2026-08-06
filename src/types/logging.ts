/**
 * TypeScript types for the logging domain.
 * Maps to schema tables: poop_logs, piss_logs, custom_types, custom_colors
 */

export type LogType = 'poop' | 'piss';

export type SmellLevel = 'none' | 'mild' | 'strong' | 'unusual';

export interface PoopLogInput {
  typeId?: number;
  comment?: string;
}

export interface PissLogInput {
  colorId?: number;
  smell?: SmellLevel;
  comment?: string;
}

export interface CapturedLocation {
  lat: number;
  lng: number;
  city: string | null;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  locationLat: number | null;
  locationLng: number | null;
  locationCity: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PoopLogEntry extends LogEntry {
  typeId: number | null;
  comment: string | null;
}

export interface PissLogEntry extends LogEntry {
  colorId: number | null;
  smell: SmellLevel | null;
  comment: string | null;
}

export interface CustomType {
  id: string;
  name: string;
  createdAt: Date;
}

export interface CustomColor extends CustomType {
  hexValue: string;
}
