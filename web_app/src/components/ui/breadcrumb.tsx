'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronLeft, MoreHorizontal } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage: boolean;
}

// ─── Constants ───────────────────────────────────────────

const BREADCRUMB_ENABLED_ROUTES = [
  '/analytics',
  '/practice',
  '/lessons',
  '/traffic-signs',
  '/exam',
  '/progress',
] as const;

const SEGMENT_LABELS: Record<string, string> = {
  'analytics':      'nav.analytics',
  'practice':       'nav.practice',
  'lessons':        'nav.lessons',
  'traffic-signs':  'nav.traffic_signs',
  'exam':           'nav.exam',
  'progress':       'nav.progress',
  'dashboard':      'nav.dashboard',
  'profile':        'nav.profile',
  'results':        'exam.results',
  'error-patterns': 'analytics.error_patterns',
  'weak-areas':     'analytics.weak_areas',
};

const SIGN_CODE_RE  = /^[A-Z][0-9]/i;
const NUMERIC_RE    = /^[0-9]+$/;

// ─── Helpers ─────────────────────────────────────────────

function resolveSegmentLabel(segment: string, t: (key: string) => string): string {
  const key = SEGMENT_LABELS[segment];
  if (key)                         return t(key);
  if (NUMERIC_RE.test(segment))    return `#${segment}`;
  if (SIGN_CODE_RE.test(segment))  return segment.toUpperCase();

  return segment
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function buildBreadcrumbs(
  pathname: string,
  t: (key: string) => string,
): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);

  const items: BreadcrumbItem[] = [
    { label: t('nav.dashboard'), href: '/dashboard', isCurrentPage: pathname === '/dashboard' },
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    items.push({
      label:         resolveSegmentLabel(segment, t),
      href:          currentPath,
      isCurrentPage: index === segments.length - 1,
    });
  });

  return items;
}

// ─── Sub-components ──────────────────────────────────────

function Separator({ isRTL }: { isRTL: boolean }) {
  return (
    <span className="mx-2 flex-shrink-0 text-muted-foreground" aria-hidden="true">
      {isRTL
        ? <ChevronLeft  className="h-4 w-4" />
        : <ChevronRight className="h-4 w-4" />}
    </span>
  );
}

function BreadcrumbLink({ item }: { item: BreadcrumbItem }) {
  if (item.isCurrentPage) {
    return (
      <span
        className="max-w-[200px] truncate font-medium text-foreground"
        aria-current="page"
      >
        {item.label}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className="max-w-[150px] truncate text-muted-foreground transition-colors hover:text-primary hover:underline"
    >
      {item.label}
    </Link>
  );
}

// ─── Main Component ──────────────────────────────────────

export function Breadcrumb() {
  const pathname                            = usePathname();
  const { t, isRTL }                        = useLanguage();
  const containerRef                        = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed]       = useState(false);
  const [showDropdown, setShowDropdown]     = useState(false);

  const isEnabled = useMemo(
    () => BREADCRUMB_ENABLED_ROUTES.some(route => pathname.startsWith(route)),
    [pathname],
  );

  const items = useMemo(
    () => isEnabled ? buildBreadcrumbs(pathname, t) : [],
    [pathname, isEnabled, t],
  );

  const checkOverflow = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setIsCollapsed(el.scrollWidth > el.clientWidth && items.length > 3);
  }, [items.length]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [checkOverflow]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  if (!isEnabled || items.length <= 1) return null;

  const firstItem  = items[0];
  const lastItem   = items[items.length - 1];
  const middleItems = items.slice(1, -1);

  return (
    <nav aria-label="Breadcrumb" className="mb-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div
        ref={containerRef}
        className="flex flex-wrap items-center overflow-hidden text-sm text-muted-foreground"
      >
        {isCollapsed ? (
          <>
            <BreadcrumbLink item={firstItem} />
            <Separator isRTL={isRTL} />

            {/* Collapsed middle items */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(prev => !prev)}
                className="flex items-center rounded px-2 py-1 text-muted-foreground hover:bg-muted"
                aria-label="Show more breadcrumbs"
                aria-expanded={showDropdown}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {showDropdown && (
                <div
                  className={cn(
                    'absolute top-full z-50 mt-1 min-w-[150px] rounded-md border border-border bg-popover py-1 shadow-lg',
                    isRTL ? 'right-0' : 'left-0',
                  )}
                >
                  {middleItems.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                      onClick={() => setShowDropdown(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Separator isRTL={isRTL} />
            <BreadcrumbLink item={lastItem} />
          </>
        ) : (
          items.map((item, index) => (
            <span key={item.href} className="flex items-center">
              {index > 0 && <Separator isRTL={isRTL} />}
              <BreadcrumbLink item={item} />
            </span>
          ))
        )}
      </div>
    </nav>
  );
}

export default Breadcrumb;
