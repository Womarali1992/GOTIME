import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Coach } from '@/lib/types';
import { dataService } from '@/lib/services/data-service';

interface CoachContextType {
  currentCoach: Coach | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  updateCurrentCoach: (coachData: Partial<Coach>) => void;
}

// Create a default context value that matches our interface
const defaultContextValue: CoachContextType = {
  currentCoach: null,
  isAuthenticated: false,
  login: () => ({ success: false, error: 'login called outside of CoachProvider' }),
  logout: () => console.warn('logout called outside of CoachProvider'),
  updateCurrentCoach: () => console.warn('updateCurrentCoach called outside of CoachProvider'),
};

const CoachContext = createContext<CoachContextType>(defaultContextValue);

interface CoachProviderProps {
  children: ReactNode;
}

export const CoachProvider: React.FC<CoachProviderProps> = ({ children }) => {
  console.log('CoachProvider rendering');
  const [currentCoach, setCurrentCoach] = useState<Coach | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize coach from localStorage
  useEffect(() => {
    const savedCoachEmail = localStorage.getItem('currentCoachEmail');

    if (savedCoachEmail) {
      const coaches = dataService.coachService.getAllCoaches();
      const coach = coaches.find(c => c.email === savedCoachEmail);
      if (coach && coach.isActive) {
        setCurrentCoach(coach);
        setIsAuthenticated(true);
      } else {
        // Clear invalid session
        localStorage.removeItem('currentCoachEmail');
      }
    }
  }, []);

  const login = (email: string, password: string): { success: boolean; error?: string } => {
    const result = dataService.coachService.authenticateCoach(email, password);

    if (result.success && result.coach) {
      setCurrentCoach(result.coach);
      setIsAuthenticated(true);
      localStorage.setItem('currentCoachEmail', result.coach.email);
      return { success: true };
    }

    return { success: false, error: result.error || 'Authentication failed' };
  };

  const logout = () => {
    setCurrentCoach(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentCoachEmail');
  };

  const updateCurrentCoach = (coachData: Partial<Coach>) => {
    if (currentCoach) {
      const result = dataService.coachService.updateCoach(currentCoach.id, coachData);

      if (result.success && result.coach) {
        setCurrentCoach(result.coach);
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

  console.log('CoachProvider providing value:', { currentCoach: currentCoach?.email || null, isAuthenticated });

  return (
    <CoachContext.Provider value={value}>
      {children}
    </CoachContext.Provider>
  );
};

export const useCoach = (): CoachContextType => {
  const context = useContext(CoachContext);
  console.log('useCoach called, context:', context);

  // Check if we're getting the default context (which means we're outside a provider)
  if (context === defaultContextValue) {
    console.warn('useCoach: Using default context - component may be outside CoachProvider');
  }

  return context;
};
