"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  TrendingDown,
  AlertCircle,
  ClipboardList,
  User,
  MessageCircle,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { getUnreadNotificationCount } from "@/services";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────

interface NavItem {
  key: string;
  labelKey: string;
  href: string;
  originalPath?: string;
  icon: React.ElementType;
  accent: AccentKey;
  exact?: boolean;
  section: string | null;
}

type AccentKey = "primary" | "green" | "amber" | "violet" | "gray";

// ─── Accent map ───────────────────────────────────────────

const ACCENT: Record<
  AccentKey,
  {
    icon: string;
    activeBg: string;
    activeText: string;
    hoverBg: string;
    activeIcon: string;
  }
> = {
  primary: {
    icon: "bg-primary/10 text-primary",
    activeIcon: "bg-white/20 text-white",
    activeBg:
      "bg-gradient-to-r from-primary to-primary/85 text-primary-foreground shadow-sm shadow-primary/30",
    activeText: "text-primary-foreground",
    hoverBg: "hover:bg-primary/8",
  },
  green: {
    icon: "bg-green-500/10 text-green-600",
    activeIcon: "bg-white/20 text-white",
    activeBg:
      "bg-gradient-to-r from-green-500 to-green-400 text-white shadow-sm shadow-green-500/25",
    activeText: "text-white",
    hoverBg: "hover:bg-green-500/8",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-600",
    activeIcon: "bg-white/20 text-white",
    activeBg:
      "bg-gradient-to-r from-primary to-amber-400 text-white shadow-sm shadow-primary/30",
    activeText: "text-white",
    hoverBg: "hover:bg-amber-500/8",
  },
  violet: {
    icon: "bg-violet-500/10 text-violet-600",
    activeIcon: "bg-white/20 text-white",
    activeBg:
      "bg-gradient-to-r from-violet-600 to-violet-400 text-white shadow-sm shadow-violet-500/25",
    activeText: "text-white",
    hoverBg: "hover:bg-violet-500/8",
  },
  gray: {
    icon: "bg-muted text-muted-foreground",
    activeIcon: "bg-white/20 text-white",
    activeBg:
      "bg-gradient-to-r from-primary to-primary/85 text-white shadow-sm shadow-primary/25",
    activeText: "text-white",
    hoverBg: "hover:bg-muted/80",
  },
};

// ─── Navigation definition ────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    labelKey: "user_sidebar.dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    accent: "primary",
    exact: true,
    section: null,
  },
  {
    key: "weak_areas",
    labelKey: "user_sidebar.weak_areas",
    href: "/dashboard?section=weak-areas",
    originalPath: "/analytics/weak-areas",
    icon: TrendingDown,
    accent: "primary",
    section: "weak-areas",
  },
  {
    key: "error_patterns",
    labelKey: "user_sidebar.error_patterns",
    href: "/dashboard?section=error-patterns",
    originalPath: "/analytics/error-patterns",
    icon: AlertCircle,
    accent: "primary",
    section: "error-patterns",
  },
  {
    key: "exam_results",
    labelKey: "user_sidebar.exam_results",
    href: "/dashboard?section=exam-results",
    originalPath: "/exam/results",
    icon: ClipboardList,
    accent: "primary",
    section: "exam-results",
  },
];

const ACCOUNT_ITEMS: NavItem[] = [
  {
    key: "profile",
    labelKey: "user_sidebar.profile",
    href: "/dashboard?section=profile",
    originalPath: "/profile",
    icon: User,
    accent: "primary",
    section: "profile",
  },
];

// ─── Polling constants ────────────────────────────────────

const POLL_MS = 60_000; // 1 min — less aggressive than navbar's 30s
const MAX_ERRORS = 3;

// ─── Main Component ───────────────────────────────────────

