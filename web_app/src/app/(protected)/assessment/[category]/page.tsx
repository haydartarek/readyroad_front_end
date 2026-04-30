"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import {
  getAssessmentCategory,
  type AssessmentCategory,
} from "@/services/assessmentService";
import { isServiceUnavailable, logApiError } from "@/lib/api";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import {
  PageHeroDescription,
  PageHeroSurface,
  PageHeroTitle,
} from "@/components/ui/page-surface";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronRight, Zap, BookOpen, Trophy } from "lucide-react";

const DIFFICULTY_META: Record<
  string,
  { label: string; color: string; icon: React.ElementType; key: string }
> = {
  BEGINNER: {
    label: "Beginner",
    key: "assessment.level.beginner",
    color:
      "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-500/70",
    icon: BookOpen,
  },
  INTERMEDIATE: {
    label: "Intermediate",
    key: "assessment.level.intermediate",
    color:
      "from-amber-500/20 to-amber-600/10 border-amber-500/30 hover:border-amber-500/70",
    icon: Zap,
  },
  ADVANCED: {
    label: "Advanced",
    key: "assessment.level.advanced",
    color:
      "from-rose-500/20 to-rose-600/10 border-rose-500/30 hover:border-rose-500/70",
    icon: Trophy,
  },
};

type CategoryLanguage = Parameters<typeof getAssessmentCategory>[1];

function CategoryContent({
  slug,
  language,
  t,
  isRTL,
}: {
  slug: string;
  language: CategoryLanguage;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}) {
  const router = useRouter();

  const [category, setCategory] = useState<AssessmentCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getAssessmentCategory(slug, language)
      .then((nextCategory) => {
        if (!cancelled) {
          setCategory(nextCategory);
        }
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        logApiError(err, "assessment category");
        if (isServiceUnavailable(err)) setUnavailable(true);
        else router.replace("/assessment");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, language, router]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 rounded-lg bg-muted/60 animate-pulse" />
        <div className="h-4 w-72 rounded-lg bg-muted/60 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-muted/60 animate-pulse border border-border/30"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("space-y-6 p-4 md:p-6", isRTL && "rtl")}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {unavailable && <ServiceUnavailableBanner />}

      <PageHeroSurface>
        <div className="space-y-3">
          <Link
            href="/assessment"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("assessment.back_to_categories")}
          </Link>
          <div className="space-y-1">
            <PageHeroTitle>
              {category?.name ?? slug}
            </PageHeroTitle>
            {category?.description && (
              <PageHeroDescription>
                {category.description}
              </PageHeroDescription>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            {category && (
              <>
                <Badge variant="secondary">
                  {t("assessment.badge_minutes", {
                    count: category.timeLimitMinutes,
                  })}
                </Badge>
                <Badge variant="secondary">
                  {t("assessment.badge_pass", {
                    count: category.passingScorePercent,
                  })}
                </Badge>
              </>
            )}
          </div>
        </div>
      </PageHeroSurface>

      {/* Level cards */}
      <p className="text-sm font-medium text-muted-foreground">
        {t("assessment.choose_level")}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(
          category?.difficulties ?? ["BEGINNER", "INTERMEDIATE", "ADVANCED"]
        ).map((level) => {
          const meta = DIFFICULTY_META[level] ?? DIFFICULTY_META["BEGINNER"];
          const Icon = meta.icon;
          return (
            <Link
              key={level}
              href={`/assessment/${slug}/${level.toLowerCase()}`}
              className="block group"
            >
              <div
                className={cn(
                  "rounded-2xl border bg-gradient-to-br p-6 transition-all duration-200",
                  "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer",
                  meta.color,
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-background/60 backdrop-blur-sm">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-semibold text-base mb-1">{t(meta.key)}</h3>
                <p className="text-xs text-muted-foreground">
                  {t(`assessment.level.${level.toLowerCase()}_desc`)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function CategoryPage() {
  const { language, t, isRTL } = useLanguage();
  const params = useParams<{ category: string }>();
  const slug = params.category;

  return (
    <CategoryContent
      key={`${slug}:${language}`}
      slug={slug}
      language={language}
      t={t}
      isRTL={isRTL}
    />
  );
}
