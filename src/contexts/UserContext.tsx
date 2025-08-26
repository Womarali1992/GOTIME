import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import { dataService } from '@/lib/services/data-service';

interface UserContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
  updateCurrentUser: (userData: Partial<User>) => void;
}

// Create a default context value that matches our interface
const defaultContextValue: UserContextType = {
  currentUser: null,
  isAuthenticated: false,
  login: () => console.warn('login called outside of UserProvider'),
  logout: () => console.warn('logout called outside of UserProvider'),
  updateCurrentUser: () => console.warn('updateCurrentUser called outside of UserProvider'),
};

const UserContext = createContext<UserContextType>(defaultContextValue);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  console.log('UserProvider rendering');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize user from localStorage or default to John Doe for demo
  useEffect(() => {
    const savedUserEmail = localStorage.getItem('currentUserEmail');
    const userEmail = savedUserEmail || 'john@example.com'; // Default to John Doe for demo
    
    const users = dataService.userService.getAllUsers();
    const user = users.find(u => u.email === userEmail);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('currentUserEmail', user.email);
    }
  }, []);

  const login = (email: string) => {
    const users = dataService.userService.getAllUsers();
    const user = users.find(u => u.email === email);
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

  console.log('UserProvider providing value:', { currentUser: currentUser?.email || null, isAuthenticated });

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  console.log('useUser called, context:', context);
  
  // Check if we're getting the default context (which means we're outside a provider)
  if (context === defaultContextValue) {
    console.warn('useUser: Using default context - component may be outside UserProvider');
  }
  
  return context;
};
