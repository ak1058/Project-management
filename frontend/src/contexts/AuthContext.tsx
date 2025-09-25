// src/contexts/AuthContext.tsx
import { createContext } from 'react';
import type { User } from '../types';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean; 
}


export const AuthContext = createContext<AuthContextType | undefined>(undefined);