// Auth Service - Handles authentication
// Location: src/services/authService.ts

import { apiClient } from '@/lib/api';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/lib/constants';
import { getAuthToken, setAuthToken, removeAuthToken } from '@/lib/auth-token';
import type { UserProfile } from './userService';

// ═══════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    username: string;
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
 * Login user
 * ✅ Endpoint: POST /api/auth/login
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
        const response = await apiClient.post<LoginResponse>(
            API_ENDPOINTS.AUTH.LOGIN,
            credentials
        );

        // Save token via centralized helper (localStorage + cookie)
        if (response.data.token) {
            setAuthToken(response.data.token);
        }

        return response.data;
    } catch (error) {
        console.error('[AuthService] Login failed:', error);
        throw error;
    }
};

/**
 * Register new user
 * ✅ Endpoint: POST /api/auth/register
 */
export const register = async (data: RegisterRequest): Promise<LoginResponse> => {
    try {
        const response = await apiClient.post<LoginResponse>(
            API_ENDPOINTS.AUTH.REGISTER,
            data
        );

        // Auto-login after registration
        if (response.data.token) {
            setAuthToken(response.data.token);
        }

        return response.data;
    } catch (error) {
        console.error('[AuthService] Registration failed:', error);
        throw error;
    }
};

/**
 * Logout user
 */
export const logout = (): void => {
    // Clear token from all storage (localStorage + cookie + legacy keys)
    removeAuthToken();
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);

    // Redirect to login
    window.location.href = '/login';
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Get stored token — delegates to centralized auth-token module
 */
export const getToken = getAuthToken;

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