function UserSidebarInner() {
  const { user, logout } = useAuth();
  const { t, isRTL } = useLanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSection = searchParams.get("section");

  // Hide sidebar during exam/practice sessions; keep it on results pages
  const hideSidebar =
    pathname.startsWith("/practice") ||
    (pathname.startsWith("/exam") && !pathname.startsWith("/exam/results"));

  const [unreadCount, setUnreadCount] = useState(0);
  const errorsRef = useRef(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // ── Notification count polling ──
  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const count = await getUnreadNotificationCount();
      errorsRef.current = 0;
      setUnreadCount(count);
    } catch {
      errorsRef.current += 1;
      if (errorsRef.current >= MAX_ERRORS && pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    errorsRef.current = 0;
    fetchUnread();
    pollingRef.current = setInterval(fetchUnread, POLL_MS);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [user, fetchUnread]);

  // ── Avatar initial ──
  const avatarInitial = (
    user?.firstName?.[0] ??
    user?.fullName?.[0] ??
    "U"
  ).toUpperCase();
  const displayName = user?.firstName ?? user?.fullName ?? "";

  if (hideSidebar) return null;

  return (
    <aside
      className={cn(
        "w-64 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto flex flex-col shrink-0",
        "hidden lg:flex",
        "bg-card shadow-[2px_0_16px_rgba(0,0,0,0.07)]",
        isRTL ? "border-l border-border/60" : "border-r border-border/60",
      )}
    >
      {/* ── Top accent strip ─────────────────────── */}
      <div className="h-[3px] shrink-0 bg-gradient-to-r from-primary via-primary/70 to-primary/20" />

      {/* ── Brand header ─────────────────────────── */}
      <div className="px-5 py-4 border-b border-border/50 bg-gradient-to-br from-primary/[0.07] via-primary/[0.03] to-transparent">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative shrink-0">
            <Image
              src="/images/logo.png"
              alt="ReadyRoad"
              width={36}
              height={36}
              className="rounded-xl ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-200"
            />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground leading-none">
              ReadyRoad
            </h2>
            <p className="text-[11px] text-primary/60 mt-0.5 font-medium">
              {t("user_sidebar.my_learning")}
            </p>
          </div>
        </Link>
      </div>

      {/* ── User info card ────────────────────────── */}
      <div className="px-4 py-3.5 border-b border-border/50 bg-gradient-to-br from-primary/[0.05] via-background/0 to-transparent">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(13,76%,53%)] to-[hsl(25,95%,50%)] text-white flex items-center justify-center font-black text-sm ring-2 ring-primary/25 ring-offset-2 ring-offset-background">
              {avatarInitial}
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 leading-none ring-2 ring-background">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          {/* Name + welcome */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground font-medium">
              {t("user_sidebar.welcome_back")}
            </p>
            <p className="text-sm font-bold text-foreground truncate">
              {displayName}
            </p>
          </div>

          {/* Settings shortcut */}
          <Link
            href="/profile"
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-primary/40 hover:text-primary hover:bg-primary/10 transition-colors"
            title={t("user_sidebar.profile")}
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Main navigation ───────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {/* Learning section label */}
        <div className="flex items-center gap-2 px-1 pb-2.5">
          <span className="inline-block w-4 h-[2px] rounded-full bg-gradient-to-r from-primary/60 to-primary/20" />
          <p className="text-[9.5px] font-black uppercase tracking-[0.13em] text-primary/60">
            {t("user_sidebar.section_learning")}
          </p>
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive =
            item.section === null
              ? pathname === "/dashboard" && !currentSection
              : (pathname === "/dashboard" &&
                  currentSection === item.section) ||
                (item.originalPath
                  ? pathname.startsWith(item.originalPath)
                  : false);

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-sm group",
                isActive
                  ? `${ACCENT[item.accent].activeBg} font-semibold`
                  : `text-muted-foreground hover:text-foreground ${ACCENT[item.accent].hoverBg}`,
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200",
                  isActive
                    ? (ACCENT[item.accent].activeIcon ??
                        "bg-white/20 text-white")
                    : cn(
                        "bg-muted/70 text-muted-foreground",
                        `group-hover:${ACCENT[item.accent].icon.split(" ")[0]}`,
                      ),
                )}
              >
                <item.icon className="w-4 h-4" />
              </div>
              <span className="flex-1 truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}

        {/* Account section */}
        <div className="pt-4">
          <div className="flex items-center gap-2 px-1 pb-2.5">
            <span className="inline-block w-4 h-[2px] rounded-full bg-gradient-to-r from-primary/60 to-primary/20" />
            <p className="text-[9.5px] font-black uppercase tracking-[0.13em] text-primary/60">
              {t("user_sidebar.section_account")}
            </p>
          </div>
          {ACCOUNT_ITEMS.map((item) => {
            const isActive =
              item.section === null
                ? pathname === "/dashboard" && !currentSection
                : (pathname === "/dashboard" &&
                    currentSection === item.section) ||
                  (item.originalPath
                    ? pathname.startsWith(item.originalPath)
                    : false);

            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-sm group",
                  isActive
                    ? `${ACCENT[item.accent].activeBg} font-semibold`
                    : `text-muted-foreground hover:text-foreground ${ACCENT[item.accent].hoverBg}`,
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200",
                    isActive
                      ? (ACCENT[item.accent].activeIcon ??
                          "bg-white/20 text-white")
                      : "bg-muted/70 text-muted-foreground",
                  )}
                >
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="flex-1 truncate">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Bottom actions ────────────────────────── */}
      <div className="px-3 py-4 border-t border-border/50 space-y-0.5 bg-gradient-to-t from-muted/30 to-transparent">
        <Link
          href="/contact"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-primary/8 transition-all duration-200 group"
        >
          <div className="w-8 h-8 rounded-xl bg-muted/70 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center shrink-0 transition-all duration-200">
            <MessageCircle className="w-4 h-4" />
          </div>
          <span className="flex-1 truncate">{t("user_sidebar.support")}</span>
        </Link>

        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500/80 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 group"
        >
          <div className="w-8 h-8 rounded-xl bg-red-50/70 dark:bg-red-950/20 text-red-400 group-hover:bg-red-100 dark:group-hover:bg-red-950/40 group-hover:text-red-500 flex items-center justify-center shrink-0 transition-all duration-200">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="flex-1 text-start truncate">{t("auth.logout")}</span>
        </button>
      </div>
    </aside>
  );
}

export function UserSidebar() {
  return (
    <Suspense fallback={null}>
      <UserSidebarInner />
    </Suspense>
  );
}
