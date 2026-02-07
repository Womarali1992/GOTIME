import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import { apiDataService } from '@/lib/services/api-data-service';

// Scope localStorage keys by subdomain so different tenants don't share sessions
function getStorageKey(key: string): string {
  const subdomain = window.location.hostname.split('.')[0];
  return `${subdomain}:${key}`;
}

interface UserContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; phone: string; password: string; duprRating?: number }) => Promise<void>;
  logout: () => void;
  updateCurrentUser: (userData: Partial<User>) => Promise<void>;
}

const defaultContextValue: UserContextType = {
  currentUser: null,
  isAuthenticated: false,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  updateCurrentUser: async () => {},
};

const UserContext = createContext<UserContextType>(defaultContextValue);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize user from localStorage
  useEffect(() => {
    const initializeUser = async () => {
      const savedUserEmail = localStorage.getItem(getStorageKey('currentUserEmail'));

      if (savedUserEmail) {
        try {
          const users = await apiDataService.getAllUsers();
          const user = users.find(u => u.email === savedUserEmail);
          if (user) {
            setCurrentUser(user);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem(getStorageKey('currentUserEmail'));
          }
        } catch {
          localStorage.removeItem(getStorageKey('currentUserEmail'));
        }
      }
    };
    initializeUser();
  }, []);

  const login = async (email: string, password: string) => {
    const user = await apiDataService.login(email, password);
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem(getStorageKey('currentUserEmail'), user.email);
  };

  const signup = async (data: { name: string; email: string; phone: string; password: string; duprRating?: number }) => {
    const user = await apiDataService.signup(data);
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem(getStorageKey('currentUserEmail'), user.email);
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(getStorageKey('currentUserEmail'));
  };

  const updateCurrentUser = async (userData: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      setCurrentUser(updatedUser);
      await apiDataService.updateUser(currentUser.id, userData);
    }
  };

  const value: UserContextType = {
    currentUser,
    isAuthenticated,
    login,
    signup,
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
  return useContext(UserContext);
};
