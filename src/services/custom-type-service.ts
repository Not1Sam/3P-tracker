/**
 * Custom type service layer.
 * Re-exports repository functions for UI consumption.
 */

export {
  createCustomType,
  getCustomTypes,
  deleteCustomType,
  createCustomColor,
  getCustomColors,
  deleteCustomColor,
} from '@/db/repositories/custom-type-repository';
