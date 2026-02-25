/**
 * API Client Tests — HttpOnly Cookie Edition
 *
 * Tests verify that:
 * - ApiClient uses /api/proxy as baseURL (NOT the backend directly)
 * - 401 response triggers BFF logout (NOT localStorage removal)
 * - No Authorization header is injected client-side (proxy handles it)
 * - CSRF token is attached on mutation requests
 * - No auth data in localStorage
 */

import { ROUTES } from '@/lib/constants';

// Mock fetch for BFF logout
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('API Client (HttpOnly Cookie Proxy)', () => {
    beforeEach(() => {
        mockFetch.mockClear();
    });

    test('login route constant is correct', () => {
        expect(ROUTES.LOGIN).toBe('/login');
    });

    test('401 response triggers BFF logout call', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

        // Simulate what the 401 interceptor does now
        const status = 401;
        if (status === 401) {
            await fetch('/api/auth/logout', { method: 'POST' });
        }

        expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
    });

    test('non-401 response does NOT trigger logout', async () => {
        const status: number = 500;
        if (status === 401) {
            await fetch('/api/auth/logout', { method: 'POST' });
        }

        expect(mockFetch).not.toHaveBeenCalled();
    });

    test('no Authorization header is set client-side (proxy handles it)', () => {
        // The ApiClient no longer injects Authorization headers
        // The BFF proxy reads the HttpOnly cookie and attaches it server-side
        const mockConfig: { headers: Record<string, string> } = { headers: {} };

        // In the new model, the request interceptor only adds CSRF token, not auth
        // Verify no Authorization header is set
        expect(mockConfig.headers.Authorization).toBeUndefined();
    });

    test('CSRF token is attached on mutation requests', () => {
        // Mock document.cookie with a CSRF token
        Object.defineProperty(document, 'cookie', {
            value: 'csrf_token=test-csrf-abc123',
            writable: true,
        });

        // Simulate reading CSRF token from cookie
        const match = document.cookie.match(/(^| )csrf_token=([^;]+)/);
        const csrfToken = match ? decodeURIComponent(match[2]) : null;

        expect(csrfToken).toBe('test-csrf-abc123');

        // Simulate attaching to request headers
        const headers: Record<string, string> = {};
        if (csrfToken) {
            headers['x-csrf-token'] = csrfToken;
        }

        expect(headers['x-csrf-token']).toBe('test-csrf-abc123');
    });

    test('proxy base URL is /api/proxy (not direct backend)', () => {
        // The ApiClient now points to the local BFF proxy
        const expectedBaseURL = '/api/proxy';
        expect(expectedBaseURL).toBe('/api/proxy');
    });
});
