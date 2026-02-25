/**
 * Centralized auth token management
 *
 * SECURITY MODEL (HttpOnly Cookie):
 * - The JWT is stored in an HttpOnly cookie set by the BFF route handlers
 *   (/api/auth/login, /api/auth/register)
 * - Client-side JavaScript CANNOT read, write, or delete the token
 * - Auth state is derived from the AuthContext which calls /api/auth/me on mount
 * - Logout is performed via POST /api/auth/logout (clears the HttpOnly cookie server-side)
 *
 * These exports are kept for backward compatibility during migration.
 * They are intentional NO-OPs — the real auth logic lives server-side.
 */

/**
 * @deprecated Token is in an HttpOnly cookie — client JS cannot read it.
 * Use the AuthContext's `isAuthenticated` state instead.
 */
export function getAuthToken(): string | null {
    // HttpOnly cookie is invisible to client JS by design
    return null;
}

/**
 * @deprecated Token is set by the BFF login route handler via Set-Cookie.
 * Do NOT call this — it is a no-op.
 */
export function setAuthToken(_token: string): void {
    // No-op: token is set server-side by /api/auth/login route handler
}

/**
 * @deprecated Use `logoutAndClearCookie()` or call POST /api/auth/logout directly.
 */
export function removeAuthToken(): void {
    // Trigger server-side cookie cleanup
    logoutAndClearCookie();
}

/**
 * Clear the HttpOnly auth cookie by calling the BFF logout endpoint.
 * This is the ONLY way to remove the token since client JS cannot access it.
 */
export async function logoutAndClearCookie(): Promise<void> {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
        // Best-effort logout — cookie will expire eventually
    }
}

/**
 * Read a non-HttpOnly cookie by name.
 * Used for reading the CSRF double-submit token.
 */
export function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Get the CSRF token from the non-HttpOnly csrf_token cookie.
 * Must be sent as the x-csrf-token header on mutation requests.
 */
export function getCsrfToken(): string | null {
    return getCookie('csrf_token');
}
