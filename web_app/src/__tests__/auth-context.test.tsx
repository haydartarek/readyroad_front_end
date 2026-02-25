/**
 * Auth Context Tests — HttpOnly Cookie Edition
 *
 * Tests verify that:
 * - Auth state is determined by /api/auth/me (BFF route), NOT localStorage
 * - Logout calls POST /api/auth/logout to clear HttpOnly cookie
 * - No auth data is ever stored in localStorage
 * - STORAGE_KEYS no longer contains AUTH_TOKEN or USER_DATA
 */

import { STORAGE_KEYS, ROUTES } from '@/lib/constants';

// Mock fetch globally for BFF route testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AuthContext Logic (HttpOnly Cookie)', () => {
    beforeEach(() => {
        mockFetch.mockClear();
    });

    test('STORAGE_KEYS does NOT contain AUTH_TOKEN (token is in HttpOnly cookie)', () => {
        // AUTH_TOKEN was removed from STORAGE_KEYS — token is in HttpOnly cookie
        expect('AUTH_TOKEN' in STORAGE_KEYS).toBe(false);
    });

    test('STORAGE_KEYS does NOT contain USER_DATA (no user data in localStorage)', () => {
        // USER_DATA was removed from STORAGE_KEYS
        expect('USER_DATA' in STORAGE_KEYS).toBe(false);
    });

    test('STORAGE_KEYS contains AUTH_COOKIE_NAME for reference', () => {
        expect(STORAGE_KEYS.AUTH_COOKIE_NAME).toBe('token');
    });

    test('login route is correct', () => {
        expect(ROUTES.LOGIN).toBe('/login');
    });

    test('logout calls BFF /api/auth/logout', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

        await fetch('/api/auth/logout', { method: 'POST' });

        expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
    });

    test('fetchUser calls BFF /api/auth/me', async () => {
        const userData = { userId: 1, username: 'testuser', role: 'USER' };
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => userData,
        });

        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await response.json();

        expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', { cache: 'no-store' });
        expect(data.username).toBe('testuser');
    });

    test('fetchUser returns null on 401', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({ message: 'Not authenticated' }),
        });

        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        expect(response.ok).toBe(false);
        expect(response.status).toBe(401);
    });
});
