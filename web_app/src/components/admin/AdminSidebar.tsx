'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Home, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import {
  ADMIN_GROUPS,
  getVisibleRoutes,
  type AdminRoute,
  type AdminChildRoute,
  type AdminGroupKey,
} from '@/lib/admin-routes';

// ─── Sidebar ─────────────────────────────────────────────

export default function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();

  const [collapsedGroups, setCollapsedGroups] = useState<Set<AdminGroupKey>>(new Set());

  const toggleGroup = (key: AdminGroupKey) =>
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });

  // Build grouped routes map
  const visibleRoutes = getVisibleRoutes([]);
  const groupedRoutes = new Map<AdminGroupKey, AdminRoute[]>();
  for (const route of visibleRoutes) {
    (groupedRoutes.get(route.group) ?? groupedRoutes.set(route.group, []).get(route.group)!).push(route);
  }

  const avatar = user?.fullName?.[0]?.toUpperCase() ?? 'A';

  return (
    <aside className={cn(
      'w-64 bg-card min-h-screen sticky top-0 shadow-sm flex flex-col',
      isRTL ? 'border-l border-border' : 'border-r border-border',
    )}>

      {/* Brand */}
      <div className="p-6 border-b border-border">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <span className="text-3xl">🚗</span>
          <div>
            <h2 className="text-xl font-black text-foreground">ReadyRoad</h2>
            <p className="text-xs text-muted-foreground">{t('admin.sidebar.panel_title')}</p>
          </div>
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-border bg-muted/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-sm flex-shrink-0">
            {avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {user?.fullName || t('admin.system_admin')}
            </p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-4">
        {ADMIN_GROUPS.map(group => {
          const routes = groupedRoutes.get(group.key);
          if (!routes?.length) return null;

          const isCollapsed = collapsedGroups.has(group.key);

          return (
            <div key={group.key}>
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center justify-between px-2 py-1.5 mb-1 rounded-md hover:bg-muted/50 transition-colors"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t(group.labelKey)}
                </span>
                <ChevronDown className={cn(
                  'h-3 w-3 text-muted-foreground transition-transform duration-200',
                  isCollapsed && (isRTL ? 'rotate-90' : '-rotate-90'),
                )} />
              </button>

              {!isCollapsed && (
                <ul className="space-y-0.5">
                  {routes.map(route => (
                    <SidebarItem
                      key={route.key}
                      route={route}
                      pathname={pathname}
                      t={t}
                      isRTL={isRTL}
                    />
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-4 border-t border-border space-y-1">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <Home className="h-4 w-4 flex-shrink-0" />
          {t('admin.sidebar.back_to_site')}
        </Link>
        <button
          onClick={() => router.push('/auth/logout')}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {t('auth.logout')}
        </button>
      </div>
    </aside>
  );
}

// ─── Group accent colours ────────────────────────────────

const GROUP_ACCENT: Record<string, { bg: string; text: string; activeBg: string }> = {
  overview: { bg: 'bg-primary/10',    text: 'text-primary',        activeBg: 'bg-primary/15'    },
  content:  { bg: 'bg-blue-500/10',   text: 'text-blue-600',       activeBg: 'bg-blue-500/15'   },
  data:     { bg: 'bg-purple-500/10', text: 'text-purple-600',     activeBg: 'bg-purple-500/15' },
  users:    { bg: 'bg-green-500/10',  text: 'text-green-600',      activeBg: 'bg-green-500/15'  },
  trust:    { bg: 'bg-amber-500/10',  text: 'text-amber-600',      activeBg: 'bg-amber-500/15'  },
  insights: { bg: 'bg-violet-500/10', text: 'text-violet-600',     activeBg: 'bg-violet-500/15' },
  system:   { bg: 'bg-muted',         text: 'text-muted-foreground', activeBg: 'bg-muted'       },
};

// ─── SidebarItem ─────────────────────────────────────────

function SidebarItem({
  route, pathname, t, isRTL,
}: {
  route: AdminRoute;
  pathname: string;
  t: (key: string) => string;
  isRTL: boolean;
}) {
  const Icon = route.icon;
  const accent = GROUP_ACCENT[route.group] ?? GROUP_ACCENT.system;

  const isActive = route.exact
    ? pathname === route.path
    : pathname === route.path || pathname.startsWith(route.path + '/');

  return (
    <li>
      <Link
        href={route.path}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm group',
          isActive
            ? `${accent.activeBg} ${accent.text} font-semibold`
            : 'text-foreground hover:bg-muted/80',
        )}
      >
        {Icon && (
          <div className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
            isActive
              ? `${accent.bg} ${accent.text}`
              : `bg-muted/60 text-muted-foreground group-hover:${accent.bg} group-hover:${accent.text}`,
          )}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <span className="flex-1 truncate">{t(route.labelKey)}</span>
      </Link>

      {/* Children — only when parent active */}
      {route.children && isActive && (
        <ul className={cn('mt-1 space-y-0.5', isRTL ? 'mr-11' : 'ml-11')}>
          {route.children.map((child: AdminChildRoute) => (
            <li key={child.key}>
              <Link
                href={child.path}
                className={cn(
                  'block px-3 py-1.5 text-sm rounded-lg transition-colors',
                  pathname === child.path
                    ? `${accent.text} font-semibold bg-muted/60`
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {t(child.labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
