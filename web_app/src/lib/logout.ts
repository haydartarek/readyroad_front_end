/**
 * Client-side logout utility
 * 
 * NOTE: This is a standalone utility for manual logout implementation.
 * The project uses AuthContext with a centralized logout() function.
 * This file is provided as a reference/backup implementation.
 * 
 * @see src/contexts/auth-context.tsx - Preferred logout implementation
 */

import { STORAGE_KEYS, ROUTES } from '@/lib/constants';

/**
 * Perform client-side logout:
 * 1. Clear localStorage (token + user data)
 * 2. Delete authentication cookie
 * 3. Redirect to login page
 * 
 * ⚠️ Important: If cookie has HttpOnly flag, this won't work.
 * In that case, call a backend /api/auth/logout endpoint instead.
 */
export function logoutClientSide() {
    // 1) Clear localStorage
    try {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        // Clear any other stored keys if needed
    } catch (error) {
        console.warn('Failed to clear localStorage:', error);
    }

    // 2) Delete cookie "token"
    // NOTE: Cookie deletion must match the path/domain used when setting it
    // Attempt both common patterns to ensure removal
    document.cookie = `${STORAGE_KEYS.AUTH_TOKEN}=; Max-Age=0; path=/`;
    document.cookie = `${STORAGE_KEYS.AUTH_TOKEN}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;

    // 3) Redirect to login
    window.location.href = ROUTES.LOGIN;
}

/**
 * Check if user is currently authenticated
 * @returns boolean - true if token exists in localStorage
 */
export function isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return !!token;
}
