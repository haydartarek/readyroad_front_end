'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronLeft, MoreHorizontal } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage: boolean;
}

// Routes that support breadcrumbs
const BREADCRUMB_ENABLED_ROUTES = [
  '/analytics',
  '/practice',
  '/lessons',
  '/traffic-signs',
  '/exam',
  '/progress',
];

// Segment to translation key mapping
const SEGMENT_TRANSLATION_KEYS: Record<string, string> = {
  'analytics': 'nav.analytics',
  'practice': 'nav.practice',
  'lessons': 'nav.lessons',
  'traffic-signs': 'nav.traffic_signs',
  'exam': 'nav.exam',
  'progress': 'nav.progress',
  'dashboard': 'nav.dashboard',
  'profile': 'nav.profile',
  'results': 'exam.results',
  'error-patterns': 'analytics.error_patterns',
  'weak-areas': 'analytics.weak_areas',
};

export function Breadcrumb() {
  const pathname = usePathname();
  const { t, isRTL } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCollapsedMenu, setShowCollapsedMenu] = useState(false);

  // Check if breadcrumbs should be shown for this route
  const shouldShowBreadcrumbs = useMemo(() => {
    return BREADCRUMB_ENABLED_ROUTES.some(route => pathname.startsWith(route));
  }, [pathname]);

  // Generate breadcrumb items from pathname
  const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
    if (!shouldShowBreadcrumbs) return [];

    const segments = pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    // Add home/dashboard as first item
    items.push({
      label: t('nav.dashboard'),
      href: '/dashboard',
      isCurrentPage: pathname === '/dashboard',
    });

    // Build breadcrumb for each segment
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLastSegment = index === segments.length - 1;

      // Get label for segment
      let label: string;
      const translationKey = SEGMENT_TRANSLATION_KEYS[segment];

      if (translationKey) {
        label = t(translationKey);
      } else if (segment.match(/^[0-9]+$/)) {
        // Numeric ID - use generic label
        label = `#${segment}`;
      } else if (segment.match(/^[A-Z][0-9]/i)) {
        // Looks like a sign code (e.g., "A1", "B15")
        label = segment.toUpperCase();
      } else {
        // Fallback: humanize the segment
        label = segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      items.push({
        label,
        href: currentPath,
        isCurrentPage: isLastSegment,
      });
    });

    return items;
  }, [pathname, shouldShowBreadcrumbs, t]);

  // Check if we need to collapse on small screens
  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const isOverflowing = container.scrollWidth > container.clientWidth;
        setIsCollapsed(isOverflowing && breadcrumbItems.length > 3);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [breadcrumbItems.length]);

  // Don't render if not on a supported route or only 1 item
  if (!shouldShowBreadcrumbs || breadcrumbItems.length <= 1) {
    return null;
  }

  // Separator component - direction-aware
  const Separator = () => (
    <span className="mx-2 text-gray-400 flex-shrink-0" aria-hidden="true">
      {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </span>
  );

  // Render collapsed breadcrumbs (first, ellipsis, last)
  const renderCollapsedBreadcrumbs = () => {
    const firstItem = breadcrumbItems[0];
    const lastItem = breadcrumbItems[breadcrumbItems.length - 1];
    const middleItems = breadcrumbItems.slice(1, -1);

    return (
      <>
        {/* First item (Dashboard) */}
        <BreadcrumbLink item={firstItem} />
        <Separator />

        {/* Collapsed middle items */}
        <div className="relative">
          <button
            onClick={() => setShowCollapsedMenu(!showCollapsedMenu)}
            className="flex items-center px-2 py-1 rounded hover:bg-gray-100 text-gray-500"
            aria-label="Show more breadcrumbs"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {/* Dropdown menu for collapsed items */}
          {showCollapsedMenu && (
            <div
              className={cn(
                "absolute top-full mt-1 bg-white border rounded-md shadow-lg py-1 z-50 min-w-[150px]",
                isRTL ? "right-0" : "left-0"
              )}
            >
              {middleItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowCollapsedMenu(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
        <Separator />

        {/* Last item (current page) */}
        <BreadcrumbLink item={lastItem} />
      </>
    );
  };

  // Render full breadcrumbs
  const renderFullBreadcrumbs = () => {
    return breadcrumbItems.map((item, index) => (
      <span key={item.href} className="flex items-center">
        {index > 0 && <Separator />}
        <BreadcrumbLink item={item} />
      </span>
    ));
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        ref={containerRef}
        className="flex items-center flex-wrap text-sm text-gray-600 overflow-hidden"
      >
        {isCollapsed ? renderCollapsedBreadcrumbs() : renderFullBreadcrumbs()}
      </div>
    </nav>
  );
}

// Individual breadcrumb link component
function BreadcrumbLink({ item }: { item: BreadcrumbItem }) {
  if (item.isCurrentPage) {
    return (
      <span
        className="font-medium text-gray-900 truncate max-w-[200px]"
        aria-current="page"
      >
        {item.label}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className="text-gray-600 hover:text-primary hover:underline truncate max-w-[150px] transition-colors"
    >
      {item.label}
    </Link>
  );
}

export default Breadcrumb;
