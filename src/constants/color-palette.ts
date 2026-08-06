export interface PissColor {
  id: number;
  name: string;
  hexValue: string;
  medicalDescription: string;
}

export const PISS_COLORS: PissColor[] = [
  {
    id: 1,
    name: 'Clear',
    hexValue: '#FFFFFF',
    medicalDescription: 'Overhydrated, drink less water',
  },
  {
    id: 2,
    name: 'Pale Yellow',
    hexValue: '#F5F5DC',
    medicalDescription: 'Well hydrated, healthy',
  },
  {
    id: 3,
    name: 'Dark Yellow',
    hexValue: '#FFD700',
    medicalDescription: 'Mildly dehydrated, drink more water',
  },
  {
    id: 4,
    name: 'Amber',
    hexValue: '#FFBF00',
    medicalDescription: 'Dehydrated, drink water soon',
  },
  {
    id: 5,
    name: 'Orange',
    hexValue: '#FFA500',
    medicalDescription: 'Dehydrated or liver issue, see doctor if persistent',
  },
  {
    id: 6,
    name: 'Pink',
    hexValue: '#FFC0CB',
    medicalDescription: 'Possible blood, food coloring, or beets - see doctor',
  },
  {
    id: 7,
    name: 'Red',
    hexValue: '#FF0000',
    medicalDescription: 'Blood in urine - see doctor immediately',
  },
  {
    id: 8,
    name: 'Brown',
    hexValue: '#8B4513',
    medicalDescription: 'Possible liver issue or severe dehydration - see doctor',
  },
];

/**
 * Get piss color by ID
 */
export function getPissColor(id: number): PissColor | undefined {
  return PISS_COLORS.find((color) => color.id === id);
}

/**
 * Get piss color hex value for display
 */
export function getPissColorHex(id: number): string {
  const color = getPissColor(id);
  return color ? color.hexValue : '#CCCCCC';
}
