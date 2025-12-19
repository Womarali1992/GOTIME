import { useDataServiceContext } from '@/contexts/DataServiceContext';

/**
 * Custom hook providing unified data access through shared context
 * All data comes from SQLite backend via REST API
 * Uses shared context so all components see the same data
 */
export function useDataService() {
  return useDataServiceContext();
}
