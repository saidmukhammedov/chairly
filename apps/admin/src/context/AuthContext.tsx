import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { UserPublic, ShopMemberSummary } from '@chairly/shared';

interface AuthContextType {
  user: UserPublic | null;
  memberships: ShopMemberSummary[];
  currentShopId: string | null;
  currentMembership: ShopMemberSummary | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (fullName: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  switchShop: (shopId: string) => void;
  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [memberships, setMemberships] = useState<ShopMemberSummary[]>([]);
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    const token = localStorage.getItem('chairly_admin_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.get<{ user: UserPublic; memberships: ShopMemberSummary[] }>('/auth/me');
      setUser(res.user);
      setMemberships(res.memberships || []);

      const savedShopId = localStorage.getItem('chairly_active_shop');
      if (savedShopId && res.memberships?.some((m) => m.shopId === savedShopId)) {
        setCurrentShopId(savedShopId);
      } else if (res.memberships && res.memberships.length > 0) {
        setCurrentShopId(res.memberships[0].shopId);
        localStorage.setItem('chairly_active_shop', res.memberships[0].shopId);
      }
    } catch {
      localStorage.removeItem('chairly_admin_token');
      localStorage.removeItem('chairly_active_shop');
      setUser(null);
      setMemberships([]);
      setCurrentShopId(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await api.post<{
      user: UserPublic;
      tokens: { accessToken: string };
      memberships: ShopMemberSummary[];
    }>('/auth/login', { identifier, phone: identifier, email: identifier, password });

    localStorage.setItem('chairly_admin_token', res.tokens.accessToken);
    setUser(res.user);
    setMemberships(res.memberships || []);

    if (res.memberships && res.memberships.length > 0) {
      setCurrentShopId(res.memberships[0].shopId);
      localStorage.setItem('chairly_active_shop', res.memberships[0].shopId);
    }
  };

  const register = async (fullName: string, phone: string, password: string) => {
    const res = await api.post<{
      user: UserPublic;
      tokens: { accessToken: string };
      memberships: ShopMemberSummary[];
    }>('/auth/register', { fullName, phone, password });

    localStorage.setItem('chairly_admin_token', res.tokens.accessToken);
    setUser(res.user);
    setMemberships(res.memberships || []);
  };

  const logout = () => {
    localStorage.removeItem('chairly_admin_token');
    localStorage.removeItem('chairly_active_shop');
    setUser(null);
    setMemberships([]);
    setCurrentShopId(null);
  };

  const switchShop = (shopId: string) => {
    setCurrentShopId(shopId);
    localStorage.setItem('chairly_active_shop', shopId);
  };

  const updateProfile = async (data: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }) => {
    const res = await api.put<{ user: UserPublic }>('/auth/profile', data);
    if (res.user) {
      setUser(res.user);
    }
  };

  const refreshUser = async () => {
    await initAuth();
  };

  const currentMembership = memberships.find((m) => m.shopId === currentShopId) || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        memberships,
        currentShopId,
        currentMembership,
        isLoading,
        login,
        register,
        logout,
        switchShop,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
