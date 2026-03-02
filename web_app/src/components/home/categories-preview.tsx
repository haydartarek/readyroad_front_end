'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Octagon, Ban, ArrowRightCircle,
  Info, ArrowRight,
} from 'lucide-react';
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

type Lang = 'en' | 'ar' | 'nl' | 'fr';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  A: AlertTriangle,
  B: Octagon,
  C: Ban,
  D: ArrowRightCircle,
};

const DEFAULT_ICON = Info;
const SKELETON_COUNT = 6;

function getCategoryIcon(code: string): React.ElementType {
  return CATEGORY_ICONS[code] ?? DEFAULT_ICON;
}

function getCategoryName(cat: Category, lang: Lang): string {
  const map: Record<Lang, string> = {
    en: cat.nameEn,
    ar: cat.nameAr || cat.nameEn,
    nl: cat.nameNl || cat.nameEn,
    fr: cat.nameFr || cat.nameEn,
  };
  return map[lang];
}

export function CategoriesPreview() {
  const { t, language, isRTL } = useLanguage();
  const lang = language as Lang;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<Category[]>(API_ENDPOINTS.CATEGORIES.LIST)
      .then((res) => {
        if (!cancelled) setCategories(res.data.slice(0, SKELETON_COUNT));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-muted/30 via-background to-background py-16 lg:py-24">
      <div className="pointer-events-none absolute -top-44 start-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="container relative mx-auto px-4">
        <div className="mb-12 text-center lg:mb-16">
          <h2 className="mb-4 text-balance text-3xl font-extrabold tracking-tight text-secondary md:text-4xl lg:text-5xl">
            {t('home.categories.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t('home.categories.subtitle')}
          </p>
        </div>

        {loading ? (
          <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div
                key={i}
                className="relative h-44 overflow-hidden rounded-3xl border bg-card/70 shadow-sm"
              >
                <div className="absolute inset-0 animate-pulse bg-muted/60" />
                <div className="absolute inset-0 bg-gradient-to-b from-muted/40 via-transparent to-transparent" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
              {categories.map((cat) => {
                const Icon = getCategoryIcon(cat.code);
                return (
                  <Link
                    key={cat.id}
                    href={ROUTES.PRACTICE_CATEGORY(cat.code)}
                    className={[
                      'group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-card/80 p-6 shadow-sm backdrop-blur',
                      'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20',
                    ].join(' ')}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/35 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    <div className="pointer-events-none absolute inset-0 ring-1 ring-border/60" />

                    <div className="relative">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-background/60 shadow-sm transition-transform duration-200 group-hover:scale-[1.03]">
                          <Icon className="h-6 w-6 text-primary" aria-hidden />
                        </div>

                        <span className="rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                          {t('home.categories.questions_count').replace(
                            '{count}',
                            String(cat.questionCount),
                          )}
                        </span>
                      </div>

                      <h3 className="text-lg font-extrabold tracking-tight text-secondary">
                        {getCategoryName(cat, lang)}
                      </h3>
                    </div>

                    <div className="relative mt-5">
                      <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/60 px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                        {t('home.categories.start_practice')}
                        <ArrowRight
                          className={[
                            'h-4 w-4 transition-transform',
                            isRTL ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5',
                          ].join(' ')}
                          aria-hidden
                        />
                      </div>
                    </div>

                    <div className="pointer-events-none absolute -bottom-12 -end-12 h-44 w-44 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                );
              })}
            </div>

            <div className="mt-10 text-center">
              <Button
                variant="outline"
                size="lg"
                className="h-12 rounded-full border-border px-8 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:bg-muted/60 hover:shadow-md active:translate-y-0"
                asChild
              >
                <Link href={ROUTES.PRACTICE}>{t('home.categories.view_all')}</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}