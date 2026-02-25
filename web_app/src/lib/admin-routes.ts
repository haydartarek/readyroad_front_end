/**
 * Admin Route Registry — Single Source of Truth
 *
 * All admin routes, labels, icons, groups, and feature flags
 * are defined here. The AdminSidebar, AdminBreadcrumb, and
 * any route-aware component MUST consume this registry.
 *
 * @author ReadyRoad Team
 * @since 2026-02-17
 */

import {
    LayoutDashboard,
    TriangleAlert,
    HelpCircle,
    Upload,
    Users,
    Shield,
    BarChart3,
    Settings,
    type LucideIcon,
} from 'lucide-react';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type AdminGroupKey =
    | 'overview'
    | 'content'
    | 'data'
    | 'users'
    | 'trust'
    | 'insights'
    | 'system';

export interface AdminGroup {
    key: AdminGroupKey;
    labelKey: string;
    order: number;
}

export interface AdminRoute {
    key: string;
    path: string;
    labelKey: string;
    icon?: LucideIcon;
    group: AdminGroupKey;
    /** If true, route is hidden from sidebar (scaffold / future) */
    hidden?: boolean;
    /** Feature flag key — route only visible when flag is enabled */
    featureFlag?: string;
    /** Child routes shown as sub-menu */
    children?: AdminChildRoute[];
    /** If true, path match must be exact (e.g. dashboard) */
    exact?: boolean;
}

export interface AdminChildRoute {
    key: string;
    path: string;
    labelKey: string;
}

export interface BreadcrumbSegment {
    label: string;
    href: string;
    isCurrentPage?: boolean;
}

// ──────────────────────────────────────────────
// Groups (ordered)
// ──────────────────────────────────────────────

export const ADMIN_GROUPS: AdminGroup[] = [
    { key: 'overview', labelKey: 'admin.group.overview', order: 0 },
    { key: 'content', labelKey: 'admin.group.content', order: 1 },
    { key: 'data', labelKey: 'admin.group.data', order: 2 },
    { key: 'users', labelKey: 'admin.group.users', order: 3 },
    { key: 'trust', labelKey: 'admin.group.trust', order: 4 },
    { key: 'insights', labelKey: 'admin.group.insights', order: 5 },
    { key: 'system', labelKey: 'admin.group.system', order: 6 },
];

// ──────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────

export const ADMIN_ROUTES: AdminRoute[] = [
    // ── Overview ──
    {
        key: 'dashboard',
        path: '/admin/dashboard',
        labelKey: 'admin.sidebar.dashboard',
        icon: LayoutDashboard,
        group: 'overview',
        exact: true,
    },

    // ── Content ──
    {
        key: 'signs',
        path: '/admin/signs',
        labelKey: 'admin.sidebar.signs',
        icon: TriangleAlert,
        group: 'content',
        children: [
            { key: 'signs_all', path: '/admin/signs', labelKey: 'admin.sidebar.signs_all' },
            { key: 'signs_new', path: '/admin/signs/new', labelKey: 'admin.sidebar.signs_add' },
        ],
    },
    {
        key: 'quizzes',
        path: '/admin/quizzes',
        labelKey: 'admin.sidebar.quizzes',
        icon: HelpCircle,
        group: 'content',
        children: [
            { key: 'quizzes_all', path: '/admin/quizzes', labelKey: 'admin.sidebar.quizzes_all' },
            { key: 'quizzes_new', path: '/admin/quizzes/new', labelKey: 'admin.sidebar.quizzes_add' },
        ],
    },

    // ── Data ──
    {
        key: 'data-import',
        path: '/admin/data-import',
        labelKey: 'admin.sidebar.data_import',
        icon: Upload,
        group: 'data',
    },

    // ── Users ──
    {
        key: 'users',
        path: '/admin/users',
        labelKey: 'admin.sidebar.users',
        icon: Users,
        group: 'users',
    },

    // ── Trust ──
    {
        key: 'moderation',
        path: '/admin/moderation',
        labelKey: 'admin.sidebar.moderation',
        icon: Shield,
        group: 'trust',
    },

    // ── Insights ──
    {
        key: 'analytics',
        path: '/admin/analytics',
        labelKey: 'admin.sidebar.analytics',
        icon: BarChart3,
        group: 'insights',
    },

    // ── System ──
    {
        key: 'settings',
        path: '/admin/settings',
        labelKey: 'admin.sidebar.settings',
        icon: Settings,
        group: 'system',
    },
];

