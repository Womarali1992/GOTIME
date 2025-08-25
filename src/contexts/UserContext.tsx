import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import { useDataService } from '@/hooks/use-data-service';

interface UserContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
  updateCurrentUser: (userData: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const dataService = useDataService();

  // Initialize user from localStorage or default to John Doe for demo
  useEffect(() => {
    const savedUserEmail = localStorage.getItem('currentUserEmail');
    const userEmail = savedUserEmail || 'john@example.com'; // Default to John Doe for demo
    
    const user = dataService.users.find(u => u.email === userEmail);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('currentUserEmail', user.email);
    }
  }, [dataService.users]);

  const login = (email: string) => {
    const user = dataService.users.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('currentUserEmail', user.email);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUserEmail');
  };

  const updateCurrentUser = (userData: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      setCurrentUser(updatedUser);
      // In a real app, you'd also update the user in the backend/database
      dataService.userService.updateUser(currentUser.id, userData);
    }
  };

  const value: UserContextType = {
    currentUser,
    isAuthenticated,
    login,
    logout,
    updateCurrentUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
