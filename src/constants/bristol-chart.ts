export interface BristolType {
  id: number;
  name: string;
  description: string;
  clinicalReference: string;
}

export const BRISTOL_TYPES: BristolType[] = [
  {
    id: 1,
    name: 'Separate hard lumps',
    description: 'Like nuts (hard to pass)',
    clinicalReference: 'Constipation',
  },
  {
    id: 2,
    name: 'Lumpy sausage',
    description: 'Like a sausage but lumpy',
    clinicalReference: 'Constipation',
  },
  {
    id: 3,
    name: 'Sausage with cracks',
    description: 'Like a sausage with cracks on surface',
    clinicalReference: 'Normal',
  },
  {
    id: 4,
    name: 'Smooth soft sausage',
    description: 'Like a sausage, smooth and soft',
    clinicalReference: 'Normal',
  },
  {
    id: 5,
    name: 'Soft blobs',
    description: 'Soft blobs with clear-cut edges',
    clinicalReference: 'Normal',
  },
  {
    id: 6,
    name: 'Mushy stool',
    description: 'Fluffy blobs with ragged edges',
    clinicalReference: 'Diarrhea',
  },
  {
    id: 7,
    name: 'Watery stool',
    description: 'Liquid with no solid pieces',
    clinicalReference: 'Diarrhea',
  },
];

/**
 * Get Bristol type by ID
 */
export function getBristolType(id: number): BristolType | undefined {
  return BRISTOL_TYPES.find((type) => type.id === id);
}

/**
 * Get Bristol type description for display
 */
export function getBristolDescription(id: number): string {
  const type = getBristolType(id);
  return type ? `${type.name}: ${type.description}` : 'Unknown type';
}
