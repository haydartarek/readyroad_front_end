// API Client using Axios for ReadyRoad Next.js App

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, STORAGE_KEYS, ROUTES } from './constants';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request Interceptor: Add auth token (skip for auth endpoints)
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
          // Skip adding token only for login & register (auth/me NEEDS the token)
          const url = config.url || '';
          const isPublicAuthEndpoint =
            url.includes('/auth/login') || url.includes('/auth/register') ||
            url.startsWith('auth/login') || url.startsWith('auth/register');

          if (!isPublicAuthEndpoint) {
            const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          }
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response Interceptor: Handle errors globally
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Skip redirect for auth endpoints (login, register, fetchUser)
          // These are handled by auth-context.tsx directly
          const requestUrl = error.config?.url || '';
          const isAuthEndpoint =
            requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register') ||
            requestUrl.includes('/auth/me') ||
            requestUrl.startsWith('auth/login') || requestUrl.startsWith('auth/register') ||
            requestUrl.startsWith('auth/me');

          if (!isAuthEndpoint && typeof window !== 'undefined') {
            // Unauthorized on a protected endpoint - clear auth and redirect
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER_DATA);
            // CRITICAL: Also clear the cookie to prevent middleware redirect loop
            document.cookie = `${STORAGE_KEYS.AUTH_TOKEN}=; path=/; max-age=0`;
            window.location.href = ROUTES.LOGIN;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // GET Request
  async get<T>(url: string, params?: Record<string, unknown>): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, { params });
  }

  // POST Request
  async post<T>(url: string, data?: unknown): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data);
  }

  // PUT Request
  async put<T>(url: string, data?: unknown): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data);
  }

  // DELETE Request
  async delete<T>(url: string): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url);
  }

  // PATCH Request
  async patch<T>(url: string, data?: unknown): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export axios instance for direct access if needed
export default apiClient;
