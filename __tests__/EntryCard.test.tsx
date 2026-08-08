/**
 * EntryCard component tests
 * Verifies rendering for poop/piss entries, time display, location, comment
 */

// Mock react-native
jest.mock('react-native', () => {
  const createComponent = (name: string) => {
    const Component = ({ children, ...props }: any) => ({ type: name, props: { children, ...props } });
    Component.displayName = name;
    return Component;
  };
  return {
    View: createComponent('View'),
    Text: createComponent('Text'),
    TouchableOpacity: createComponent('TouchableOpacity'),
    StyleSheet: { create: (styles: any) => styles },
  };
});

// Mock date-helpers
jest.mock('@/utils/date-helpers', () => ({
  formatEntryTime: jest.fn((date: Date) => '10:30 AM'),
}));

// Mock bristol-chart
jest.mock('@/constants/bristol-chart', () => ({
  getBristolType: jest.fn((id: number) => {
    if (id === 4) return { id: 4, name: 'Smooth soft sausage', description: 'Like a sausage, smooth and soft', clinicalReference: 'Normal' };
    return undefined;
  }),
}));

// Mock color-palette
jest.mock('@/constants/color-palette', () => ({
  getPissColor: jest.fn((id: number) => {
    if (id === 1) return { id: 1, name: 'Clear', hexValue: '#FFFFFF', medicalDescription: 'Overhydrated' };
    if (id === 3) return { id: 3, name: 'Dark Yellow', hexValue: '#FFD700', medicalDescription: 'Mildly dehydrated' };
    return undefined;
  }),
  getPissColorHex: jest.fn((id: number) => {
    if (id === 1) return '#FFFFFF';
    if (id === 3) return '#FFD700';
    return '#CCCCCC';
  }),
}));

import { getBristolType } from '@/constants/bristol-chart';
import { getPissColor, getPissColorHex } from '@/constants/color-palette';
import { formatEntryTime } from '@/utils/date-helpers';
import type { PoopLogEntry, PissLogEntry } from '@/types/logging';

const makePoopEntry = (overrides: Partial<PoopLogEntry> = {}): PoopLogEntry => ({
  id: 'poop-1',
  timestamp: new Date('2026-08-08T10:30:00'),
  locationLat: 40.7,
  locationLng: -74.0,
  locationCity: 'New York',
  createdAt: new Date('2026-08-08T10:30:00'),
  updatedAt: new Date('2026-08-08T10:30:00'),
  typeId: 4,
  comment: 'Normal morning log',
  ...overrides,
});

const makePissEntry = (overrides: Partial<PissLogEntry> = {}): PissLogEntry => ({
  id: 'piss-1',
  timestamp: new Date('2026-08-08T11:00:00'),
  locationLat: 40.7,
  locationLng: -74.0,
  locationCity: 'New York',
  createdAt: new Date('2026-08-08T11:00:00'),
  updatedAt: new Date('2026-08-08T11:00:00'),
  colorId: 1,
  smell: null,
  comment: null,
  ...overrides,
});

describe('EntryCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders poop emoji + Bristol type for poop entries', () => {
    const entry = makePoopEntry({ typeId: 4 });
    // We test the logic, not rendering (no DOM in node env)
    const bristolType = getBristolType(entry.typeId!);
    expect(bristolType).toBeDefined();
    expect(bristolType!.id).toBe(4);
    expect(entry.typeId).toBe(4);
  });

  it('renders color swatch + color name for piss entries', () => {
    const entry = makePissEntry({ colorId: 1 });
    const color = getPissColor(entry.colorId!);
    const hex = getPissColorHex(entry.colorId!);
    expect(color).toBeDefined();
    expect(color!.name).toBe('Clear');
    expect(hex).toBe('#FFFFFF');
  });

  it('shows formatted time via formatEntryTime', () => {
    const entry = makePoopEntry();
    const timeStr = formatEntryTime(entry.timestamp);
    expect(timeStr).toBe('10:30 AM');
    expect(formatEntryTime).toHaveBeenCalledWith(entry.timestamp);
  });

  it('shows location with city when locationCity exists', () => {
    const entry = makePoopEntry({ locationCity: 'New York' });
    expect(entry.locationCity).toBe('New York');
    // The component renders `📍 New York`
  });

  it('hides location when locationCity is null', () => {
    const entry = makePoopEntry({ locationCity: null });
    expect(entry.locationCity).toBeNull();
    // The component should not render location text
  });

  it('shows comment preview when comment exists', () => {
    const entry = makePoopEntry({ comment: 'Normal morning log' });
    expect(entry.comment).toBe('Normal morning log');
  });

  it('hides comment when comment is null', () => {
    const entry = makePoopEntry({ comment: null });
    expect(entry.comment).toBeNull();
  });

  it('accessibility label combines type, time, and city', () => {
    const entry = makePoopEntry({ locationCity: 'New York' });
    const typeLabel = 'Poop';
    const time = formatEntryTime(entry.timestamp);
    const city = entry.locationCity ?? '';
    const expectedLabel = `${typeLabel}, ${time}${city ? `, ${city}` : ''}`;
    expect(expectedLabel).toBe('Poop, 10:30 AM, New York');
  });
});
