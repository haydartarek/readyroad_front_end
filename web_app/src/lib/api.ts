/**
 * API Client using Axios for ReadyRoad Next.js App
 *
 * SECURITY MODEL:
 * - All requests are proxied through Next.js BFF route handlers
 *   (Client → /api/proxy/{path} → Backend)
 * - The JWT token is stored in an HttpOnly cookie (server-side only)
 * - The proxy reads the cookie and attaches it as Authorization: Bearer
 * - Client-side JavaScript NEVER handles the raw JWT token
 * - CSRF double-submit token is sent as a header on mutation requests
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosRequestConfig,
} from 'axios';
import { ROUTES } from './constants';
import { getCsrfToken } from './auth-token';

class ApiClient {
  private instance: AxiosInstance;
  /** Guard: true while a 401/403 redirect is already in progress */
  private isRedirecting = false;

  constructor() {
    this.instance = axios.create({
      // All API requests go through the Next.js BFF proxy.
      // The proxy reads the HttpOnly auth cookie and forwards it
      // as a Bearer token to the backend.
      baseURL: '/api/proxy',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // ═══════════════════════════════════════════════════════════
    // Request Interceptor: Attach CSRF token on mutation requests
    // No Authorization header needed — the proxy handles it
    // ═══════════════════════════════════════════════════════════
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Attach CSRF double-submit token on state-changing methods
        const method = (config.method || '').toUpperCase();
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          const csrfToken = getCsrfToken();
          if (csrfToken) {
            config.headers = config.headers || {};
            config.headers['x-csrf-token'] = csrfToken;
          }
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    // ═══════════════════════════════════════════════════════════
    // Response Interceptor: Handle auth errors globally
    // ═══════════════════════════════════════════════════════════
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || '';

        // Handle 401 Unauthorized or 403 on /users/me
        if (
          status === 401 ||
          (status === 403 && requestUrl.includes('/users/me'))
        ) {
          const isAuthRequest =
            requestUrl.includes('/auth/login') ||
            requestUrl.includes('/auth/register');

          if (
            !isAuthRequest &&
            typeof window !== 'undefined' &&
            !this.isRedirecting
          ) {
            this.isRedirecting = true;
            // Clear HttpOnly cookie via BFF logout, then redirect
            fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
              window.location.href = ROUTES.LOGIN;
            });
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ═══════════════════════════════════════════════════════════
  // HTTP Methods
  // ═══════════════════════════════════════════════════════════

  async get<T>(
    url: string,
    params?: Record<string, unknown>
  ): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, { params });
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }

  async put<T>(url: string, data?: unknown): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data);
  }

  async delete<T>(url: string): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url);
  }

  async patch<T>(url: string, data?: unknown): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data);
  }

  getInstance(): AxiosInstance {
    return this.instance;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export default for compatibility
export default apiClient;

// ═══════════════════════════════════════════════════════════
// Error Utilities — use in catch blocks instead of console.error
// ═══════════════════════════════════════════════════════════

/**
 * Returns true when the HTTP status code signals backend unavailability.
 */
export function isUnavailableStatus(status: number | undefined): boolean {
  return status === 502 || status === 503;
}

/**
 * Returns true when the error is a 502/503 (backend is down / unreachable).
 * Works with:
 *  - Axios errors (from apiClient)
 *  - Any object with a numeric `status` property (fetch-style wrappers)
 */
export function isServiceUnavailable(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return isUnavailableStatus(error.response?.status);
  }
  // Support generic error objects carrying a status (e.g. fetch wrappers)
  if (error && typeof error === 'object' && 'status' in error) {
    return isUnavailableStatus((error as { status: number }).status);
  }
  return false;
}

/**
 * Smart API error logger.
 * - 502/503 → console.warn  (backend down, expected during dev)
 * - everything else → console.error (real bug, needs attention)
 *
 * Usage:  catch (err) { logApiError('Failed to load categories', err); }
 */
export function logApiError(context: string, error: unknown): void {
  if (isServiceUnavailable(error)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`${context} — backend unavailable`);
    }
    return;
  }
  console.error(`${context}:`, error);
}
