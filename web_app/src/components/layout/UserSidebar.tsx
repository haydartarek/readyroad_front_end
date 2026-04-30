"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  TrendingDown,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useNotifications } from "@/contexts/notification-context";
import { cn } from "@/lib/utils";

interface NavItem {
  key: string;
  labelKey: string;
  href: string;
  icon: React.ElementType;
  section: string | null;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    labelKey: "user_sidebar.dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    section: null,
  },
  {
    key: "weak_areas",
    labelKey: "user_sidebar.weak_areas",
    href: "/dashboard?section=weak-areas",
    icon: TrendingDown,
    section: "weak-areas",
  },
  {
    key: "error_patterns",
    labelKey: "user_sidebar.error_patterns",
    href: "/dashboard?section=error-patterns",
    icon: AlertCircle,
    section: "error-patterns",
  },
  {
    key: "exam_results",
    labelKey: "user_sidebar.exam_results",
    href: "/dashboard?section=exam-results",
    icon: ClipboardList,
    section: "exam-results",
  },
];

const ACCOUNT_ITEMS: NavItem[] = [
  {
    key: "profile",
    labelKey: "user_sidebar.profile",
    href: "/dashboard?section=profile",
    icon: User,
    section: "profile",
  },
];

function SidebarSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-1 pb-2 pt-3">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

function SidebarNavLink({
  item,
  isActive,
  label,
  isRTL,
}: {
  item: NavItem;
  isActive: boolean;
  label: string;
  isRTL: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm transition-all duration-200",
        isActive
          ? "border-primary/20 bg-primary/[0.07] text-foreground shadow-sm"
          : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/60 hover:text-foreground",
      )}
    >
        <span
          className={cn(
            "absolute bottom-3 top-3 w-1 rounded-full transition-opacity",
            isActive ? "bg-primary opacity-100" : "opacity-0",
            isRTL ? "right-1.5" : "left-1.5",
          )}
        />
      <div
        className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border transition-all duration-200",
          isActive
            ? "border-primary/20 bg-primary/10 text-primary"
            : "border-border/60 bg-muted/35 text-muted-foreground group-hover:border-primary/15 group-hover:bg-primary/10 group-hover:text-primary",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span className={cn("flex-1 truncate", isActive && "font-semibold")}>
        {label}
      </span>
    </Link>
  );
}

function UserSidebarInner() {
  const { user, logout } = useAuth();
  const { t, isRTL } = useLanguage();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSection = searchParams.get("section");

  const hideSidebar =
    pathname.startsWith("/practice") ||
    (pathname.startsWith("/exam") && !pathname.startsWith("/exam/results"));

  if (hideSidebar) return null;

  const avatarInitial = (
    user?.firstName?.[0] ??
    user?.fullName?.[0] ??
    "U"
  ).toUpperCase();

  const displayName = user?.fullName ?? user?.firstName ?? t("app.name");

  return (
    <aside
      className={cn(
        "sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 overflow-y-auto border-border/60 bg-background/95 shadow-[8px_0_28px_rgba(15,23,42,0.04)] backdrop-blur lg:flex lg:flex-col",
        isRTL ? "border-l" : "border-r",
      )}
    >
      <div className="border-b border-border/60 px-5 pb-5 pt-5">
        <div className="rounded-[1.75rem] border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-sm font-black text-primary">
                {avatarInitial}
              </div>
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground ring-2 ring-card">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/80">
                {t("user_sidebar.workspace_title")}
              </p>
              <p className="truncate text-sm font-bold text-foreground">
                {displayName}
              </p>
              <p className="text-xs font-medium leading-5 text-muted-foreground">
                {t("user_sidebar.workspace_subtitle")}
              </p>
              {user?.email ? (
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <div>
          <SidebarSectionLabel>
            {t("user_sidebar.section_learning")}
          </SidebarSectionLabel>
          <div className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.section === null
                  ? pathname === "/dashboard" && !currentSection
                  : pathname === "/dashboard" && currentSection === item.section;

              return (
                <SidebarNavLink
                  key={item.key}
                  item={item}
                  isActive={isActive}
                  label={t(item.labelKey)}
                  isRTL={isRTL}
                />
              );
            })}
          </div>
        </div>

        <div>
          <SidebarSectionLabel>
            {t("user_sidebar.section_account")}
          </SidebarSectionLabel>
          <div className="space-y-1.5">
            {ACCOUNT_ITEMS.map((item) => {
              const isActive = pathname === "/dashboard" && currentSection === item.section;
              return (
                <SidebarNavLink
                  key={item.key}
                  item={item}
                  isActive={isActive}
                  label={t(item.labelKey)}
                  isRTL={isRTL}
                />
              );
            })}
          </div>
        </div>
      </nav>

      <div className="border-t border-border/60 px-4 py-4">
        <div className="space-y-1.5">
          <Link
            href="/contact"
            className="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm text-muted-foreground transition-all duration-200 hover:border-border/70 hover:bg-muted/70 hover:text-foreground"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-muted/35 text-muted-foreground transition-all duration-200 group-hover:border-primary/15 group-hover:bg-primary/10 group-hover:text-primary">
              <MessageCircle className="h-4 w-4" />
            </div>
            <span className="flex-1 truncate font-medium">
              {t("user_sidebar.support")}
            </span>
          </Link>

          <button
            onClick={() => logout()}
            className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm text-red-600/85 transition-all duration-200 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/25"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border border-red-200/60 bg-red-50 text-red-500 transition-colors group-hover:border-red-300 group-hover:bg-red-100">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="flex-1 text-start font-semibold">
              {t("auth.logout")}
            </span>
          </button>
        </div>
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
