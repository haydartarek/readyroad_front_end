'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronLeft, Home, MoreHorizontal } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { GROUP_INFO, type LangKey } from '@/lib/sign-category-data';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage: boolean;
}

interface BreadcrumbProps {
  items?: Array<{
    label: string;
    href?: string;
    isCurrentPage?: boolean;
  }>;
}

// ─── Constants ───────────────────────────────────────────

const BREADCRUMB_ENABLED_ROUTES = [
  '/analytics',
  '/practice',
  '/lessons',
  '/traffic-signs',
  '/exam',
] as const;

const SEGMENT_LABELS: Record<string, string> = {
  'analytics':      'nav.analytics',
  'practice':       'nav.practice',
  'random':         'practice.random',
  'lessons':        'nav.lessons',
  'traffic-signs':  'nav.traffic_signs',
  'exam':           'nav.exam',
  'dashboard':      'nav.dashboard',
  'profile':        'nav.profile',
  'results':        'exam.results',
  'error-patterns': 'analytics.error_patterns',
  'weak-areas':     'analytics.weak_areas',
};

const SIGN_CODE_RE  = /^[A-Z][0-9]/i;
const NUMERIC_RE    = /^[0-9]+$/;
const LESSON_CODE_RE = /^les-(\d+)$/i;

// ─── Helpers ─────────────────────────────────────────────

function resolveSegmentLabel(
  segment: string,
  t: (key: string) => string,
  language: LangKey,
  previousSegment?: string,
): string {
  const key = SEGMENT_LABELS[segment];
  const upperSegment = segment.toUpperCase();

  if (previousSegment === 'practice' && GROUP_INFO[upperSegment]) {
    return GROUP_INFO[upperSegment].title[language];
  }
  if (key)                          return t(key);
  if (NUMERIC_RE.test(segment))     return `#${segment}`;
  if (SIGN_CODE_RE.test(segment))   return segment.toUpperCase();

  const lessonMatch = LESSON_CODE_RE.exec(segment);
  if (lessonMatch)                  return `${t('lessons.lesson')} ${parseInt(lessonMatch[1], 10) + 1}`;

  return segment
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function buildBreadcrumbs(
  pathname: string,
  t: (key: string) => string,
  language: LangKey,
): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const isPublicReferenceRoute =
    pathname.startsWith('/traffic-signs') || pathname.startsWith('/lessons');

  const items: BreadcrumbItem[] = [
    {
      label: t(isPublicReferenceRoute ? 'nav.home' : 'nav.dashboard'),
      href: isPublicReferenceRoute ? '/' : '/dashboard',
      isCurrentPage: pathname === (isPublicReferenceRoute ? '/' : '/dashboard'),
    },
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    items.push({
      label:         resolveSegmentLabel(segment, t, language, segments[index - 1]),
      href:          currentPath,
      isCurrentPage: index === segments.length - 1,
    });
  });

  return items;
}

// ─── Sub-components ──────────────────────────────────────

function Separator({ isRTL }: { isRTL: boolean }) {
  return (
    <span className="mx-0.5 flex-shrink-0 text-muted-foreground/40" aria-hidden="true">
      {isRTL
        ? <ChevronLeft className="h-3 w-3" />
        : <ChevronRight className="h-3 w-3" />}
    </span>
  );
}

function BreadcrumbLink({
  item,
  isFirst,
}: {
  item: BreadcrumbItem;
  isFirst?: boolean;
}) {
  if (item.isCurrentPage) {
    return (
      <span
        className="inline-flex max-w-[200px] items-center gap-1.5 rounded-xl bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary"
        aria-current="page"
      >
        {item.label}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'inline-flex items-center rounded-xl px-2 py-1 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground',
        isFirst && 'gap-1.5',
      )}
    >
      {isFirst ? <Home className="h-3.5 w-3.5 flex-shrink-0" /> : null}
      {item.label}
    </Link>
  );
}

// ─── Main Component ──────────────────────────────────────

export function Breadcrumb({ items: customItems }: BreadcrumbProps = {}) {
  const pathname                            = usePathname();
  const { t, isRTL, language }              = useLanguage();
  const containerRef                        = useRef<HTMLOListElement>(null);
  const [isCollapsed, setIsCollapsed]       = useState(false);
  const [showDropdown, setShowDropdown]     = useState(false);

  const isEnabled = useMemo(
    () => BREADCRUMB_ENABLED_ROUTES.some(route => pathname.startsWith(route)),
    [pathname],
  );

  const items = useMemo(() => {
    if (customItems?.length) {
      return customItems.map((item, index) => ({
        label: item.label,
        href: item.href ?? "#",
        isCurrentPage:
          item.isCurrentPage ?? index === customItems.length - 1,
      }));
    }

    return isEnabled ? buildBreadcrumbs(pathname, t, language as LangKey) : [];
  }, [customItems, pathname, isEnabled, language, t]);

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

  if ((!customItems?.length && !isEnabled) || items.length <= 1) return null;

  const firstItem  = items[0];
  const lastItem   = items[items.length - 1];
  const middleItems = items.slice(1, -1);

  return (
    <nav aria-label={t('common.breadcrumb')} className="mb-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <ol
        ref={containerRef}
        className="inline-flex max-w-full flex-wrap items-center gap-1 overflow-hidden rounded-2xl border border-border/50 bg-card px-4 py-2 shadow-sm"
      >
        {isCollapsed ? (
          <>
            <li className="flex items-center gap-1">
              <BreadcrumbLink item={firstItem} isFirst />
            </li>
            <Separator isRTL={isRTL} />

            <li className="relative flex items-center gap-1">
              <button
                onClick={() => setShowDropdown(prev => !prev)}
                className="inline-flex items-center rounded-xl px-2 py-1 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                aria-label={t('common.show_more_breadcrumbs')}
                aria-expanded={showDropdown}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {showDropdown && (
                <div
                  className={cn(
                    'absolute top-full z-50 mt-2 min-w-[180px] rounded-2xl border border-border/60 bg-popover p-1 shadow-lg',
                    isRTL ? 'right-0' : 'left-0',
                  )}
                >
                  {middleItems.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                      onClick={() => setShowDropdown(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </li>

            <Separator isRTL={isRTL} />
            <li className="flex items-center gap-1">
              <BreadcrumbLink item={lastItem} />
            </li>
          </>
        ) : (
          items.map((item, index) => (
            <li key={item.href} className="flex items-center gap-1">
              {index > 0 && <Separator isRTL={isRTL} />}
              <BreadcrumbLink item={item} isFirst={index === 0} />
            </li>
          ))
        )}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
