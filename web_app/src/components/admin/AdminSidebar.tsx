"use client";

import Link from "@/components/localized-link";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";
import {
  ADMIN_GROUPS,
  getVisibleRoutes,
  type AdminChildRoute,
  type AdminRoute,
} from "@/lib/admin-routes";
import { useRoutePathname } from "@/hooks/use-route-pathname";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-1 pb-2 pt-3">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

function AdminSidebarItem({
  route,
  pathname,
  t,
  isRTL,
  onNavigate,
}: {
  route: AdminRoute;
  pathname: string;
  t: (key: string) => string;
  isRTL: boolean;
  onNavigate?: () => void;
}) {
  const Icon = route.icon;
  const isActive = route.exact
    ? pathname === route.path
    : pathname === route.path || pathname.startsWith(route.path + "/");

  return (
    <li>
      <Link
        href={route.path}
        onClick={onNavigate}
        className={cn(
          "group relative flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm transition-all duration-200",
          isActive
            ? "border-primary/20 bg-primary/[0.08] text-foreground shadow-sm"
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
        {Icon ? (
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
        ) : null}
        <span className={cn("min-w-0 flex-1 break-words", isActive && "font-semibold")}>
          {t(route.labelKey)}
        </span>
      </Link>

      {route.children && isActive ? (
        <ul className={cn("mt-2 space-y-1", isRTL ? "mr-12" : "ml-12")}>
          {route.children.map((child: AdminChildRoute) => {
            const childActive = pathname === child.path;
            return (
              <li key={child.key}>
                <Link
                  href={child.path}
                  onClick={onNavigate}
                  className={cn(
                    "block rounded-xl px-3 py-2 text-sm transition-colors",
                    childActive
                      ? "bg-muted font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  )}
                >
                  {t(child.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

export default function AdminSidebar({
  variant = "desktop",
  onNavigate,
}: {
  variant?: "desktop" | "drawer";
  onNavigate?: () => void;
}) {
  const pathname = useRoutePathname();
  const { t, isRTL } = useLanguage();
  const hasTopNavbar = pathname === "/admin/dashboard";

  const visibleRoutes = getVisibleRoutes([]);
  const groupedRoutes = new Map<AdminRoute["group"], AdminRoute[]>();

  for (const route of visibleRoutes) {
    (
      groupedRoutes.get(route.group) ??
      groupedRoutes.set(route.group, []).get(route.group)!
    ).push(route);
  }

  return (
    <aside
      className={cn(
        "w-72 shrink-0 flex-col border-border/60 bg-background/95 shadow-[8px_0_28px_rgba(15,23,42,0.04)] backdrop-blur",
        variant === "desktop"
          ? "sticky hidden lg:flex"
          : "flex h-full max-w-[calc(100vw-2rem)]",
        variant === "desktop" &&
          (hasTopNavbar ? "top-[74px] h-[calc(100vh-74px)]" : "top-0 min-h-screen"),
        isRTL ? "border-l" : "border-r",
      )}
    >
      <nav className="flex-1 overflow-y-auto px-4 py-4">
        {ADMIN_GROUPS.map((group) => {
          const routes = groupedRoutes.get(group.key);
          if (!routes?.length) return null;

          return (
            <div key={group.key} className="mb-3">
              <SectionLabel>{t(group.labelKey)}</SectionLabel>
              <ul className="space-y-1.5">
                {routes.map((route) => (
                  <AdminSidebarItem
                    key={route.key}
                    route={route}
                    pathname={pathname}
                    t={t}
                    isRTL={isRTL}
                    onNavigate={onNavigate}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

    </aside>
  );
}
