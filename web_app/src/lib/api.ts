/**
 * API Client — ReadyRoad Next.js BFF Proxy
 *
 * SECURITY MODEL:
 * - All requests proxied through Next.js BFF (Client → /api/proxy/{path} → Backend)
 * - JWT stored in HttpOnly cookie (server-side only)
 * - Proxy reads the cookie and attaches it as Authorization: Bearer
 * - Client JS never handles the raw JWT token
 * - CSRF double-submit token sent as header on mutation requests
 */

import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosRequestConfig,
} from 'axios';
import { ROUTES } from './constants';
import { getCsrfToken } from './auth-token';

// ─── Constants ───────────────────────────────────────────

const MUTATION_METHODS  = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const AUTH_PATHS        = ['/auth/login', '/auth/register'];
const CSRF_HEADER       = 'x-csrf-token';

// ─── ApiClient ───────────────────────────────────────────

class ApiClient {
  private readonly instance: AxiosInstance;
  /** Guard: prevents duplicate 401/403 redirect races */
  private isRedirecting = false;

  constructor() {
    this.instance = axios.create({
      baseURL: '/api/proxy',
      timeout: 30_000,
      headers: {
        'Content-Type': 'application/json',
        Accept:         'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request: attach CSRF token on mutation requests
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const method = config.method?.toUpperCase() ?? '';
        if (MUTATION_METHODS.has(method)) {
          const csrf = getCsrfToken();
          if (csrf) config.headers[CSRF_HEADER] = csrf;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error),
    );

    // Response: handle auth errors globally
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        const status     = error.response?.status;
        const requestUrl = error.config?.url ?? '';

        const isAuthError =
          status === 401 ||
          (status === 403 && requestUrl.includes('/users/me'));

        const isAuthPath = AUTH_PATHS.some(p => requestUrl.includes(p));

        if (isAuthError && !isAuthPath && !this.isRedirecting && typeof window !== 'undefined') {
          this.isRedirecting = true;
          // Clear HttpOnly cookie via BFF, then redirect
          fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
            window.location.href = ROUTES.LOGIN;
          });
        }

        return Promise.reject(error);
      },
    );
  }

  // ─── HTTP Methods ─────────────────────────────────────

  get<T>(url: string, params?: Record<string, unknown>): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, { params });
  }

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }

  put<T>(url: string, data?: unknown): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data);
  }

  patch<T>(url: string, data?: unknown): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data);
  }

  delete<T>(url: string): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url);
  }

  getInstance(): AxiosInstance {
    return this.instance;
  }
}

// ─── Singleton ───────────────────────────────────────────

export const apiClient = new ApiClient();
export default apiClient;

// ─── Error Utilities ─────────────────────────────────────

/**
 * Returns true when the HTTP status signals backend unavailability.
 */
export function isUnavailableStatus(status: number | undefined): boolean {
  return status === 502 || status === 503;
}

/**
 * Returns true when the error is a 502/503 (backend down / unreachable).
 * Works with Axios errors and any object with a numeric `status` property.
 */
export function isServiceUnavailable(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return isUnavailableStatus(error.response?.status);
  }
  if (error && typeof error === 'object' && 'status' in error) {
    return isUnavailableStatus((error as { status: number }).status);
  }
  return false;
}

/**
 * Smart API error logger.
 * - 502/503 → `console.warn`  (backend down, expected during dev)
 * - everything else → `console.error` (real bug, needs attention)
 *
 * @example
 * catch (err) { logApiError('[CategoryService] load', err); }
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
