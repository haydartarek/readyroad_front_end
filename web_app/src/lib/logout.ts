/**
 * Client-side logout utility — HttpOnly Cookie Edition
 *
 * Since the JWT is in an HttpOnly cookie, client JS cannot clear it directly.
 * We must call the BFF logout endpoint which clears the cookie server-side.
 *
 * @see src/contexts/auth-context.tsx - Preferred logout implementation (via useAuth)
 * @see src/app/api/auth/logout/route.ts - BFF route that clears the cookie
 */

import { ROUTES } from '@/lib/constants';
import { getCsrfToken } from '@/lib/auth-token';

/**
 * Perform client-side logout:
 * 1. Call BFF /api/auth/logout to clear the HttpOnly cookie (server-side)
 * 2. Redirect to login page
 *
 * Note: No localStorage cleanup needed — we no longer store auth data there.
 */
export async function logoutClientSide(): Promise<void> {
    try {
        const csrfToken = getCsrfToken();
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
        });
    } catch (error) {
        console.warn('Logout request failed:', error);
    }

    // Redirect to login (always, even if request fails — cookie will expire)
    window.location.href = ROUTES.LOGIN;
}

/**
 * Check if user is currently authenticated.
 * With HttpOnly cookies, we can't check from the client.
 * Use the AuthContext's `isAuthenticated` state instead.
 *
 * @returns false — client cannot determine auth state from cookies alone
 * @deprecated Use `useAuth().isAuthenticated` from AuthContext
 */
export function isAuthenticated(): boolean {
    return false;
}
