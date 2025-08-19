import React, { useEffect } from 'react';
import { 
  ensureReservationConsistency, 
  refreshReservationData, 
  validateReservationIntegrity,
  fixDataInconsistencies
} from '@/lib/data';

interface DataProviderProps {
  children: React.ReactNode;
}

const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  useEffect(() => {
    // Ensure data consistency when the app starts
    ensureReservationConsistency();
    
    // Validate data integrity
    const validation = validateReservationIntegrity();
    if (!validation.isValid) {
      console.warn('Data integrity issues found:', validation.errors);
      console.warn('Warnings:', validation.warnings);
      
      // Try to fix common issues
      fixDataInconsistencies();
      
      // Validate again after fixing
      const revalidation = validateReservationIntegrity();
      if (revalidation.isValid) {
        console.log('Data integrity issues resolved');
      } else {
        console.error('Some data integrity issues could not be resolved:', revalidation.errors);
      }
    } else {
      console.log('Data integrity validation passed');
    }
    
    // Set up periodic data refresh to maintain consistency
    const interval = setInterval(() => {
      refreshReservationData();
      
      // Periodically validate data integrity
      const periodicValidation = validateReservationIntegrity();
      if (!periodicValidation.isValid) {
        console.warn('Periodic validation found issues:', periodicValidation.errors);
        fixDataInconsistencies();
      }
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
};

export default DataProvider;
