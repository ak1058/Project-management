// src/components/AuthProvider.tsx
import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { AuthContext, type AuthContextType } from '../contexts/AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}


const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
  };

  const isAuthenticated = !!token && !!user;

  const contextValue: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;