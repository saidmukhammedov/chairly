import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { ApiError } from '../services/api';

interface UserPublic {
  id: string;
  email: string;
  phone?: string | null;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role: string;
  createdAt: string;
}

interface AuthContextType {
  user: UserPublic | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = await AsyncStorage.getItem('chairly_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      const res = await api.get<{ user: UserPublic }>('/auth/me');
      setUser(res.user);
    } catch {
      await AsyncStorage.removeItem('chairly_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ user: UserPublic; tokens: { accessToken: string } }>('/auth/login', {
      email,
      password,
    });
    await AsyncStorage.setItem('chairly_token', res.tokens.accessToken);
    setUser(res.user);
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => {
    const res = await api.post<{ user: UserPublic; tokens: { accessToken: string } }>('/auth/register', data);
    await AsyncStorage.setItem('chairly_token', res.tokens.accessToken);
    setUser(res.user);
  };

  const updateProfile = async (data: { firstName?: string; lastName?: string; phone?: string }) => {
    const res = await api.put<{ user: UserPublic }>('/auth/profile', data);
    setUser(res.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('chairly_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        updateProfile,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
