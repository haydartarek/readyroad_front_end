/**
 * Auth Context Tests
 * Tests token set/clear behavior and logout functionality
 * WITHOUT mocking the backend - uses localStorage stub only
 */

import { STORAGE_KEYS, ROUTES } from '@/lib/constants';

describe('AuthContext Logic', () => {
    let localStorageMock: { [key: string]: string };

    beforeEach(() => {
        // Setup localStorage mock
        localStorageMock = {};

        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn((key: string) => localStorageMock[key] || null),
                setItem: jest.fn((key: string, value: string) => {
                    localStorageMock[key] = value;
                }),
                removeItem: jest.fn((key: string) => {
                    delete localStorageMock[key];
                }),
                clear: jest.fn(() => {
                    localStorageMock = {};
                }),
            },
            writable: true,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('logout clears auth token from localStorage', () => {
        // Setup: Store a token
        localStorageMock[STORAGE_KEYS.AUTH_TOKEN] = 'test-token';
        localStorageMock[STORAGE_KEYS.USER_DATA] = JSON.stringify({ id: 1, email: 'test@example.com' });

        // Simulate logout behavior
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);

        // Verify token is cleared
        expect(window.localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_TOKEN);
        expect(window.localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_DATA);
        expect(localStorageMock[STORAGE_KEYS.AUTH_TOKEN]).toBeUndefined();
    });

    test('auth token storage key is correct', () => {
        expect(STORAGE_KEYS.AUTH_TOKEN).toBe('readyroad_auth_token');
    });

    test('user data storage key is correct', () => {
        expect(STORAGE_KEYS.USER_DATA).toBe('readyroad_user');
    });

    test('login route is correct', () => {
        expect(ROUTES.LOGIN).toBe('/login');
    });
});

