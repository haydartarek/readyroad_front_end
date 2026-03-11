"use client";

/**
 * NotificationContext
 *
 * Single source of truth for unread notification count.
 * - Polls /api/users/me/notifications/count every 30 s (base interval)
 * - Exponential backoff up to MAX_ERRORS consecutive failures, then stops
 * - Deduplicates rapid calls (DEDUPE_MS guard)
 * - Refreshes on tab-focus (visibilitychange)
 * - optimistically resets count to 0 on markAllRead()
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
const MAX_ERRORS = 3;

// ─── Context shape ────────────────────────────────────────

export interface NotificationCtx {
  /** Current unread count (updated optimistically on markAllRead) */
  unreadCount: number;
  /** Force an immediate re-fetch (bypasses DEDUPE_MS guard) */
  refresh: () => void;
  /**
   * Optimistically sets count to 0 and fires markAllNotificationsAsRead.
   * Call this whenever the user explicitly clears notifications.
   */
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationCtx>({
  unreadCount: 0,
  refresh: () => {},
  markAllRead: async () => {},
});

// ─── Provider ─────────────────────────────────────────────

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const errorsRef = useRef(0);
  const lastFetchRef = useRef(0);

  // ── Stop any running interval ──────────────────────────
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // ── Core fetch ────────────────────────────────────────
  const fetchUnread = useCallback(async () => {
    if (!user) return;

    const now = Date.now();
    if (now - lastFetchRef.current < DEDUPE_MS) return;
    lastFetchRef.current = now;

    if (errorsRef.current >= MAX_ERRORS) {
      stopPolling();
      return;
    }

    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
      errorsRef.current = 0;
    } catch {
      errorsRef.current += 1;
      if (errorsRef.current >= MAX_ERRORS) {
        stopPolling();
        console.warn(
          "[NotificationContext] Polling stopped after repeated failures",
        );
      } else {
        // restart at exponential-backoff interval
        stopPolling();
        pollingRef.current = setInterval(
          fetchUnread,
          BASE_POLL_MS * Math.pow(2, errorsRef.current),
        );
      }
    }
  }, [user, stopPolling]);

  // ── Mount / user-change lifecycle ─────────────────────
  useEffect(() => {
    if (!user) {
      stopPolling();
      setUnreadCount(0);
      return;
    }

    errorsRef.current = 0;
    lastFetchRef.current = 0;

    queueMicrotask(fetchUnread);
    stopPolling();
    pollingRef.current = setInterval(fetchUnread, BASE_POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        lastFetchRef.current = 0; // bypass dedupe on tab-focus
        fetchUnread();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user, fetchUnread, stopPolling]);

  // ── Public API ────────────────────────────────────────

  const markAllRead = useCallback(async () => {
    setUnreadCount(0); // optimistic
    await markAllNotificationsAsRead().catch(() => {});
  }, []);

  const refresh = useCallback(() => {
    lastFetchRef.current = 0;
    fetchUnread();
  }, [fetchUnread]);

  return (
    <NotificationContext.Provider value={{ unreadCount, markAllRead, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────

export function useNotifications(): NotificationCtx {
  return useContext(NotificationContext);
}
