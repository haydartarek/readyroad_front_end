/**
 * Auth Service — HttpOnly Cookie Edition
 *
 * SECURITY MODEL:
 * - Login/Register: BFF routes set HttpOnly cookies
 * - Logout: BFF logout route clears the cookie
 * - Token management: fully server-side (BFF + proxy)
 * - Zero localStorage usage for auth data
 */

import { getCsrfToken } from '@/lib/auth-token';
import { ROUTES } from '@/lib/constants';

// ─── Types ───────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  userId?:   number;
  username:  string;
  email?:    string;
  fullName?: string;
  role:      string;
}

export interface RegisterRequest {
  username: string;
  email:    string;
  password: string;
  fullName: string;
}

// ─── Constants ───────────────────────────────────────────

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

// ─── Helpers ─────────────────────────────────────────────

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => ({}));
  return (body as { message?: string }).message ?? fallback;
}

// ─── Service ─────────────────────────────────────────────

/** Login via BFF — sets HttpOnly JWT cookie, returns user data. */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch('/api/auth/login', {
    method:  'POST',
    headers: JSON_HEADERS,
    body:    JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Login failed'));
  }

  return response.json();
}

/** Register via BFF — sets HttpOnly JWT cookie, returns user data. */
export async function register(data: RegisterRequest): Promise<LoginResponse> {
  const response = await fetch('/api/auth/register', {
    method:  'POST',
    headers: JSON_HEADERS,
    body:    JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Registration failed'));
  }

  return response.json();
}

/**
 * Logout via BFF — clears the HttpOnly cookie server-side.
 * Always redirects to login, even if the request fails.
 */
export async function logout(): Promise<void> {
  try {
    const csrf = getCsrfToken();
    await fetch('/api/auth/logout', {
      method:  'POST',
      headers: csrf ? { 'x-csrf-token': csrf } : {},
    });
  } catch {
    // Best-effort — cookie will expire eventually
  }
  window.location.href = ROUTES.LOGIN;
}

/**
 * Check auth state by calling BFF /me.
 * Returns false if the HttpOnly cookie is missing or invalid.
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/me', { cache: 'no-store' });
    return response.ok;
  } catch {
    return false;
  }
}

/** Get the CSRF token for mutation requests. */
export const getToken = getCsrfToken;

// ─── Service Object ──────────────────────────────────────

export const authService = {
  login,
  register,
  logout,
  isAuthenticated,
  getToken,
};

export default authService;
