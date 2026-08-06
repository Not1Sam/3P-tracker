import type { SmellLevel } from '@/types/logging';

export interface SmellOption {
  value: SmellLevel;
  label: string;
  emoji: string;
}

export const SMELL_OPTIONS: SmellOption[] = [
  { value: 'none', label: 'None', emoji: '🚫' },
  { value: 'mild', label: 'Mild', emoji: '👃' },
  { value: 'strong', label: 'Strong', emoji: '🤢' },
  { value: 'unusual', label: 'Unusual', emoji: '⚠️' },
];

export type { SmellLevel };
