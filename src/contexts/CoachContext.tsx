import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Coach } from '@/lib/types';
import { apiDataService } from '@/lib/services/api-data-service';

// Scope localStorage keys by subdomain so different tenants don't share sessions
function getStorageKey(key: string): string {
  const subdomain = window.location.hostname.split('.')[0];
  return `${subdomain}:${key}`;
}

interface CoachContextType {
  currentCoach: Coach | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateCurrentCoach: (coachData: Partial<Coach>) => Promise<void>;
}

const defaultContextValue: CoachContextType = {
  currentCoach: null,
  isAuthenticated: false,
  login: async () => ({ success: false, error: 'login called outside of CoachProvider' }),
  logout: () => {},
  updateCurrentCoach: async () => {},
};

const CoachContext = createContext<CoachContextType>(defaultContextValue);

interface CoachProviderProps {
  children: ReactNode;
}

export const CoachProvider: React.FC<CoachProviderProps> = ({ children }) => {
  const [currentCoach, setCurrentCoach] = useState<Coach | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize coach from localStorage
  useEffect(() => {
    const initializeCoach = async () => {
      const savedCoachEmail = localStorage.getItem(getStorageKey('currentCoachEmail'));

      if (savedCoachEmail) {
        try {
          const coaches = await apiDataService.getAllCoaches();
          const coach = coaches.find(c => c.email === savedCoachEmail);
          if (coach && coach.isActive) {
            setCurrentCoach(coach);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem(getStorageKey('currentCoachEmail'));
          }
        } catch {
          localStorage.removeItem(getStorageKey('currentCoachEmail'));
        }
      }
    };
    initializeCoach();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const coach = await apiDataService.loginCoach(email, password);
      setCurrentCoach(coach);
      setIsAuthenticated(true);
      localStorage.setItem(getStorageKey('currentCoachEmail'), coach.email);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Authentication failed' };
    }
  };

  const logout = () => {
    setCurrentCoach(null);
    setIsAuthenticated(false);
    localStorage.removeItem(getStorageKey('currentCoachEmail'));
  };

  const updateCurrentCoach = async (coachData: Partial<Coach>) => {
    if (currentCoach) {
      try {
        const updatedCoach = await apiDataService.updateCoach(currentCoach.id, coachData);
        setCurrentCoach(updatedCoach);
      } catch (error) {
        console.error('Failed to update coach:', error);
      }
    }
  };

  const value: CoachContextType = {
    currentCoach,
    isAuthenticated,
    login,
    logout,
    updateCurrentCoach,
  };

  return (
    <CoachContext.Provider value={value}>
      {children}
    </CoachContext.Provider>
  );
};

export const useCoach = (): CoachContextType => {
  return useContext(CoachContext);
};
