/**
 * Centralized auth token management
 * Single source of truth for token storage/retrieval
 */

export const TOKEN_KEYS = {
    PRIMARY: 'token',
    SECONDARY: 'AUTH_TOKEN',
    COOKIE: 'token',
} as const;

/**
 * Get cookie value by name
 */
export function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Get auth token from localStorage or cookie
 * Checks multiple locations for compatibility
 */
export function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;

    // 1) Check primary localStorage key
    const primaryToken = localStorage.getItem(TOKEN_KEYS.PRIMARY);
    if (primaryToken) return primaryToken;

    // 2) Check secondary localStorage key (legacy)
    const secondaryToken = localStorage.getItem(TOKEN_KEYS.SECONDARY);
    if (secondaryToken) {
        // Migrate to primary key
        localStorage.setItem(TOKEN_KEYS.PRIMARY, secondaryToken);
        localStorage.removeItem(TOKEN_KEYS.SECONDARY);
        return secondaryToken;
    }

    // 3) Check cookie fallback
    const cookieToken = getCookie(TOKEN_KEYS.COOKIE);
    if (cookieToken) {
        // Sync to localStorage for faster access
        localStorage.setItem(TOKEN_KEYS.PRIMARY, cookieToken);
        return cookieToken;
    }

    return null;
}

/**
 * Set auth token in localStorage and cookie
 */
export function setAuthToken(token: string): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(TOKEN_KEYS.PRIMARY, token);

    // Set HTTP-only like cookie (7 days)
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${TOKEN_KEYS.COOKIE}=${encodeURIComponent(token)}; path=/; expires=${expires}; SameSite=Strict`;
}

/**
 * Remove auth token from all storage locations
 */
export function removeAuthToken(): void {
    if (typeof window === 'undefined') return;

    // Remove from localStorage
    localStorage.removeItem(TOKEN_KEYS.PRIMARY);
    localStorage.removeItem(TOKEN_KEYS.SECONDARY);

    // Remove from cookie
    document.cookie = `${TOKEN_KEYS.COOKIE}=; path=/; max-age=0; SameSite=Strict`;
}
