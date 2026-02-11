// API Client using Axios for ReadyRoad Next.js App
// Fixed version with proper public endpoint handling

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, STORAGE_KEYS, ROUTES } from './constants';
import { getAuthToken } from './auth-token';

class ApiClient {
  private instance: AxiosInstance;

  // Public endpoints that DON'T require authentication
  // Note: baseURL already includes /api, so paths are relative to /api
  private readonly PUBLIC_ENDPOINTS = [
    // Authentication
    '/auth/login',
    '/auth/register',
    // Public content (read-only)
    '/traffic-signs',
    '/lessons',
    '/categories',
    '/questions/public',
    '/smart-quiz',
    '/search', // ✅ Search is public
    // Health & monitoring
    '/actuator/health',
    '/actuator/info',
    // API docs
    '/v3/api-docs',
    '/swagger-ui',
  ];

  constructor() {
    this.instance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // 🔧 DEBUG: Log API configuration
    if (typeof window !== 'undefined') {
      console.log('🔧 API Client Configuration:', {
        baseURL: this.instance.defaults.baseURL,
        timeout: this.instance.defaults.timeout,
      });
    }

    this.setupInterceptors();
  }

  /**
   * Check if the URL is a public endpoint
   */
  private isPublicEndpoint(url: string): boolean {
    return this.PUBLIC_ENDPOINTS.some(endpoint => url.startsWith(endpoint));
  }

  private setupInterceptors() {
    // ═══════════════════════════════════════════════════════════
    // Request Interceptor: Add JWT token to protected endpoints
    // ═══════════════════════════════════════════════════════════
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
          const url = config.url || '';

          // Only add token if this is NOT a public endpoint
          if (!this.isPublicEndpoint(url)) {
            const token = getAuthToken();

            console.log('[API] Protected endpoint:', url);
            console.log('[API] Token found:', token ? `${token.substring(0, 20)}...` : 'null');

            if (token) {
              // Ensure headers exist
              config.headers = config.headers || {};
              config.headers.Authorization = `Bearer ${token}`;
            } else {
              console.warn('[API] ⚠️ No token found for protected endpoint:', url);
            }
          }
        }
        return config;
      },
      (error: AxiosError) => {
        console.error('[API Client] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // ═══════════════════════════════════════════════════════════
    // Response Interceptor: Handle errors globally
    // ═══════════════════════════════════════════════════════════
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || '';

        // Handle 401 Unauthorized (token expired/invalid)
        if (status === 401) {
          // Don't redirect if this is a login/register request (they return 401 on purpose)
          const isAuthRequest = requestUrl.includes('/auth/login') ||
            requestUrl.includes('/auth/register');

          if (!isAuthRequest && typeof window !== 'undefined') {
            console.warn('[API Client] 401 Unauthorized - Clearing session and redirecting to login');

            // Clear all auth data
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER_DATA);

            // Clear cookie to prevent middleware redirect loop
            document.cookie = `${STORAGE_KEYS.AUTH_TOKEN}=; path=/; max-age=0`;

            // Redirect to login
            window.location.href = ROUTES.LOGIN;
          }
        }

        // Handle 403 Forbidden (insufficient permissions)
        if (status === 403) {
          console.error('[API Client] 403 Forbidden - Access denied to:', requestUrl);
          // You can add a notification here or redirect to a "No Access" page
        }

        // Handle 404 Not Found
        if (status === 404) {
          console.warn('[API Client] 404 Not Found:', requestUrl);
          // You might want to show a user-friendly message
        }

        // Handle 500 Server Error
        if (status === 500) {
          console.error('[API Client] 500 Server Error:', requestUrl);
          // You can show a generic error message to the user
        }

        return Promise.reject(error);
      }
    );
  }

  // ═══════════════════════════════════════════════════════════
  // HTTP Methods
  // ═══════════════════════════════════════════════════════════

  /**
   * GET Request
   */
  async get<T>(url: string, params?: Record<string, unknown>): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, { params });
  }

  /**
   * POST Request
   */
  async post<T>(url: string, data?: unknown): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data);
  }

  /**
   * PUT Request
   */
  async put<T>(url: string, data?: unknown): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data);
  }

  /**
   * DELETE Request
   */
  async delete<T>(url: string): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url);
  }

  /**
   * PATCH Request
   */
  async patch<T>(url: string, data?: unknown): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data);
  }

  /**
   * Get the raw Axios instance (for advanced use cases)
   */
  getInstance(): AxiosInstance {
    return this.instance;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export default for compatibility
export default apiClient;
