'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { apiClient } from '@/lib/api';
import { API_ENDPOINTS, ROUTES } from '@/lib/constants';

interface Category {
  id: number;
  code: string;
  nameEn: string;
  nameAr: string;
  nameNl: string;
  nameFr: string;
  questionCount: number;
}

/** Icon lookup by category code */
function CategoryIcon({ code }: { code: string }) {
  const iconProps = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  switch (code) {
    case 'A': // Danger signs
      return (
        <svg {...iconProps}>
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'B': // Priority rules
      return (
        <svg {...iconProps}>
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    case 'C': // Prohibition signs
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      );
    case 'D': // Mandatory signs
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16l4-4-4-4" />
          <path d="M8 12h8" />
        </svg>
      );
    default: // F (information) and others
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
}

export function CategoriesPreview() {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<Category[]>(API_ENDPOINTS.CATEGORIES.LIST)
      .then((res) => {
        if (!cancelled) setCategories(res.data.slice(0, 6));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const getName = (cat: Category) => {
    switch (language) {
      case 'ar': return cat.nameAr || cat.nameEn;
      case 'nl': return cat.nameNl || cat.nameEn;
      case 'fr': return cat.nameFr || cat.nameEn;
      default: return cat.nameEn;
    }
  };

  if (error) return null;

  return (
    <section className="relative overflow-hidden bg-muted/50 py-16 lg:py-24">
      <div className="container relative mx-auto px-4">
        {/* Header */}
        <div className="mb-12 text-center lg:mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-secondary md:text-4xl lg:text-5xl">
            {t('home.categories.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t('home.categories.subtitle')}
          </p>
        </div>

        {loading ? (
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <>
            <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={ROUTES.PRACTICE_CATEGORY(cat.code)}
                  className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
                >
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/[0.08] text-primary transition-transform duration-300 group-hover:scale-105">
                        <CategoryIcon code={cat.code} />
                      </div>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        {t('home.categories.questions_count').replace('{count}', String(cat.questionCount))}
                      </span>
                    </div>
                    <h3 className="mb-1 text-lg font-semibold text-secondary">{getName(cat)}</h3>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors group-hover:text-primary/80">
                    {t('home.categories.start_practice')}
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5 transition-transform group-hover:ltr:translate-x-0.5 group-hover:rtl:-translate-x-0.5"
                      aria-hidden="true"
                    >
                      <path d="M6 3l5 5-5 5" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>

            {/* View all link */}
            <div className="mt-10 text-center">
              <Link href={ROUTES.PRACTICE}>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-full border-2 border-border px-8 text-base font-semibold transition-all hover:border-secondary hover:bg-muted"
                >
                  {t('home.categories.view_all')}
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
