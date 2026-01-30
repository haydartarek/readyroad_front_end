'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { STORAGE_KEYS, ROUTES } from '@/lib/constants';
import { User, LoginRequest, LoginResponse } from '@/lib/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest, redirectPath?: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Fetch user on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear all auth state (localStorage + cookie)
   * Used when token is invalid/expired
   */
  const clearAuth = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    document.cookie = `${STORAGE_KEYS.AUTH_TOKEN}=; path=/; max-age=0`;
    setUser(null);
  };

  const fetchUser = async () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    // Don't attempt to fetch if no token exists
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.get<User>('/auth/me');
      setUser(response.data);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Clear everything (localStorage + cookie) to prevent redirect loop
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest, redirectPath?: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      const { token } = response.data;

      // Store token in both localStorage and cookie
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      document.cookie = `${STORAGE_KEYS.AUTH_TOKEN}=${token}; path=/; max-age=604800; SameSite=Lax`;

      // Set user data directly from login response (avoids extra /auth/me call)
      // This prevents any timing issue with fetchUser failing after login
      const userData: User = {
        userId: response.data.userId ?? 0,
        username: response.data.username ?? '',
        email: response.data.email ?? '',
        fullName: response.data.fullName ?? '',
        role: response.data.role ?? 'USER',
        isActive: true,
      };
      setUser(userData);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));

      toast.success('Welcome back!');

      // Use window.location.href to force page reload with new cookie
      // This ensures middleware sees the cookie before navigation
      window.location.href = redirectPath || ROUTES.DASHBOARD;
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Login failed:', error);
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    toast.info('You have been logged out');
    router.push(ROUTES.LOGIN);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        fetchUser,
      }}
    >
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
