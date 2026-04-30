'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import {
  ADMIN_GROUPS,
  getVisibleRoutes,
  type AdminChildRoute,
  type AdminRoute,
} from '@/lib/admin-routes';

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
}: {
  route: AdminRoute;
  pathname: string;
  t: (key: string) => string;
  isRTL: boolean;
}) {
  const Icon = route.icon;
  const isActive = route.exact
    ? pathname === route.path
    : pathname === route.path || pathname.startsWith(route.path + '/');

  return (
    <li>
      <Link
        href={route.path}
        className={cn(
          'group relative flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm transition-all duration-200',
          isActive
            ? 'border-primary/20 bg-primary/[0.08] text-foreground shadow-sm'
            : 'border-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/60 hover:text-foreground',
        )}
      >
        <span
          className={cn(
            'absolute bottom-3 top-3 w-1 rounded-full transition-opacity',
            isActive ? 'bg-primary opacity-100' : 'opacity-0',
            isRTL ? 'right-1.5' : 'left-1.5',
          )}
        />
        {Icon ? (
          <div
            className={cn(
              'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border transition-all duration-200',
              isActive
                ? 'border-primary/20 bg-primary/10 text-primary'
                : 'border-border/60 bg-muted/35 text-muted-foreground group-hover:border-primary/15 group-hover:bg-primary/10 group-hover:text-primary',
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
        <span className={cn('flex-1 truncate', isActive && 'font-semibold')}>
          {t(route.labelKey)}
        </span>
      </Link>

      {route.children && isActive ? (
        <ul className={cn('mt-2 space-y-1', isRTL ? 'mr-12' : 'ml-12')}>
          {route.children.map((child: AdminChildRoute) => {
            const childActive = pathname === child.path;
            return (
              <li key={child.key}>
                <Link
                  href={child.path}
                  className={cn(
                    'block rounded-xl px-3 py-2 text-sm transition-colors',
                    childActive
                      ? 'bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
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

export default function AdminSidebar() {
  const { logout: authLogout, user } = useAuth();
  const pathname = usePathname();
  const { t, isRTL } = useLanguage();
  const hasTopNavbar = pathname === '/admin/dashboard';

  const visibleRoutes = getVisibleRoutes([]);
  const groupedRoutes = new Map<AdminRoute['group'], AdminRoute[]>();

  for (const route of visibleRoutes) {
    (groupedRoutes.get(route.group) ??
      groupedRoutes.set(route.group, []).get(route.group)!).push(route);
  }

  const avatar = user?.fullName?.[0]?.toUpperCase() ?? 'A';
  const roleLabel =
    user?.role === 'MODERATOR'
      ? t('nav.role_moderator')
      : user?.role === 'ADMIN'
        ? t('nav.role_admin')
        : t('nav.role_member');

  return (
    <aside
      className={cn(
        'sticky flex w-72 shrink-0 flex-col border-border/60 bg-background/95 shadow-[8px_0_28px_rgba(15,23,42,0.04)] backdrop-blur',
        hasTopNavbar ? 'top-[74px] h-[calc(100vh-74px)]' : 'top-0 min-h-screen',
        isRTL ? 'border-l' : 'border-r',
      )}
    >
      <div className="border-b border-border/60 px-5 pb-5 pt-5">
        <div className="rounded-[1.75rem] border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="ReadyRoad"
              width={42}
              height={42}
              className="rounded-2xl ring-1 ring-border/50"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/80">
                {t('admin.sidebar.panel_title')}
              </p>
              <p className="text-lg font-black tracking-tight text-foreground">
                {t('admin.sidebar.workspace_title')}
              </p>
              <p className="text-xs font-medium leading-5 text-muted-foreground">
                {t('admin.sidebar.workspace_subtitle')}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-[1.35rem] border border-border/60 bg-muted/30 p-3.5">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-sm font-black text-primary">
              {avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">
                {user?.fullName || t('admin.system_admin')}
              </p>
              <div className="mt-1 inline-flex rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                {roleLabel}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email || t('admin.sidebar.panel_title')}
              </p>
            </div>
          </div>
        </div>
      </div>

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
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border/60 px-4 py-4">
        <div className="space-y-1.5">
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm text-muted-foreground transition-all duration-200 hover:border-border/70 hover:bg-muted/70 hover:text-foreground"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-muted/35 text-muted-foreground transition-all duration-200 group-hover:border-primary/15 group-hover:bg-primary/10 group-hover:text-primary">
              <Home className="h-4 w-4" />
            </div>
            <span className="flex-1 truncate font-medium">
              {t('admin.sidebar.back_to_site')}
            </span>
          </Link>

          <button
            onClick={() => authLogout()}
            className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm text-red-600/85 transition-all duration-200 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/25"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border border-red-200/60 bg-red-50 text-red-500 transition-colors group-hover:border-red-300 group-hover:bg-red-100">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="flex-1 text-start font-semibold">{t('auth.logout')}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
