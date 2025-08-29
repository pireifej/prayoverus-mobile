import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'https://your-api-base-url.com'; // Replace with your API URL

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          await AsyncStorage.removeItem('auth_token');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await AsyncStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string) => {
    try {
      await AsyncStorage.setItem('auth_token', token);
      await checkAuthStatus();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value = {
    user,
    isLoading,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}