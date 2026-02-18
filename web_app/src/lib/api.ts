// API Client using Axios for ReadyRoad Next.js App
// Fixed version with proper public endpoint handling

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse, AxiosRequestConfig } from 'axios';
import { API_CONFIG, STORAGE_KEYS, ROUTES } from './constants';
import { getAuthToken, removeAuthToken } from './auth-token';

class ApiClient {
  private instance: AxiosInstance;
  /** Guard: true while a 401/403 redirect is already in progress */
  private isRedirecting = false;

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

  /**
   * Summarize response body for logging (safe, never too large).
   */
  private summarizeBody(data: unknown): string {
    if (data === null || data === undefined) return '(empty)';
    if (typeof data === 'string') {
      return data.length > 200 ? `${data.substring(0, 200)}… (${data.length} chars)` : data;
    }
    if (typeof data === 'object') {
      const keys = Object.keys(data as Record<string, unknown>);
      const preview = JSON.stringify(data).substring(0, 300);
      return `{keys:[${keys.join(',')}]} ${preview.length >= 300 ? preview + '…' : preview}`;
    }
    return String(data);
  }

  private setupInterceptors() {
    // ═══════════════════════════════════════════════════════════
    // Request Interceptor: Add JWT token to protected endpoints
    // ═══════════════════════════════════════════════════════════
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
          const url = config.url || '';
          const method = (config.method || 'GET').toUpperCase();

          // Only add token if this is NOT a public endpoint
          if (!this.isPublicEndpoint(url)) {
            const token = getAuthToken();

            console.log(`[API] → ${method} ${url} | auth: ${token ? 'yes' : 'NO TOKEN'}`);

            if (token) {
              config.headers = config.headers || {};
              config.headers.Authorization = `Bearer ${token}`;
            } else {
              console.warn(`[API] ⚠️ No token for protected ${method} ${url}`);
            }
          } else {
            console.log(`[API] → ${method} ${url} (public)`);
          }
        }
        return config;
      },
      (error: AxiosError) => {
        console.error('[API] Request interceptor error:', error.message);
        return Promise.reject(error);
      }
    );

    // ═══════════════════════════════════════════════════════════
    // Response Interceptor: Log result + handle errors globally
    // ═══════════════════════════════════════════════════════════
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log every successful response: method, URL, status, body summary
        if (typeof window !== 'undefined') {
          const method = (response.config.method || 'GET').toUpperCase();
          const url = response.config.url || '';
          console.log(
            `[API] ← ${method} ${url} | ${response.status} | ${this.summarizeBody(response.data)}`
          );
        }
        return response;
      },
      (error: AxiosError) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || '';
        const method = (error.config?.method || 'GET').toUpperCase();
        const errorBody = error.response?.data;

        // Always log the full error details: method, URL, status, body
        if (typeof window !== 'undefined') {
          console.error(
            `[API] ← ${method} ${requestUrl} | ${status ?? 'NETWORK_ERROR'} | ${this.summarizeBody(errorBody)}`
          );
        }

        // Handle 401 Unauthorized (token expired/invalid)
        // Also handle 403 on /users/me/** endpoints as auth-invalid
        // (safety net for legacy backend behaviour before AuthenticationEntryPoint fix).
        if (status === 401 || (status === 403 && requestUrl.includes('/users/me'))) {
          const isAuthRequest = requestUrl.includes('/auth/login') ||
            requestUrl.includes('/auth/register');

          if (!isAuthRequest && typeof window !== 'undefined' && !this.isRedirecting) {
            this.isRedirecting = true;
            console.warn(`[API] ${status} — Clearing session, redirecting to login`);

            removeAuthToken();
            localStorage.removeItem(STORAGE_KEYS.USER_DATA);
            window.location.href = ROUTES.LOGIN;
          }
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
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
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
