'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronLeft, Home } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { getBreadcrumbTrail } from '@/lib/admin-routes';

export default function AdminBreadcrumb() {
  const pathname = usePathname();
  const { t, isRTL } = useLanguage();

  const trail = getBreadcrumbTrail(pathname, t);

  if (trail.length <= 1) return null;

  const Separator = isRTL ? ChevronLeft : ChevronRight;

  return (
    <nav aria-label="Breadcrumb" dir={isRTL ? 'rtl' : 'ltr'} className="mb-6">
      <ol className="inline-flex items-center gap-1 rounded-2xl border border-border/50 bg-card px-4 py-2 shadow-sm">
        {trail.map((segment, idx) => (
          <li key={`${segment.href}-${idx}`} className="flex items-center gap-1">
            {idx > 0 && (
              <Separator className="h-3 w-3 text-muted-foreground/40 flex-shrink-0 mx-0.5" />
            )}
            {segment.isCurrentPage ? (
              <span
                aria-current="page"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary truncate max-w-[200px]"
              >
                {segment.label}
              </span>
            ) : idx === 0 ? (
              <Link
                href={segment.href}
                className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                <Home className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate max-w-[120px]">{segment.label}</span>
              </Link>
            ) : (
              <Link
                href={segment.href}
                className="inline-flex items-center rounded-xl px-2 py-1 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground truncate max-w-[150px]"
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
