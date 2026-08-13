/**
 * TypeScript types for the period tracking domain.
 * Maps to schema table: period_logs (Tier 1 — NEVER syncs)
 */

export type FlowLevel =
  | 'spotting'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'very-heavy';

export type Symptom =
  | 'cramps'
  | 'bloating'
  | 'headache'
  | 'fatigue'
  | 'back-pain'
  | 'breast-tenderness'
  | 'acne'
  | 'insomnia'
  | 'food-cravings';

export type Mood =
  | 'happy'
  | 'sad'
  | 'irritable'
  | 'anxious'
  | 'calm'
  | 'energetic'
  | 'tired'
  | 'emotional';

export type CyclePhaseName =
  | 'menstrual'
  | 'follicular'
  | 'ovulation'
  | 'luteal';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

// --- Input types ---

export interface PeriodLogInput {
  flowLevel?: FlowLevel;
  symptoms?: Symptom[];
  mood?: Mood;
  comment?: string;
}

// --- Entry types (from DB) ---

export interface PeriodLogEntry {
  id: string;
  timestamp: Date;
  flowLevel: FlowLevel | null;
  symptoms: Symptom[] | null;
  mood: Mood | null;
  cycleDay: number | null;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// --- Cycle prediction types ---

export interface CycleData {
  cycleStartDates: Date[];
  cycleLengths: number[];
  averageCycleLength: number;
  shortestCycle: number;
  longestCycle: number;
  lastPeriodStart: Date;
  nextPeriodPrediction: Date | null;
  daysUntilNextPeriod: number | null;
  currentCycleDay: number;
  confidence: ConfidenceLevel;
}

export interface CyclePhase {
  name: CyclePhaseName;
  label: string;
  description: string;
  dayRange: string;
  tips: string[];
}

// --- Statistics types ---

export interface PeriodStats {
  averageCycleLength: number;
  averagePeriodDuration: number;
  shortestCycle: number;
  longestCycle: number;
  totalCycles: number;
  regularity: string;
}

// --- Settings types ---

export interface PeriodSettings {
  remindersEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
}
