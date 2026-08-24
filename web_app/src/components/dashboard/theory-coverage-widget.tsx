import { BookOpenCheck, Eye, Gauge, Target } from "lucide-react";
import type { TheoryQuestionCoverage } from "@/services/progressService";
import { Progress } from "@/components/ui/progress";

type Translate = (key: string) => string;

function percentage(value: number | null): string {
  return value == null ? "—" : `${Math.round(value)}%`;
}

export function TheoryCoverageWidget({
  coverage,
  t,
}: {
  coverage: TheoryQuestionCoverage;
  t: Translate;
}) {
  const confidence = t(
    `dashboard.theory_coverage.confidence_${coverage.confidenceState.toLowerCase()}`,
  );

  return (
    <section
      className="min-w-0 rounded-2xl border border-border/50 bg-card p-4 shadow-sm sm:p-5"
      data-testid="theory-coverage-widget"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BookOpenCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-black text-foreground">
            {t("dashboard.theory_coverage.title")}
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t("dashboard.theory_coverage.description")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric
          icon={<Eye className="h-4 w-4" />}
          label={t("dashboard.theory_coverage.coverage")}
          value={percentage(coverage.coveragePercentage)}
        />
        <Metric
          icon={<Target className="h-4 w-4" />}
          label={t("dashboard.theory_coverage.accuracy")}
          value={percentage(coverage.accuracyPercentage)}
        />
        <Metric
          icon={<Gauge className="h-4 w-4" />}
          label={t("dashboard.theory_coverage.confidence")}
          value={confidence}
        />
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {t("dashboard.theory_coverage.seen")}: {coverage.uniqueQuestionsSeen}/
            {coverage.eligibleQuestions}
          </span>
          <span>
            {t("dashboard.theory_coverage.unseen")}: {coverage.unseenQuestions}
          </span>
        </div>
        <Progress value={coverage.coveragePercentage ?? 0} className="h-2" />
      </div>

      {coverage.categories.length > 0 ? (
        <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">
          {coverage.categories.map((category) => (
            <article
              key={category.categoryId}
              className="min-w-0 rounded-xl border border-border/40 bg-background/60 p-3"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <p className="min-w-0 break-words text-sm font-bold text-foreground">
                  {category.categoryName}
                </p>
                <span className="shrink-0 text-sm font-black text-primary">
                  {percentage(category.coveragePercentage)}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>
                  {t("dashboard.theory_coverage.accuracy")}: {percentage(category.accuracyPercentage)}
                </span>
                <span className="text-end">
                  {t("dashboard.theory_coverage.answered")}: {category.uniqueQuestionsAnswered}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 rounded-xl border border-border/40 bg-background/60 p-3 text-center">
      <span className="text-primary">{icon}</span>
      <span className="break-words text-xs font-semibold text-muted-foreground">{label}</span>
      <strong className="break-words text-lg font-black text-foreground">{value}</strong>
    </div>
  );
}
