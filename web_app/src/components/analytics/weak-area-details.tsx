"use client";

import { useState } from "react";

import Link from "@/components/localized-link";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ClipboardList,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

interface WeakArea {
  categoryCode: string;
  categoryName: string;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  estimatedTime: string;
  commonMistakes: string[];
  recommendedLessons: Array<{ code: string; title: string }>;
  accuracyGap?: number;
  recommendedQuestions?: number;
  recommendedDifficulty?: string;
}

type Severity = "critical" | "weak";

function getSeverity(accuracy: number): Severity | null {
  if (accuracy < 50) return "critical";
  if (accuracy < 80) return "weak";
  return null;
}

const SEVERITY = {
  critical: {
    card: "border-destructive/30 bg-destructive/5",
    badge: "bg-destructive",
    accuracy: "text-destructive",
    bar: "[&>div]:bg-destructive",
    labelKey: "analytics.badge_critical",
  },
  weak: {
    card: "border-primary/30 bg-primary/5",
    badge: "bg-primary",
    accuracy: "text-primary",
    bar: "[&>div]:bg-primary",
    labelKey: "analytics.needs_practice",
  },
} as const;

export function WeakAreaDetails({
  weakAreas,
  compact = false,
}: {
  weakAreas: WeakArea[];
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  if (weakAreas.length === 0) {
    return (
      <Card className={compact ? "border-0 bg-transparent shadow-none" : "rounded-2xl border-border/50 bg-muted/20 shadow-sm"}>
        <CardContent className={compact ? "space-y-2 px-0 py-6 text-start" : "space-y-3 py-16 text-center"}>
          {compact ? null : (
            <div className="text-6xl" aria-hidden="true">
              🎉
            </div>
          )}
          <h3 className="text-lg font-black text-foreground">
            {t("analytics.excellent_title")}
          </h3>
          <p className="text-muted-foreground">
            {t("analytics.excellent_desc")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={compact ? "divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card/70" : "space-y-4"}>
      {weakAreas.map((area, index) => {
        const severity = getSeverity(area.accuracy);
        const cfg = severity ? SEVERITY[severity] : null;
        const wrongCount = area.totalCount - area.correctCount;
        const isExpanded = expandedCategory === area.categoryCode;

        return (
          <Card
            key={area.categoryCode}
            className={cn(
              compact
                ? "rounded-none border-0 bg-transparent shadow-none"
                : "rounded-2xl border border-border/60 shadow-sm transition-shadow",
              !compact && (cfg?.card ?? "border-border/50"),
            )}
          >
            <CardContent className={compact ? "px-4 py-3 sm:px-5" : "p-4 sm:p-5"}>
              <div className={compact ? "flex flex-col gap-3" : "flex flex-col gap-4"}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-background/80 text-xs font-black text-foreground ring-1 ring-border/50">
                        {index + 1}
                      </span>

                      {cfg ? (
                        compact ? (
                          <span className={cn("text-xs font-semibold", cfg.accuracy)}>
                            {t(cfg.labelKey)}
                          </span>
                        ) : (
                          <Badge variant="destructive" className={cfg.badge}>
                            {t(cfg.labelKey)}
                          </Badge>
                        )
                      ) : null}
                    </div>

                    <h3 className={compact ? "mt-1.5 break-words text-sm font-semibold text-foreground" : "mt-2 break-words text-base font-black text-foreground"}>
                      {area.categoryName}
                    </h3>
                  </div>

                  <div className="flex-shrink-0 text-start">
                    <p
                      className={cn(
                        compact ? "text-base font-bold" : "text-xl font-black",
                        cfg?.accuracy ?? "text-secondary",
                      )}
                    >
                      {area.accuracy.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("analytics.stat_accuracy")}
                    </p>
                  </div>
                </div>

                <div className={compact ? "grid grid-cols-2 gap-4 py-0.5" : "grid grid-cols-3 gap-2 rounded-xl bg-background/70 p-3 ring-1 ring-border/40"}>
                  <div className="text-center">
                    <p className={compact ? "text-sm font-semibold text-secondary" : "text-base font-black text-secondary"}>
                      {area.correctCount}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t("analytics.stat_correct")}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className={compact ? "text-sm font-semibold text-destructive" : "text-base font-black text-destructive"}>
                      {wrongCount}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t("analytics.stat_wrong")}
                    </p>
                  </div>

                  {compact ? null : (
                    <div className="text-center">
                      <p className="text-base font-black text-primary">
                        {area.estimatedTime}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t("analytics.stat_estimated_time")}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <div className={compact ? "hidden" : "mb-2 flex items-center justify-between gap-4 text-xs"}>
                    <span className="font-semibold text-foreground">
                      {t("analytics.your_progress")}
                    </span>

                    <span className="text-muted-foreground">
                      {area.correctCount}/
                      {t("progress.stat_questions", {
                        count: area.totalCount,
                      })}
                    </span>
                  </div>

                  <Progress
                    value={area.accuracy}
                    className={cn(compact ? "h-1.5" : "h-2", "rounded-full", cfg?.bar)}
                  />
                </div>

                <div className={compact ? "flex flex-wrap items-center gap-2" : "grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"}>
                  <Button
                    asChild
                    variant={compact ? "ghost" : "default"}
                    className={compact ? "h-8 gap-2 rounded-lg px-2 text-primary hover:text-primary" : "gap-2 rounded-xl shadow-sm shadow-primary/20"}
                  >
                    <Link href="/exam">
                      <ClipboardList className="h-4 w-4" />
                      {t("analytics.practice_now")}
                    </Link>
                  </Button>

                  <Button
                    type="button"
                    variant={compact ? "ghost" : "outline"}
                    className={compact ? "h-8 gap-2 rounded-lg px-2" : "gap-2 rounded-xl"}
                    aria-expanded={isExpanded}
                    onClick={() =>
                      setExpandedCategory((current) =>
                        current === area.categoryCode ? null : area.categoryCode,
                      )
                    }
                  >
                    {t("analytics.improvement_plan")}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </Button>
                </div>
              </div>

              {isExpanded ? (
                <div className={compact ? "mt-3 space-y-3 border-t border-border/60 pt-3" : "mt-4 space-y-4 border-t border-border/60 pt-4"}>
                  {(area.recommendedQuestions != null ||
                    area.recommendedDifficulty ||
                    (area.accuracyGap ?? 0) > 0) && (
                    <div className={compact ? "border-t border-border/60 pt-4" : "rounded-xl bg-muted/40 p-4"}>
                      <h4 className="mb-3 text-sm font-semibold text-foreground">
                        {t("analytics.improvement_plan")}
                      </h4>

                      <div className="flex flex-wrap gap-x-5 gap-y-2">
                        {area.recommendedQuestions != null ? (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {area.recommendedQuestions}
                            </span>
                            {t("analytics.recommended_questions")}
                          </div>
                        ) : null}

                        {area.recommendedDifficulty ? (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <span className="font-semibold capitalize text-foreground">
                              {area.recommendedDifficulty.toLowerCase()}
                            </span>
                            {t("analytics.stat_difficulty")}
                          </div>
                        ) : null}

                        {(area.accuracyGap ?? 0) > 0 ? (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <span className="font-semibold text-primary">
                              +{area.accuracyGap?.toFixed(0)}%
                            </span>
                            {t("analytics.accuracy_needed")}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {area.commonMistakes.length > 0 ? (
                    <div className={compact ? "border-t border-border/60 pt-4" : "rounded-xl bg-muted/40 p-4"}>
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-primary" />
                        {t("analytics.common_mistakes")}
                      </h4>

                      <ul className="space-y-2">
                        {area.commonMistakes.map((mistake, mistakeIndex) => (
                          <li
                            key={mistakeIndex}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-destructive" />
                            <span>{mistake}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {area.recommendedLessons.length > 0 ? (
                    <div className={compact ? "border-t border-border/60 pt-4" : "rounded-xl bg-primary/5 p-4 ring-1 ring-primary/20"}>
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                        <BookOpen className="h-4 w-4 flex-shrink-0" />
                        {t("analytics.recommended_material")}
                      </h4>

                      <div className="space-y-2">
                        {area.recommendedLessons.map((lesson) => (
                          <Link
                            key={lesson.code}
                            href={`/lessons/${lesson.code}`}
                            className={compact ? "flex items-center gap-2 py-1.5 text-sm text-foreground transition-colors hover:text-primary" : "flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"}
                          >
                            <BookOpen className="h-4 w-4 flex-shrink-0 text-primary" />
                            <span>{lesson.title}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <Button
                    asChild
                    variant="outline"
                    className="w-full gap-2 rounded-xl"
                  >
                    <Link href="/lessons">
                      <BookOpen className="h-4 w-4" />
                      {t("analytics.study_lessons")}
                    </Link>
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}