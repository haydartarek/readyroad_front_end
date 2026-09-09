"use client";

/**
 * NotificationContext
 *
 * Single source of truth for unread notification count.
 * - Polls the unread-count notification endpoint every 30 s (base interval)
 * - Bounded exponential backoff with recovery after transient failures
 * - Deduplicates rapid calls (DEDUPE_MS guard)
 * - Refreshes on tab-focus (visibilitychange)
 * - Clears count only after a successful markAllRead()
 *
 * Wrap the authenticated part of the app with <NotificationProvider>.
 * Any component calls `useNotifications()` instead of running its own poll.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
} from "@/services/userService";

// ─── Constants ────────────────────────────────────────────

const BASE_POLL_MS = 30_000;
const DEDUPE_MS = 2_000;
const MAX_RETRY_MS = 5 * 60_000;

// ─── Context shape ────────────────────────────────────────

export interface NotificationCtx {
  /** Last confirmed unread count */
  unreadCount: number;
  /** Force an immediate re-fetch (bypasses DEDUPE_MS guard) */
  refresh: () => void;
  /** Changes when polling discovers new unread notification state. */
  revision: number;
  /**
   * Sets count to 0 after markAllNotificationsAsRead succeeds.
   * Call this whenever the user explicitly clears notifications.
   */
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationCtx>({
  unreadCount: 0,
  refresh: () => {},
  revision: 0,
  markAllRead: async () => {},
});

// ─── Provider ─────────────────────────────────────────────

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);
  const [revision, setRevision] = useState(0);
  const unreadCountRef = useRef(0);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorsRef = useRef(0);
  const lastFetchRef = useRef(0);
  const fetchUnreadRef = useRef<(() => Promise<void>) | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancelInFlight = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  // ── Stop any running interval ──────────────────────────
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    cancelInFlight();
  }, [cancelInFlight]);

  const scheduleFetch = useCallback(
    (delayMs: number) => {
      stopPolling();
      pollingRef.current = setTimeout(() => {
        void fetchUnreadRef.current?.();
      }, delayMs);
    },
    [stopPolling],
  );

  // ── Core fetch ────────────────────────────────────────
  const fetchUnread = useCallback(async () => {
    if (
      !user ||
      !isAuthenticated ||
      isLoading ||
      document.visibilityState === "hidden"
    ) {
      return;
    }

    const now = Date.now();
    if (now - lastFetchRef.current < DEDUPE_MS) return;
    lastFetchRef.current = now;

    cancelInFlight();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const count = await getUnreadNotificationCount(controller.signal);
      if (controller.signal.aborted) return;
      if (count !== unreadCountRef.current) {
        unreadCountRef.current = count;
        setUnreadCount(count);
        setRevision((current) => current + 1);
      }
      errorsRef.current = 0;
      scheduleFetch(BASE_POLL_MS);
    } catch (error) {
      if (controller.signal.aborted) return;
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 401 || status === 403) {
        stopPolling();
      } else {
        errorsRef.current = Math.min(errorsRef.current + 1, 4);
        scheduleFetch(Math.min(MAX_RETRY_MS, BASE_POLL_MS * Math.pow(2, errorsRef.current)));
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [
    user,
    isAuthenticated,
    isLoading,
    stopPolling,
    scheduleFetch,
    cancelInFlight,
  ]);

  useEffect(() => {
    fetchUnreadRef.current = fetchUnread;
  }, [fetchUnread]);

  // ── Mount / user-change lifecycle ─────────────────────
  useEffect(() => {
    if (!user || !isAuthenticated || isLoading) {
      stopPolling();
      unreadCountRef.current = 0;
      setUnreadCount(0);
      return;
    }

    errorsRef.current = 0;
    lastFetchRef.current = 0;

    queueMicrotask(() => {
      void fetchUnreadRef.current?.();
    });

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        lastFetchRef.current = 0; // bypass dedupe on tab-focus
        void fetchUnreadRef.current?.();
      } else {
        cancelInFlight();
      }
    };
    const onPageHide = () => {
      stopPolling();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [user, isAuthenticated, isLoading, stopPolling, cancelInFlight]);

  // ── Public API ────────────────────────────────────────

  const markAllRead = useCallback(async () => {
    await markAllNotificationsAsRead();
    unreadCountRef.current = 0;
    setUnreadCount(0);
  }, []);

  const refresh = useCallback(() => {
    lastFetchRef.current = 0;
    void fetchUnreadRef.current?.();
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount: user ? unreadCount : 0,
        revision,
        markAllRead,
        refresh,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────

export function useNotifications(): NotificationCtx {
  return useContext(NotificationContext);
}
