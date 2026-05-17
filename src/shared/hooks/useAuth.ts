import { useContext, createContext } from 'react';
import type { User, Workshop } from '../types';

interface AuthContextType {
  user: User | null;
  workshop: Workshop | null;
  authError: string;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshWorkshop: () => Promise<void>;
  clearAuthError: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
