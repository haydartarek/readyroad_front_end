'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { getBreadcrumbTrail } from '@/lib/admin-routes';

/**
 * Admin Breadcrumb Component
 *
 * Uses the route registry to build a breadcrumb trail.
 * RTL-aware separators. Shown on all admin pages.
 *
 * Example: Dashboard > Signs > #3 > Edit
 *
 * @author ReadyRoad Team
 * @since 2026-02-17
 */
export default function AdminBreadcrumb() {
    const pathname = usePathname();
    const { t, isRTL } = useLanguage();

    const trail = getBreadcrumbTrail(pathname, t);

    // Don't render on dashboard itself or if only 1 segment
    if (trail.length <= 1) return null;

    const SeparatorIcon = isRTL ? ChevronLeft : ChevronRight;

    return (
        <nav aria-label="Breadcrumb" className="mb-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <ol className="flex items-center flex-wrap text-sm text-gray-500 gap-1">
                {trail.map((segment, idx) => (
                    <li key={segment.href + idx} className="flex items-center">
                        {idx > 0 && (
                            <SeparatorIcon className="h-3.5 w-3.5 mx-1 text-gray-400 flex-shrink-0" />
                        )}
                        {segment.isCurrentPage ? (
                            <span className="font-medium text-gray-900 truncate max-w-[200px]" aria-current="page">
                                {segment.label}
                            </span>
                        ) : (
                            <Link
                                href={segment.href}
                                className="text-gray-500 hover:text-blue-600 hover:underline truncate max-w-[150px] transition-colors"
                            >
                                {segment.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
