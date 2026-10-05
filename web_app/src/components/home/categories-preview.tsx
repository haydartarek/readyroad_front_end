"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "@/components/localized-link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { apiClient } from "@/lib/api";
import { resolveTrafficSignImage } from "@/lib/sign-image-resolver";
import { API_ENDPOINTS, ROUTES } from "@/lib/constants";
import type { TrafficSign } from "@/lib/types";

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
  "h-12 rounded-full border-primary/15 bg-background/85 px-8 text-sm font-semibold text-secondary shadow-sm ring-1 ring-primary/10 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-md active:translate-y-0";

function getCategoryName(category: Category, language: Lang): string {
  const names: Record<Lang, string> = {
    en: category.nameEn,
    ar: category.nameAr || category.nameEn,
    nl: category.nameNl || category.nameEn,
    fr: category.nameFr || category.nameEn,
  };

  return names[language];
}

function getTrafficSignCategory(sign: TrafficSign): string {
  const explicitCategory = sign.categoryCode?.trim().toUpperCase();

  if (explicitCategory) {
    return explicitCategory;
  }

  const signCode = sign.signCode?.trim().toUpperCase() ?? "";
  const match = signCode.match(/^[A-Z]+/);

  return match?.[0] ?? "";
}

function buildRepresentativeImages(
  signs: TrafficSign[],
): Record<string, string> {
  const images: Record<string, string> = {};

  for (const sign of signs) {
    const categoryCode = getTrafficSignCategory(sign);

    if (!categoryCode || images[categoryCode]) {
      continue;
    }

    const imageUrl = resolveTrafficSignImage(sign);

    if (imageUrl) {
      const signPathIndex = imageUrl.indexOf("/images/signs/");

      images[categoryCode] =
        signPathIndex >= 0 ? imageUrl.slice(signPathIndex) : imageUrl;
    }
  }

  return images;
}

export function CategoriesPreview() {
  const { t, language, isRTL } = useLanguage();
  const lang = language as Lang;

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const categoriesResponse = await apiClient.get<Category[]>(
          API_ENDPOINTS.CATEGORIES.LIST,
        );

        if (cancelled) {
          return;
        }

        setCategories(
          categoriesResponse.data
            .filter((category) => category.signCount > 0)
            .slice(0, SKELETON_COUNT),
        );

        try {
          const signsResponse = await apiClient.get<TrafficSign[]>(
            API_ENDPOINTS.TRAFFIC_SIGNS.LIST,
          );

          if (!cancelled) {
            setCategoryImages(buildRepresentativeImages(signsResponse.data));
          }
        } catch {
          if (!cancelled) {
            setCategoryImages({});
          }
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-14 sm:py-16 lg:py-20">
      <div className="pointer-events-none absolute -top-44 start-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="container relative mx-auto px-4">
        <div className="mb-10 flex flex-col gap-5 sm:mb-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-balance text-3xl font-black leading-tight tracking-tight text-secondary sm:text-4xl">
              {t("home.categories.title")}
            </h2>

            <p className="mt-4 text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-2xl border border-primary/10 bg-card/80"
              />
            ))}
          </div>
        ) : error ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-primary/10 bg-card p-8 text-center shadow-sm">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {categories.map((category) => {
              const categoryName = getCategoryName(category, lang);
              const categoryCode = category.code.trim().toUpperCase();
              const representativeImage = categoryImages[categoryCode];

              return (
                <Link
                  key={category.id}
                  href={ROUTES.PRACTICE_CATEGORY(category.code)}
                  prefetch={false}
                  className="group rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                  aria-label={`${t("home.categories.start_practice")}: ${categoryName}`}
                >
                  <article className="relative flex min-h-36 items-center gap-5 overflow-hidden rounded-2xl border border-primary/10 bg-card/95 p-5 shadow-sm ring-1 ring-primary/[0.03] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-6">
                    <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-background p-2 shadow-sm ring-1 ring-primary/5 transition-transform duration-200 group-hover:scale-[1.03] sm:h-[5.5rem] sm:w-[5.5rem]">
                      {representativeImage ? (
                        <Image
                          src={representativeImage}
                          alt=""
                          width={88}
                          height={88}
                          unoptimized
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="text-xl font-extrabold tracking-tight text-primary"
                        >
                          {category.code}
                        </span>
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-bold leading-6 tracking-tight text-secondary sm:text-xl sm:leading-7">
                        {categoryName}
                      </span>

                      <span className="mt-2.5 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                        {t("home.categories.signs_count").replace(
                          "{count}",
                          String(category.signCount),
                        )}
                      </span>
                    </span>

                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-primary/15 bg-background text-primary shadow-sm transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
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

                    <span className="pointer-events-none absolute -bottom-16 -end-16 h-36 w-36 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
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
