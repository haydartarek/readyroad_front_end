"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useLanguage } from "@/contexts/language-context";
import { AuthSuccessModal } from "@/components/ui/auth-success-modal";
import { LogoutModal } from "@/components/ui/logout-modal";
import { ROUTES } from "@/lib/constants";
import { type User, type LoginRequest } from "@/lib/types";
import { isUnavailableStatus, logApiError } from "@/lib/api";

/**
 * SECURITY MODEL:
 * - JWT stored in HttpOnly cookie (set by BFF /api/auth/login)
 * - Client JS never sees the raw token
 * - Auth state resolved via GET /api/auth/me (BFF route)
 * - Logout calls POST /api/auth/logout → clears cookie server-side
 * - Zero localStorage usage for auth data
 */

// ─── Types ───────────────────────────────────────────────

interface LoginResult {
  success: boolean;
  message?: string;
  /** 503 = backend down */
  status?: number;
}

interface LoginOptions {
  /** True when called immediately after a new account registration */
  isNewUser?: boolean;
}

interface SuccessModalState {
  open: boolean;
  username: string;
  isNewUser: boolean;
  redirectPath: string;
}

interface LogoutModalState {
  open: boolean;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  serviceUnavailable: boolean;
  login: (
    credentials: LoginRequest,
    redirectPath?: string,
    options?: LoginOptions,
  ) => Promise<LoginResult>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

// ─── Constants ───────────────────────────────────────────

const CSRF_COOKIE = "csrf_token";
const SESSION_EXPIRED_KEY = "session_expired";

// ─── Context ─────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helpers ─────────────────────────────────────────────

function hasSessionCookie(): boolean {
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${CSRF_COOKIE}=`));
}

function normalizeUser(raw: Record<string, unknown>): User {
  const fullName = (raw.fullName as string) ?? "";
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    userId: (raw.userId as number) ?? 0,
    username: (raw.username as string) ?? "",
    email: (raw.email as string) ?? "",
    fullName,
    firstName:
      (raw.firstName as string) ||
      nameParts[0] ||
      undefined,
    lastName:
      (raw.lastName as string) ||
      (nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined),
    role: (raw.role as string) ?? "USER",
    isActive: true,
    createdAt: (raw.createdAt as string) || undefined,
  };
}

// ─── Provider ────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [successModal, setSuccessModal] = useState<SuccessModalState>({
    open: false,
    username: "",
    isNewUser: false,
    redirectPath: "",
  });
  const [logoutModal, setLogoutModal] = useState<LogoutModalState>({
    open: false,
    username: "",
  });

  const isAuthenticated = !!user;

  const clearAuth = useCallback(async () => {
    setUser(null);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Best-effort — cookie will expire eventually
    }
  }, []);

  const fetchUser = useCallback(async () => {
    if (!hasSessionCookie()) {
      setUser(null);
      setServiceUnavailable(false);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });

      if (response.ok) {
        const raw = (await response.json()) as Record<string, unknown>;
        // Use normalizeUser so firstName is extracted from fullName on page refresh
        // (same normalization applied during login)
        setUser(normalizeUser(raw));
        setServiceUnavailable(false);
        return;
      }

      if (isUnavailableStatus(response.status)) {
        setServiceUnavailable(true);
        return;
      }

      // 4xx — invalid / expired session
      setUser(null);
      setServiceUnavailable(false);

      if (response.status === 401) {
        // Clear the stale CSRF cookie so the next page load does not repeat
        // this /api/auth/me call. The token cookie is HttpOnly (cannot be
        // cleared from JS) but the middleware expiry check handles it and
        // redirects protected routes to login automatically.
        try {
          document.cookie = `${CSRF_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
        } catch {
          /* noop */
        }
        try {
          sessionStorage.setItem(SESSION_EXPIRED_KEY, "1");
        } catch {
          /* noop */
        }
      }
    } catch (error) {
      logApiError("[AuthContext] fetchUser", error);
      setServiceUnavailable(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // On mount: resolve session from HttpOnly cookie via BFF
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(
    async (
      credentials: LoginRequest,
      redirectPath?: string,
      options?: LoginOptions,
    ): Promise<LoginResult> => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          // Return backend message if present; otherwise undefined so the
          // login page can apply the translated t('auth.login_failed') key.
          const message = errorData.message as string | undefined;
          return { success: false, message, status: response.status };
        }

        const raw = await response.json();
        const normalizedUser = normalizeUser(raw);
        setUser(normalizedUser);
        const displayName =
          normalizedUser.firstName ??
          normalizedUser.fullName?.split(" ")[0] ??
          normalizedUser.username;

        // Show success modal — it handles the redirect after 2.8s
        setSuccessModal({
          open: true,
          username: displayName,
          isNewUser: options?.isNewUser ?? false,
          redirectPath: redirectPath ?? ROUTES.DASHBOARD,
        });
        return { success: true };
      } catch (error) {
        // Network / server errors (ECONNREFUSED, etc.)
        logApiError("[AuthContext] login", error);
        const message =
          error instanceof TypeError && error.message.includes("fetch")
            ? "Backend service unavailable"
            : "An unexpected error occurred. Please try again.";
        return { success: false, message, status: 503 };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    // Save display name BEFORE clearing auth state
    const displayName =
      user?.firstName ?? user?.fullName?.split(" ")[0] ?? user?.username ?? "";
    // Clear HttpOnly cookie server-side before showing the modal
    await clearAuth();
    // Show farewell modal — it handles the redirect after 2.5s
    setLogoutModal({ open: true, username: displayName });
  }, [clearAuth, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        serviceUnavailable,
        login,
        logout,
        fetchUser,
      }}
    >
      {children}
      <AuthSuccessModal
        isOpen={successModal.open}
        username={successModal.username}
        title={t(
          successModal.isNewUser
            ? "auth.modal.thank_you"
            : "auth.modal.welcome_back",
        )}
        subtitle={t(
          successModal.isNewUser
            ? "auth.modal.register_subtitle"
            : "auth.modal.login_subtitle",
        )}
        redirectingText={t("auth.modal.redirecting")}
        onRedirect={() => {
          window.location.href = successModal.redirectPath;
        }}
      />
      <LogoutModal
        isOpen={logoutModal.open}
        username={logoutModal.username}
        title={t("auth.modal.goodbye")}
        subtitle={t("auth.modal.logout_subtitle")}
        redirectingText={t("auth.modal.logout_redirecting")}
        onRedirect={() => {
          window.location.href = ROUTES.LOGIN;
        }}
      />
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

// ─── RBAC Utilities ──────────────────────────────────────

export function hasRole(user: User | null, role: string): boolean {
  return user?.role === role;
}

export function hasAnyRole(user: User | null, roles: string[]): boolean {
  return user ? roles.includes(user.role) : false;
}

export function isAdmin(user: User | null): boolean {
  return hasRole(user, "ADMIN");
}
export function isModerator(user: User | null): boolean {
  return hasRole(user, "MODERATOR");
}
export function canModerate(user: User | null): boolean {
  return hasAnyRole(user, ["MODERATOR", "ADMIN"]);
}