// ──────────────────────────────────────────────
// Legacy Redirects
// ──────────────────────────────────────────────

export const LEGACY_REDIRECTS: Record<string, string> = {
    '/admin/signs/add': '/admin/signs/new',
    '/admin/quizzes/add': '/admin/quizzes/new',
};

// ──────────────────────────────────────────────
// Breadcrumb segment labels (path segment → i18n key)
// ──────────────────────────────────────────────

const SEGMENT_LABEL_KEYS: Record<string, string> = {
    admin: 'admin.sidebar.panel_title',
    dashboard: 'admin.sidebar.dashboard',
    signs: 'admin.sidebar.signs',
    quizzes: 'admin.sidebar.quizzes',
    users: 'admin.sidebar.users',
    analytics: 'admin.sidebar.analytics',
    settings: 'admin.sidebar.settings',
    moderation: 'admin.sidebar.moderation',
    'data-import': 'admin.sidebar.data_import',
    new: 'admin.breadcrumb.new',
    edit: 'admin.breadcrumb.edit',
};

// ──────────────────────────────────────────────
// Helper functions
// ──────────────────────────────────────────────

/** Get a top-level route by its key */
export function getRouteByKey(key: string): AdminRoute | undefined {
    return ADMIN_ROUTES.find((r) => r.key === key);
}

/** Get a top-level route whose path matches (prefix match for non-exact) */
export function getRouteByPath(path: string): AdminRoute | undefined {
    // Try exact match first
    const exact = ADMIN_ROUTES.find((r) => r.path === path);
    if (exact) return exact;

    // Try prefix match (longest first)
    const sorted = [...ADMIN_ROUTES].sort(
        (a, b) => b.path.length - a.path.length
    );
    return sorted.find((r) => path.startsWith(r.path + '/') || path === r.path);
}

/** Get all routes belonging to a group */
export function getRoutesByGroup(group: AdminGroupKey): AdminRoute[] {
    return ADMIN_ROUTES.filter((r) => r.group === group);
}

/**
 * Get only visible routes (filters out hidden and feature-flagged).
 * Pass `enabledFlags` for feature flags that are currently enabled.
 */
export function getVisibleRoutes(
    enabledFlags: string[] = []
): AdminRoute[] {
    return ADMIN_ROUTES.filter((r) => {
        if (r.hidden && r.featureFlag && !enabledFlags.includes(r.featureFlag)) {
            return false;
        }
        if (r.hidden && !r.featureFlag) {
            return false;
        }
        return true;
    });
}

/** Check if a path is an admin path */
export function isAdminPath(path: string): boolean {
    return path.startsWith('/admin');
}

/**
 * Build a breadcrumb trail for the given pathname.
 * Uses the `t` function to resolve i18n keys to display labels.
 */
export function getBreadcrumbTrail(
    pathname: string,
    t: (key: string) => string
): BreadcrumbSegment[] {
    if (!isAdminPath(pathname)) return [];

    const segments = pathname.split('/').filter(Boolean); // ['admin', 'signs', '3', 'edit']
    const trail: BreadcrumbSegment[] = [];

    // First breadcrumb is always Dashboard
    trail.push({
        label: t('admin.sidebar.dashboard'),
        href: '/admin/dashboard',
    });

    // Skip 'admin' segment (index 0), iterate rest
    let currentPath = '/admin';
    for (let i = 1; i < segments.length; i++) {
        const seg = segments[i];
        currentPath += `/${seg}`;
        const isLast = i === segments.length - 1;

        let label: string;
        const labelKey = SEGMENT_LABEL_KEYS[seg];

        if (labelKey) {
            label = t(labelKey);
        } else if (/^\d+$/.test(seg)) {
            // Numeric ID — show as #ID
            label = `#${seg}`;
        } else {
            // Humanize: 'data-import' → 'Data Import'
            label = seg
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
        }

        trail.push({
            label,
            href: currentPath,
            isCurrentPage: isLast,
        });
    }

    return trail;
}
