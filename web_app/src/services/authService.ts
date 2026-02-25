// Auth Service — HttpOnly Cookie Edition
// Location: src/services/authService.ts
//
// SECURITY MODEL:
// - Login/Register: Call BFF routes which set HttpOnly cookies
// - Logout: Call BFF logout route which clears the cookie
// - Token management: Fully server-side (BFF + proxy)
// - ZERO localStorage usage for auth data

import { getCsrfToken } from '@/lib/auth-token';
import { ROUTES } from '@/lib/constants';

// ═══════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    userId?: number;
    username: string;
    email?: string;
    fullName?: string;
    role: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    fullName: string;
}

// ═══════════════════════════════════════════════════════════
// Auth Service Functions
// ═══════════════════════════════════════════════════════════

/**
 * Login user via BFF route.
 * The BFF sets the HttpOnly JWT cookie — we only get user data back.
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
    }

    return response.json();
};

/**
 * Register new user via BFF route.
 * The BFF sets the HttpOnly JWT cookie — we only get user data back.
 */
export const register = async (data: RegisterRequest): Promise<LoginResponse> => {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
    }

    return response.json();
};

/**
 * Logout user by clearing the HttpOnly cookie via BFF.
 */
export const logout = async (): Promise<void> => {
    try {
        const csrfToken = getCsrfToken();
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
        });
    } catch {
        // Best-effort — cookie will expire; no need to alarm
    }
    // Always redirect, even if the logout request fails
    window.location.href = ROUTES.LOGIN;
};

/**
 * Check if user is authenticated by calling the BFF /me route.
 * Returns false if the HttpOnly cookie is missing or invalid.
 */
export const isAuthenticated = async (): Promise<boolean> => {
    try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        return response.ok;
    } catch {
        return false;
    }
};

/**
 * Get the CSRF token for mutation requests.
 */
export const getToken = getCsrfToken;

// ═══════════════════════════════════════════════════════════
// Export all functions
// ═══════════════════════════════════════════════════════════
export const authService = {
    login,
    register,
    logout,
    isAuthenticated,
    getToken,
};

export default authService;
