"use client";

import { Suspense } from "react";
import Link from "@/components/localized-link";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  ClipboardList,
  LayoutDashboard,
  User,
  WalletCards,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useNotifications } from "@/contexts/notification-context";
import { cn } from "@/lib/utils";
import { useRoutePathname } from "@/hooks/use-route-pathname";

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
    key: "progress",
    labelKey: "dashboard.progress_v2.nav",
    href: "/dashboard?section=progress",
    icon: Activity,
    section: "progress",
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
    key: "plans",
    labelKey: "account_access.packages",
    href: "/#pricing",
    icon: WalletCards,
    section: null,
  },
  {
    key: "profile",
    labelKey: "user_sidebar.profile",
    href: "/dashboard?section=profile",
    icon: User,
    section: "profile",
  },
];

function SidebarSectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="px-3 pb-2">
      <p className="text-xs font-semibold text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

function SidebarNavLink({
  item,
  isActive,
  label,
}: {
  item: NavItem;
  isActive: boolean;
  label: string;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        isActive
          ? "bg-primary/10 text-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive
            ? "text-primary"
            : "text-muted-foreground group-hover:text-secondary",
        )}
        aria-hidden
      />

      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          isActive ? "font-semibold" : "font-medium",
        )}
      >
        {label}
      </span>
    </Link>
  );
}

function UserSidebarInner() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const { unreadCount } = useNotifications();
  const pathname = useRoutePathname();
  const searchParams = useSearchParams();
  const currentSection = searchParams.get("section");

  const hideSidebar =
    pathname.startsWith("/practice") ||
    (pathname.startsWith("/exam") &&
      !pathname.startsWith("/exam/results"));

  if (hideSidebar) return null;

  const avatarInitial = (
    user?.firstName?.[0] ??
    user?.fullName?.[0] ??
    "U"
  ).toUpperCase();

  const displayName =
    user?.fullName ??
    user?.firstName ??
    t("app.name");

  const isLearningItemActive = (item: NavItem) => {
    if (pathname !== "/dashboard") {
      return false;
    }

    if (item.section === null) {
      return !currentSection;
    }

    if (item.section === "progress") {
      return [
        "progress",
        "weak-areas",
        "error-patterns",
      ].includes(currentSection ?? "");
    }

    return currentSection === item.section;
  };

  const isAccountItemActive = (item: NavItem) =>
    item.section !== null &&
    pathname === "/dashboard" &&
    currentSection === item.section;

  return (
    <aside
      dir={isRTL ? "rtl" : "ltr"}
      className={cn(
        "sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-hidden border-border/60 bg-background lg:flex lg:flex-col",
        isRTL ? "border-l" : "border-r",
      )}
    >
      <div className="border-b border-border/60 px-5 py-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="relative shrink-0">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-sm font-black text-primary">
              {avatarInitial}
            </div>

            {unreadCount > 0 ? (
              <span
                className={cn(
                  "absolute -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground ring-2 ring-background",
                  isRTL ? "-left-1" : "-right-1",
                )}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-semibold text-primary">
              {t("user_sidebar.workspace_title")}
            </p>

            <p
              dir="auto"
              className="truncate text-sm font-semibold text-foreground"
            >
              {displayName}
            </p>

            {user?.email ? (
              <p
                dir="auto"
                className="truncate text-xs text-muted-foreground"
              >
                {user.email}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-6">
          <section>
            <SidebarSectionLabel>
              {t("user_sidebar.section_learning")}
            </SidebarSectionLabel>

            <div className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <SidebarNavLink
                  key={item.key}
                  item={item}
                  isActive={isLearningItemActive(item)}
                  label={t(item.labelKey)}
                />
              ))}
            </div>
          </section>

          <section>
            <SidebarSectionLabel>
              {t("user_sidebar.section_account")}
            </SidebarSectionLabel>

            <div className="space-y-1">
              {ACCOUNT_ITEMS.map((item) => (
                <SidebarNavLink
                  key={item.key}
                  item={item}
                  isActive={isAccountItemActive(item)}
                  label={t(item.labelKey)}
                />
              ))}
            </div>
          </section>
        </div>
      </nav>
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