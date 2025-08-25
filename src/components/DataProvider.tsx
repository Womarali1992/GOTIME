import React, { useEffect } from 'react';
import { dataService } from '@/lib/services/data-service';

interface DataProviderProps {
  children: React.ReactNode;
}

const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  useEffect(() => {
    // Simple data initialization
    try {
      dataService.ensureDataConsistency();
      console.log('Data initialized successfully');
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }, []);

  return <>{children}</>;
};

export default DataProvider;
