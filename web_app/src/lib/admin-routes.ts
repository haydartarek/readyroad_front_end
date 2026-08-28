/**
 * Admin Route Registry — Single Source of Truth
 *
 * All admin routes, labels, icons, groups, and feature flags are defined here.
 * AdminSidebar, AdminBreadcrumb, and any route-aware component MUST consume
 * this registry.
 */

import {
  Gauge,
  TrafficCone,
  ClipboardList,
  FolderUp,
  Users,
  ShieldCheck,
  BarChart2,
  Settings2,
  Bot,
  type LucideIcon,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────

export type AdminGroupKey =
  | "overview"
  | "content"
  | "data"
  | "users"
  | "trust"
  | "insights"
  | "system";

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
  /** Route is hidden from sidebar (scaffold / future) */
  hidden?: boolean;
  /** Route only visible when this feature flag is enabled */
  featureFlag?: string;
  /** Child routes shown as sub-menu */
  children?: AdminChildRoute[];
  /** Path match must be exact (e.g. dashboard) */
  exact?: boolean;
}

export interface AdminChildRoute {
  key: string;
  path: string;
  labelKey: string;
}

export interface BreadcrumbSegment {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

// ─── Groups ──────────────────────────────────────────────

export const ADMIN_GROUPS: AdminGroup[] = [
  { key: "overview", labelKey: "admin.group.overview", order: 0 },
  { key: "content", labelKey: "admin.group.content", order: 1 },
  { key: "data", labelKey: "admin.group.data", order: 2 },
  { key: "users", labelKey: "admin.group.users", order: 3 },
  { key: "trust", labelKey: "admin.group.trust", order: 4 },
  { key: "insights", labelKey: "admin.group.insights", order: 5 },
  { key: "system", labelKey: "admin.group.system", order: 6 },
];

// ─── Routes ──────────────────────────────────────────────

export const ADMIN_ROUTES: AdminRoute[] = [
  // ── Overview ──
  {
    key: "dashboard",
    path: "/admin/dashboard",
    labelKey: "admin.sidebar.dashboard",
    icon: Gauge,
    group: "overview",
    exact: true,
  },

  // ── Content ──
  {
    key: "signs",
    path: "/admin/signs",
    labelKey: "admin.sidebar.signs",
    icon: TrafficCone,
    group: "content",
    children: [
      {
        key: "signs_all",
        path: "/admin/signs",
        labelKey: "admin.sidebar.signs_all",
      },
    ],
  },
  {
    key: "quizzes",
    path: "/admin/quizzes",
    labelKey: "admin.sidebar.quizzes",
    icon: ClipboardList,
    group: "content",
    children: [
      {
        key: "quizzes_all",
        path: "/admin/quizzes",
        labelKey: "admin.sidebar.quizzes_all",
      },
      {
        key: "quizzes_categories",
        path: "/admin/quizzes/categories",
        labelKey: "admin.quizzes.health.category_management_title",
      },
      {
        key: "quizzes_new",
        path: "/admin/quizzes/new",
        labelKey: "admin.sidebar.quizzes_add",
      },
    ],
  },

  // ── Data ──
  {
    key: "data-import",
    path: "/admin/data-import",
    labelKey: "admin.sidebar.data_import",
    icon: FolderUp,
    group: "data",
  },

  // ── Users ──
  {
    key: "users",
    path: "/admin/users",
    labelKey: "admin.sidebar.users",
    icon: Users,
    group: "users",
  },

  // ── Trust ──
  {
    key: "moderation",
    path: "/admin/moderation",
    labelKey: "admin.sidebar.moderation",
    icon: ShieldCheck,
    group: "trust",
  },

  // ── Insights ──
  {
    key: "marketing",
    path: "/admin/marketing",
    labelKey: "admin.sidebar.marketing",
    icon: Bot,
    group: "insights",
  },
  {
    key: "analytics",
    path: "/admin/analytics",
    labelKey: "admin.sidebar.analytics",
    icon: BarChart2,
    group: "insights",
  },

  // ── System ──
  {
    key: "settings",
    path: "/admin/settings",
    labelKey: "admin.sidebar.settings",
    icon: Settings2,
    group: "system",
  },
];

// ─── Segment Labels ──────────────────────────────────────

const SEGMENT_LABEL_KEYS: Record<string, string> = {
  admin: "admin.sidebar.panel_title",
  dashboard: "admin.sidebar.dashboard",
  signs: "admin.sidebar.signs",
  quizzes: "admin.sidebar.quizzes",
  categories: "admin.quizzes.health.category_management_title",
  users: "admin.sidebar.users",
  analytics: "admin.sidebar.analytics",
  marketing: "admin.sidebar.marketing",
  settings: "admin.sidebar.settings",
  moderation: "admin.sidebar.moderation",
  "data-import": "admin.sidebar.data_import",
  new: "admin.breadcrumb.new",
  edit: "admin.breadcrumb.edit",
  learning: "admin.learning.profile_title",
  exams: "admin.learning.section.exams",
};

const NUMERIC_SEGMENT_RE = /^\d+$/;

// ─── Helpers ─────────────────────────────────────────────

/**
 * Get only visible routes (filters out hidden and disabled feature-flagged routes).
 * Pass `enabledFlags` for feature flags that are currently active.
 */
export function getVisibleRoutes(enabledFlags: string[] = []): AdminRoute[] {
  return ADMIN_ROUTES.filter((r) => {
    if (!r.hidden) return true;
    return r.featureFlag ? enabledFlags.includes(r.featureFlag) : false;
  });
}

/** Check if a path is under the /admin prefix */
export function isAdminPath(path: string): boolean {
  return path.startsWith("/admin");
}

/**
 * Build a breadcrumb trail for the given pathname.
 * Uses `t` to resolve i18n keys to display labels.
 */
export function getBreadcrumbTrail(
  pathname: string,
  t: (key: string) => string,
): BreadcrumbSegment[] {
  if (!isAdminPath(pathname)) return [];

  const segments = pathname.split("/").filter(Boolean);
  const trail: BreadcrumbSegment[] = [
    { label: t("admin.sidebar.dashboard"), href: "/admin/dashboard" },
  ];

  let currentPath = "/admin";
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    currentPath += `/${seg}`;

    if (NUMERIC_SEGMENT_RE.test(seg)) {
      continue;
    }

    const labelKey = SEGMENT_LABEL_KEYS[seg];
    const label = labelKey
      ? t(labelKey)
      : seg
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

    trail.push({
      label,
      href: currentPath,
      isCurrentPage: i === segments.length - 1,
    });
  }

  return trail;
}
