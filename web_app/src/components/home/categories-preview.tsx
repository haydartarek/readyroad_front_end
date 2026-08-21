"use client";

import { useEffect, useState } from "react";
import Link from "@/components/localized-link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { apiClient } from "@/lib/api";
import { getCategoryVisual } from "@/lib/category-visuals";
import { API_ENDPOINTS, ROUTES } from "@/lib/constants";

interface Category {
  id: number;
  code: string;
  nameEn: string;
  nameAr: string;
  nameNl: string;
  nameFr: string;
  signCount: number;
}

type Lang = "en" | "ar" | "nl" | "fr";
const SKELETON_COUNT = 6;
const SECTION_OUTLINE_CTA_CLASS =
  "h-12 rounded-full border-primary/15 bg-background/85 px-8 text-sm font-semibold text-secondary shadow-sm ring-1 ring-primary/10 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:bg-primary/5 hover:text-primary hover:shadow-md active:translate-y-0";

function getCategoryName(category: Category, language: Lang): string {
  const names: Record<Lang, string> = {
    en: category.nameEn,
    ar: category.nameAr || category.nameEn,
    nl: category.nameNl || category.nameEn,
    fr: category.nameFr || category.nameEn,
  };

  return names[language];
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
      .then((response) => {
        if (!cancelled) {
          setCategories(
            response.data
              .filter((category) => category.signCount > 0)
              .slice(0, SKELETON_COUNT),
          );
        }
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

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-muted/30 via-background to-background py-16 lg:py-24">
      <div className="pointer-events-none absolute -top-44 start-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="container relative mx-auto px-4">
        <div className="mb-10 flex flex-col gap-5 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="mb-4 text-balance text-3xl font-extrabold tracking-tight text-secondary md:text-4xl lg:text-5xl">
              {t("home.categories.title")}
            </h2>

            <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("home.categories.subtitle")}
            </p>
          </div>

          {!loading && !error && (
            <Button
              variant="outline"
              size="lg"
              className={`${SECTION_OUTLINE_CTA_CLASS} shrink-0`}
              asChild
            >
              <Link href={ROUTES.PRACTICE}>
                {t("home.categories.view_all")}
              </Link>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl border bg-card/70"
              />
            ))}
          </div>
        ) : error ? (
          <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-8 text-center shadow-sm">
            <div className="space-y-4">
              <h3 className="text-xl font-extrabold tracking-tight text-secondary">
                {t("home.categories.error_title")}
              </h3>

              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t("home.categories.error_desc")}
              </p>

              <Button
                variant="outline"
                size="lg"
                className={SECTION_OUTLINE_CTA_CLASS}
                asChild
              >
                <Link href={ROUTES.TRAFFIC_SIGNS}>
                  {t("home.categories.browse_signs")}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {categories.map((category) => {
              const visual = getCategoryVisual(category.code);
              const Icon = visual.icon;

              return (
                <Link
                  key={category.id}
                  href={ROUTES.PRACTICE_CATEGORY(category.code)}
                  prefetch={false}
                  className="group rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                  aria-label={`${t("home.categories.start_practice")}: ${getCategoryName(category, lang)}`}
                >
                  <article className="relative flex min-h-32 items-center gap-4 overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
                    <span
                      className={[
                        "grid h-12 w-12 shrink-0 place-items-center rounded-2xl border shadow-sm",
                        visual.iconWrap,
                      ].join(" ")}
                    >
                      <Icon
                        className={["h-5 w-5", visual.iconTone].join(" ")}
                        aria-hidden
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-bold tracking-tight text-secondary">
                        {getCategoryName(category, lang)}
                      </span>

                      <span
                        className={[
                          "mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                          visual.countBadge,
                        ].join(" ")}
                      >
                        {t("home.categories.signs_count").replace(
                          "{count}",
                          String(category.signCount),
                        )}
                      </span>
                    </span>

                    <span
                      className={[
                        "grid h-9 w-9 shrink-0 place-items-center rounded-full border bg-background text-primary shadow-sm transition-all",
                        "group-hover:border-primary/30 group-hover:bg-primary group-hover:text-primary-foreground",
                      ].join(" ")}
                    >
                      <ArrowRight
                        className={[
                          "h-4 w-4 transition-transform",
                          isRTL
                            ? "rotate-180 group-hover:-translate-x-0.5"
                            : "group-hover:translate-x-0.5",
                        ].join(" ")}
                        aria-hidden
                      />
                    </span>

                    <span
                      className={[
                        "pointer-events-none absolute -bottom-14 -end-14 h-32 w-32 rounded-full blur-3xl opacity-0 transition-opacity group-hover:opacity-100",
                        visual.cardGlow,
                      ].join(" ")}
                    />
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
