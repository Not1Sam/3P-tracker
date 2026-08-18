/**
 * Custom type service layer.
 * Re-exports repository functions for UI consumption.
 * On web, these go through the API. On mobile, they use local SQLite.
 */

export {
  createCustomType,
  getCustomTypes,
  deleteCustomType,
  createCustomColor,
  getCustomColors,
  deleteCustomColor,
} from '@/services/api/repositories';
