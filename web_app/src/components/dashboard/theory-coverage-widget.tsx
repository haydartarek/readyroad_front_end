import type { TheoryQuestionCoverage } from "@/services/progressService";
import { PageSectionSurface } from "@/components/ui/page-surface";
import { Progress } from "@/components/ui/progress";
import Link from "@/components/localized-link";

type Translate = (key: string) => string;

type ResolveCategoryName = (
  categoryCode: string,
  fallback: string,
) => string;

function percentage(value: number | null): string {
  return value == null ? "\u2014" : `${Math.round(value)}%`;
}

export function TheoryCoverageWidget({
  coverage,
  t,
  resolveCategoryName,
}: {
  coverage: TheoryQuestionCoverage;
  t: Translate;
  resolveCategoryName?: ResolveCategoryName;
}) {
  const confidence = t(
    `dashboard.theory_coverage.confidence_${coverage.confidenceState.toLowerCase()}`,
  );

  const summary = [
    {
      key: "coverage",
      label: t("dashboard.theory_coverage.coverage"),
      value: percentage(coverage.coveragePercentage),
      numeric: true,
    },
    {
      key: "accuracy",
      label: t("dashboard.theory_coverage.accuracy"),
      value: percentage(coverage.accuracyPercentage),
      numeric: true,
    },
    {
      key: "confidence",
      label: t("dashboard.theory_coverage.confidence"),
      value: confidence,
      numeric: false,
    },
  ] as const;

  return (
    <div data-testid="theory-coverage-widget">
      <PageSectionSurface
        title={t("dashboard.theory_coverage.title")}
        description={t("dashboard.theory_coverage.description")}
        contentClassName="space-y-0"
      >
        <div className="grid min-w-0 gap-4 pb-4 sm:grid-cols-3 sm:gap-6">
          {summary.map((item) => (
            <div
              key={item.key}
              className="min-w-0"
            >
              <p className="text-xs font-semibold text-muted-foreground">
                {item.label}
              </p>

              <p
                dir={item.numeric ? "ltr" : undefined}
                className="mt-1 break-words text-xl font-black tracking-tight text-foreground sm:text-2xl"
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-border/60 py-4">
          <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span>
              {t("dashboard.theory_coverage.seen")}:{" "}
              <strong
                dir="ltr"
                className="font-semibold text-foreground"
              >
                {coverage.uniqueQuestionsSeen}/{coverage.eligibleQuestions}
              </strong>
            </span>

            <span>
              {t("dashboard.theory_coverage.unseen")}:{" "}
              <strong
                dir="ltr"
                className="font-semibold text-foreground"
              >
                {coverage.unseenQuestions}
              </strong>
            </span>
          </div>

          <Progress
            value={coverage.coveragePercentage ?? 0}
            className="mt-3 h-2"
          />
        </div>

        {coverage.categories.length > 0 ? (
          <div className="border-t border-border/60">
            <div className="divide-y divide-border/60">
              {coverage.categories.map((category) => {
                const displayName =
                  resolveCategoryName?.(
                    category.categoryCode,
                    category.categoryName,
                  ) ?? category.categoryName;

                return (
                  <div
                    key={category.categoryId}
                    className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-3"
                  >
                    <p className="min-w-0 break-words text-sm font-semibold text-foreground">
                      {/^TH(?:0[1-9]|10)$/.test(category.categoryCode) ? (
                        <Link className="underline-offset-4 hover:underline" href={`/exam?category=${category.categoryCode}`}>
                          {displayName}
                        </Link>
                      ) : displayName}
                    </p>

                    <strong
                      dir="ltr"
                      className="shrink-0 text-base font-black text-primary"
                    >
                      {percentage(category.coveragePercentage)}
                    </strong>

                    <p className="col-start-1 row-start-2 min-w-0 break-words text-xs text-muted-foreground">
                      {t("dashboard.theory_coverage.answered")}:{" "}
                      <span dir="ltr">
                        {category.uniqueQuestionsAnswered}
                      </span>

                      {" \u00B7 "}

                      {t("dashboard.theory_coverage.accuracy")}:{" "}
                      <span dir="ltr">
                        {percentage(category.accuracyPercentage)}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </PageSectionSurface>
    </div>
  );
}
