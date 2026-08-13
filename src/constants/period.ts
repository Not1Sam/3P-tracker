/**
 * Period tracking constants — flow levels, symptoms, moods, cycle phases.
 * All UI-facing data uses these typed definitions.
 */

import type {
  FlowLevel,
  Symptom,
  Mood,
  CyclePhaseName,
} from '@/types/period';

// --- Flow levels (D-01, D-03) ---

export interface FlowLevelOption {
  value: FlowLevel;
  label: string;
  drops: number;
  emoji: string;
}

export const FLOW_LEVELS: FlowLevelOption[] = [
  { value: 'spotting', label: 'Spotting', drops: 1, emoji: '💧' },
  { value: 'light', label: 'Light', drops: 2, emoji: '💧💧' },
  { value: 'medium', label: 'Medium', drops: 3, emoji: '🩸' },
  { value: 'heavy', label: 'Heavy', drops: 4, emoji: '🩸🩸' },
  { value: 'very-heavy', label: 'Very Heavy', drops: 5, emoji: '🩸🩸🩸' },
];

// --- Symptoms (D-04, D-05) ---

export interface SymptomOption {
  value: Symptom;
  label: string;
  emoji: string;
}

export const SYMPTOM_OPTIONS: SymptomOption[] = [
  { value: 'cramps', label: 'Cramps', emoji: '🩹' },
  { value: 'bloating', label: 'Bloating', emoji: '🎈' },
  { value: 'headache', label: 'Headache', emoji: '🤕' },
  { value: 'fatigue', label: 'Fatigue', emoji: '😴' },
  { value: 'back-pain', label: 'Back pain', emoji: '💆' },
  { value: 'breast-tenderness', label: 'Breast tenderness', emoji: '🩹' },
  { value: 'acne', label: 'Acne', emoji: '😤' },
  { value: 'insomnia', label: 'Insomnia', emoji: '🌙' },
  { value: 'food-cravings', label: 'Food cravings', emoji: '🍕' },
];

// --- Moods (D-08, D-09) ---

export interface MoodOption {
  value: Mood;
  label: string;
  emoji: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'irritable', label: 'Irritable', emoji: '😤' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'energetic', label: 'Energetic', emoji: '⚡' },
  { value: 'tired', label: 'Tired', emoji: '🥱' },
  { value: 'emotional', label: 'Emotional', emoji: '🥺' },
];

// --- Cycle phases (D-28, D-29) ---

export interface CyclePhaseInfo {
  label: string;
  description: string;
  dayRange: string;
  tips: string[];
}

export const CYCLE_PHASES: Record<CyclePhaseName, CyclePhaseInfo> = {
  menstrual: {
    label: 'Menstrual Phase',
    description:
      'Your uterine lining is shedding. This is day 1 of your cycle.',
    dayRange: 'Days 1–5',
    tips: [
      'Rest and stay hydrated',
      'Light exercise may help with cramps',
      'Iron-rich foods can help replace lost nutrients',
    ],
  },
  follicular: {
    label: 'Follicular Phase',
    description: 'Your body is preparing for ovulation. Estrogen levels rise.',
    dayRange: 'Days 6–13',
    tips: [
      'Energy levels often increase',
      'Good time for challenging workouts',
      'Mood tends to improve',
    ],
  },
  ovulation: {
    label: 'Ovulation Phase',
    description:
      'An egg is released. You may feel a slight ache on one side.',
    dayRange: 'Days 14–16',
    tips: [
      'Peak energy and mood for many',
      'You may notice increased discharge',
      'Some experience mild ovulation pain',
    ],
  },
  luteal: {
    label: 'Luteal Phase',
    description:
      'Post-ovulation. Progesterone rises, then drops if no pregnancy.',
    dayRange: 'Days 17–28',
    tips: [
      'PMS symptoms may appear in the last few days',
      'Cravings and bloating are common',
      'Gentle exercise can help with mood',
    ],
  },
};

// --- Defaults ---

/** Default cycle length in days when no user data exists. */
export const DEFAULT_CYCLE_LENGTH = 28;

/**
 * Minimum number of completed cycles required before predictions are shown.
 * Per D-13.
 */
export const MIN_CYCLES_FOR_PREDICTION = 2;
