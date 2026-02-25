'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Home, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/language-context';
import {
    ADMIN_GROUPS,
    ADMIN_ROUTES,
    getVisibleRoutes,
    type AdminRoute,
    type AdminChildRoute,
    type AdminGroupKey,
} from '@/lib/admin-routes';

/**
 * Admin Sidebar Component — Grouped Navigation
 *
 * Reads routes from the admin-routes registry (single source of truth).
 * Groups are collapsible. Lucide icons. RTL-aware.
 *
 * @author ReadyRoad Team
 * @since 2026-02-17
 */
export default function AdminSidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const { t, isRTL } = useLanguage();

    // Collapsed groups — store which groups are manually collapsed
    const [collapsedGroups, setCollapsedGroups] = useState<Set<AdminGroupKey>>(new Set());

    const toggleGroup = (groupKey: AdminGroupKey) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupKey)) {
                next.delete(groupKey);
            } else {
                next.add(groupKey);
            }
            return next;
        });
    };

    // Get visible routes (feature flags — none enabled for now)
    const visibleRoutes = getVisibleRoutes([]);

    // Build grouped routes map
    const groupedRoutes = new Map<AdminGroupKey, AdminRoute[]>();
    for (const route of visibleRoutes) {
        const existing = groupedRoutes.get(route.group) || [];
        existing.push(route);
        groupedRoutes.set(route.group, existing);
    }

    return (
        <aside
            className={`w-64 bg-card min-h-screen sticky top-0 shadow-sm flex flex-col ${isRTL ? 'border-l border-border' : 'border-r border-border'
                }`}
        >
            {/* Logo & Brand */}
            <div className="p-6 border-b border-border">
                <Link href="/admin/dashboard" className="flex items-center gap-3">
                    <div className="text-3xl">🚗</div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">ReadyRoad</h2>
                        <p className="text-xs text-muted-foreground">{t('admin.sidebar.panel_title')}</p>
                    </div>
                </Link>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-border bg-muted">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        {user?.fullName?.[0] || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                            {user?.fullName || t('admin.system_admin')}
                        </p>
                        <p className="text-xs text-muted-foreground">{user?.role}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Menu — Grouped */}
            <nav className="flex-1 overflow-y-auto p-4">
                {ADMIN_GROUPS.map((group) => {
                    const routes = groupedRoutes.get(group.key);
                    if (!routes || routes.length === 0) return null;

                    const isCollapsed = collapsedGroups.has(group.key);

                    return (
                        <div key={group.key} className="mb-4">
                            {/* Group Header */}
                            <button
                                onClick={() => toggleGroup(group.key)}
                                className="w-full flex items-center justify-between px-2 py-1.5 mb-1"
                            >
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    {t(group.labelKey)}
                                </span>
                                <ChevronDown
                                    className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isCollapsed ? (isRTL ? 'rotate-90' : '-rotate-90') : ''
                                        }`}
                                />
                            </button>

                            {/* Group Items */}
                            {!isCollapsed && (
                                <ul className="space-y-1">
                                    {routes.map((route) => (
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

            {/* Bottom Actions */}
            <div className="p-4 border-t border-border bg-card">
                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                    <Home className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('admin.sidebar.back_to_site')}</span>
                </Link>
                <button
                    onClick={() => {
                        window.location.href = '/auth/logout';
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2"
                >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('auth.logout')}</span>
                </button>
            </div>
        </aside>
    );
}

/**
 * Individual Sidebar Menu Item
 */
function SidebarItem({
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

    // Active check: exact for dashboard, prefix for others
    const isActive = route.exact
        ? pathname === route.path
        : pathname === route.path || pathname.startsWith(route.path + '/');

    // Expand children only when parent is active
    const showChildren = route.children && isActive;

    return (
        <li>
            <Link
                href={route.path}
                className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm
                    ${isActive
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-foreground hover:bg-muted'
                    }
                `}
            >
                {Icon && <Icon className="h-[18px] w-[18px] flex-shrink-0" />}
                <span>{t(route.labelKey)}</span>
            </Link>

            {/* Child submenu */}
            {showChildren && (
                <ul className={`mt-1 space-y-0.5 ${isRTL ? 'mr-9' : 'ml-9'}`}>
                    {route.children!.map((child: AdminChildRoute) => (
                        <li key={child.key}>
                            <Link
                                href={child.path}
                                className={`
                                    block px-3 py-1.5 text-sm rounded-md transition-colors
                                    ${pathname === child.path
                                        ? 'text-blue-600 font-medium bg-blue-50/50'
                                        : 'text-muted-foreground hover:bg-muted'
                                    }
                                `}
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
