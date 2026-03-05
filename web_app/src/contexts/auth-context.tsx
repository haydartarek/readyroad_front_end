'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/constants';
import { type User, type LoginRequest } from '@/lib/types';
import { isUnavailableStatus, logApiError } from '@/lib/api';

/**
 * SECURITY MODEL:
 * - JWT stored in HttpOnly cookie (set by BFF /api/auth/login)
 * - Client JS never sees the raw token
 * - Auth state resolved via GET /api/auth/me (BFF route)
 * - Logout calls POST /api/auth/logout → clears cookie server-side
 * - Zero localStorage usage for auth data
 */

// ─── Types ───────────────────────────────────────────────

interface LoginResult {
  success:   boolean;
  message?:  string;
  /** 503 = backend down */
  status?:   number;
}

interface AuthContextType {
  user:               User | null;
  isLoading:          boolean;
  isAuthenticated:    boolean;
  serviceUnavailable: boolean;
  login:              (credentials: LoginRequest, redirectPath?: string) => Promise<LoginResult>;
  logout:             () => void;
  fetchUser:          () => Promise<void>;
}

// ─── Constants ───────────────────────────────────────────

const CSRF_COOKIE       = 'csrf_token';
const SESSION_EXPIRED_KEY = 'session_expired';

// ─── Context ─────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helpers ─────────────────────────────────────────────

function hasSessionCookie(): boolean {
  return document.cookie.split(';').some(c => c.trim().startsWith(`${CSRF_COOKIE}=`));
}

function normalizeUser(raw: Record<string, unknown>): User {
  return {
    userId:    (raw.userId    as number)  ?? 0,
    username:  (raw.username  as string)  ?? '',
    email:     (raw.email     as string)  ?? '',
    fullName:  (raw.fullName  as string)  ?? '',
    firstName: (raw.firstName as string)  || (raw.fullName as string)?.split(' ')[0] || undefined,
    lastName:  (raw.lastName  as string)  || undefined,
    role:      (raw.role      as string)  ?? 'USER',
    isActive:  true,
    createdAt: (raw.createdAt as string)  || undefined,
  };
}

// ─── Provider ────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,               setUser]               = useState<User | null>(null);
  const [isLoading,          setIsLoading]          = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const router = useRouter();

  const isAuthenticated = !!user;

  const clearAuth = useCallback(async () => {
    setUser(null);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Best-effort — cookie will expire eventually
    }
  }, []);

  const fetchUser = useCallback(async () => {
    if (!hasSessionCookie()) {
      setUser(null);
      setServiceUnavailable(false);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });

      if (response.ok) {
        const raw = await response.json() as Record<string, unknown>;
        // Use normalizeUser so firstName is extracted from fullName on page refresh
        // (same normalization applied during login)
        setUser(normalizeUser(raw));
        setServiceUnavailable(false);
        return;
      }

      if (isUnavailableStatus(response.status)) {
        setServiceUnavailable(true);
        return;
      }

      // 4xx — invalid / expired session
      setUser(null);
      setServiceUnavailable(false);

      if (response.status === 401) {
        try { sessionStorage.setItem(SESSION_EXPIRED_KEY, '1'); } catch { /* noop */ }
      }
    } catch (error) {
      logApiError('[AuthContext] fetchUser', error);
      setServiceUnavailable(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // On mount: resolve session from HttpOnly cookie via BFF
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (
    credentials: LoginRequest,
    redirectPath?: string,
  ): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message   = errorData.message ?? 'Login failed. Please check your credentials.';
        return { success: false, message, status: response.status };
      }

      const raw = await response.json();
      setUser(normalizeUser(raw));
      toast.success('Welcome back!');

      // Full reload so middleware sees the new HttpOnly cookie
      window.location.href = redirectPath ?? ROUTES.DASHBOARD;
      return { success: true };
    } catch (error) {
      // Network / server errors (ECONNREFUSED, etc.)
      logApiError('[AuthContext] login', error);
      const message = error instanceof TypeError && error.message.includes('fetch')
        ? 'Backend service unavailable'
        : 'An unexpected error occurred. Please try again.';
      return { success: false, message, status: 503 };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    // MUST await clearAuth so the HttpOnly cookie is deleted BEFORE
    // we navigate away — otherwise the middleware still sees a valid
    // token and lets any subsequent /dashboard request through.
    await clearAuth();
    toast.info('You have been logged out');
    // Full page reload (not client-side push) so:
    //  1. All React state is wiped (no stale dashboard data)
    //  2. Middleware re-evaluates the request fresh (no cookie → redirects to login)
    window.location.href = ROUTES.LOGIN;
  }, [clearAuth]);

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

// ─── Hook ────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

// ─── RBAC Utilities ──────────────────────────────────────

export function hasRole(user: User | null, role: string): boolean {
  return user?.role === role;
}

export function hasAnyRole(user: User | null, roles: string[]): boolean {
  return user ? roles.includes(user.role) : false;
}

export function isAdmin(user: User | null):      boolean { return hasRole(user, 'ADMIN');     }
export function isModerator(user: User | null):  boolean { return hasRole(user, 'MODERATOR'); }
export function canModerate(user: User | null):  boolean { return hasAnyRole(user, ['MODERATOR', 'ADMIN']); }
