import React, { useEffect, useState } from 'react';
import { apiDataService } from '@/lib/services/api-data-service';

interface DataProviderProps {
  children: React.ReactNode;
}

const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        console.log('Connecting to API...');
        await apiDataService.initialize();
        console.log('API connected successfully');
        setIsInitialized(true);
      } catch (error) {
        console.error('Error connecting to API:', error);
        setIsInitialized(true); // Show app even if initialization fails
      }
    };

    initializeDatabase();
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Connecting to server...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DataProvider;
