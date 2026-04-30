"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import {
  getAssessmentCategories,
  type AssessmentCategory,
} from "@/services/assessmentService";
import { isServiceUnavailable, logApiError } from "@/lib/api";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import {
  PageHeroDescription,
  PageHeroEyebrow,
  PageHeroSurface,
  PageHeroTitle,
} from "@/components/ui/page-surface";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Code2,
  Database,
  Lock,
  ShieldCheck,
  Layout,
  Server,
  CheckSquare,
  Bug,
  TestTube2,
  AlertCircle,
  Zap,
  Globe,
  Cloud,
  BarChart2,
  GitBranch,
  FolderOpen,
  FileText,
  Search,
  Settings,
  ChevronRight,
} from "lucide-react";

// ─── Icon mapping by category slug ────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  restapi: Code2,
  databaseintegration: Database,
  authentication: Lock,
  authorization: ShieldCheck,
  frontend: Layout,
  backendlogic: Server,
  validation: CheckSquare,
  security: Bug,
  testing: TestTube2,
  errorhandling: AlertCircle,
  performance: Zap,
  internationalization: Globe,
  deployment: Cloud,
  loggingmonitoring: BarChart2,
  cicd: GitBranch,
  filehandling: FolderOpen,
  reporting: FileText,
  searchfiltering: Search,
  configuration: Settings,
};

const CATEGORY_COLORS: string[] = [
  "from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-500/60",
  "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-500/60",
  "from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-500/60",
  "from-amber-500/20 to-amber-600/10 border-amber-500/30 hover:border-amber-500/60",
  "from-rose-500/20 to-rose-600/10 border-rose-500/30 hover:border-rose-500/60",
  "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 hover:border-cyan-500/60",
  "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 hover:border-indigo-500/60",
];

function CategoryCard({
  cat,
  index,
  t,
}: {
  cat: AssessmentCategory;
  index: number;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const Icon = CATEGORY_ICONS[cat.slug] ?? Code2;
  const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  return (
    <Link href={`/assessment/${cat.slug}`} className="block group">
      <div
        className={cn(
          "relative rounded-2xl border bg-gradient-to-br p-5 transition-all duration-200",
          "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer",
          color,
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-xl bg-background/60 backdrop-blur-sm">
            <Icon className="w-5 h-5 text-foreground" />
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <h3 className="font-semibold text-sm leading-snug mb-1">{cat.name}</h3>
        {cat.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {cat.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge variant="secondary" className="text-[10px] px-2 py-0">
            {t("assessment.badge_minutes", { count: cat.timeLimitMinutes })}
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-2 py-0">
            {t("assessment.badge_pass", { count: cat.passingScorePercent })}
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-2 py-0">
            {t("assessment.badge_levels", { count: cat.difficulties.length })}
          </Badge>
        </div>
      </div>
    </Link>
  );
}

type AssessmentLanguage = Parameters<typeof getAssessmentCategories>[0];

function AssessmentCatalog({
  language,
  t,
  isRTL,
}: {
  language: AssessmentLanguage;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}) {
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getAssessmentCategories(language)
      .then((nextCategories) => {
        if (!cancelled) {
          setCategories(nextCategories);
        }
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        logApiError(err, "assessment categories");
        if (isServiceUnavailable(err)) setUnavailable(true);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  return (
    <div
      className={cn("space-y-6 p-4 md:p-6", isRTL && "rtl")}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {unavailable && <ServiceUnavailableBanner />}

      <PageHeroSurface>
        <div className="space-y-1">
          <PageHeroEyebrow>
            {t("assessment.badge_levels", { count: 3 })}
          </PageHeroEyebrow>
          <PageHeroTitle>
            {t("assessment.title")}
          </PageHeroTitle>
          <PageHeroDescription>
            {t("assessment.subtitle")}
          </PageHeroDescription>
        </div>
      </PageHeroSurface>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-36 rounded-2xl bg-muted/60 animate-pulse border border-border/30"
            />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {t("assessment.no_categories")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <CategoryCard key={cat.id} cat={cat} index={i} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AssessmentPage() {
  const { language, t, isRTL } = useLanguage();

  return (
    <AssessmentCatalog
      key={language}
      language={language}
      t={t}
      isRTL={isRTL}
    />
  );
}
