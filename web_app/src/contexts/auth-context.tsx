'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { User, LoginRequest } from '@/lib/types';
import { isUnavailableStatus, logApiError } from '@/lib/api';
import { toast } from 'sonner';

/**
 * Auth Context — HttpOnly Cookie Edition
 *
 * SECURITY MODEL:
 * - JWT is stored in an HttpOnly cookie (set by BFF /api/auth/login)
 * - Client JS NEVER sees the raw token
 * - Auth state is determined by calling GET /api/auth/me (BFF route)
 * - The BFF reads the HttpOnly cookie server-side and proxies to the backend
 * - Logout calls POST /api/auth/logout which clears the cookie server-side
 * - ZERO localStorage usage for auth data
 */

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  serviceUnavailable: boolean;
  login: (credentials: LoginRequest, redirectPath?: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const router = useRouter();

  const isAuthenticated = !!user;

  // On mount: always try to fetch the current user via the BFF /me route.
  // If the HttpOnly cookie is present and valid, the backend returns user data.
  // If not, we get a 401 and set user to null.
  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Clear auth state and HttpOnly cookie via BFF.
   */
  const clearAuth = async () => {
    setUser(null);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Best-effort — cookie will expire eventually
    }
  };

  /**
   * Fetch the current user from the BFF /api/auth/me route.
   * The BFF reads the HttpOnly cookie and proxies to the backend.
   */
  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        cache: 'no-store',
      });

      if (response.ok) {
        const userData: User = await response.json();
        setUser(userData);
        setServiceUnavailable(false);
      } else if (isUnavailableStatus(response.status)) {
        // Backend down — keep current user state (guest-safe), no error log
        setServiceUnavailable(true);
      } else {
        setUser(null);
        setServiceUnavailable(false);

        // If we got a 401, signal session expired (for the login page toast)
        if (response.status === 401) {
          try {
            sessionStorage.setItem('session_expired', '1');
          } catch {
            /* noop */
          }
        }
      }
    } catch (error) {
      // Network failure (not an HTTP status) — treat like 503
      logApiError('[AuthContext] fetchUser', error);
      setServiceUnavailable(true);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login via the BFF /api/auth/login route.
   * The BFF sets the HttpOnly cookie — we just get user data back.
   */
  const login = async (credentials: LoginRequest, redirectPath?: string) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData.message || 'Login failed. Please check your credentials.';
        toast.error(message);
        throw new Error(message);
      }

      // BFF returns user data (without the raw token)
      const userData = await response.json();
      const user: User = {
        userId: userData.userId ?? 0,
        username: userData.username ?? '',
        email: userData.email ?? '',
        fullName: userData.fullName ?? '',
        role: userData.role ?? 'USER',
        isActive: true,
      };
      setUser(user);

      toast.success('Welcome back!');

      // Force page reload so middleware sees the new HttpOnly cookie
      window.location.href = redirectPath || ROUTES.DASHBOARD;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Login failed')) {
        throw error;
      }
      logApiError('[AuthContext] login', error);
      toast.error('Login failed. Please check your credentials.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout: clear auth state and HttpOnly cookie via BFF.
   */
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
        serviceUnavailable,
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

/**
 * Role-based Authorization Utilities
 * Implements Feature: Role checking utilities for RBAC
 */

export function hasRole(user: User | null, role: string): boolean {
  return user?.role === role;
}

export function hasAnyRole(user: User | null, roles: string[]): boolean {
  return user ? roles.includes(user.role) : false;
}

export function isAdmin(user: User | null): boolean {
  return hasRole(user, 'ADMIN');
}

export function isModerator(user: User | null): boolean {
  return hasRole(user, 'MODERATOR');
}

export function canModerate(user: User | null): boolean {
  return hasAnyRole(user, ['MODERATOR', 'ADMIN']);
}
