"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "@/components/localized-link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminMetricCard from "@/components/admin/AdminMetricCard";
import AdminSectionCard from "@/components/admin/AdminSectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import apiClient, { logApiError } from "@/lib/api";
import {
  type ActivityAvailability,
  type AdminExamSummary,
  type AdminLearningPage,
  type CategoryPerformance,
  type DifficultyPerformance,
  type DifficultyPerformanceResponse,
  type LearningErrorPattern,
  type LessonActivity,
  type PracticeSummary,
  type SignPerformance,
  type StudentLearningSummary,
  type TheoryCoverage,
  type TheoryCoverageCategory,
  examTypeKey,
  localizedCategoryName,
  localizedLessonTitle,
} from "@/lib/admin-learning";
import { ArrowLeft, BarChart3, BookOpen, ClipboardCheck, RefreshCw, Target, UserRound } from "lucide-react";

type Section = "exams" | "coverage" | "categories" | "difficulty" | "practices" | "lessons" | "signs" | "errors" | "signStudy" | "videos";
type GenericRow = Record<string, unknown>;
type SectionPayload = TheoryCoverage | DifficultyPerformanceResponse | null;

const PAGED_SECTIONS = new Set<Section>(["exams", "practices", "lessons", "errors"]);

export default function AdminUserLearningPage() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const { t, language } = useLanguage();
  const [summary, setSummary] = useState<StudentLearningSummary | null>(null);
  const [section, setSection] = useState<Section>("exams");
  const [rows, setRows] = useState<GenericRow[]>([]);
  const [sectionPayload, setSectionPayload] = useState<SectionPayload>(null);
  const [sectionPage, setSectionPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<StudentLearningSummary>(`/admin/learning/users/${userId}`);
      setSummary(response.data);
    } catch (reason) {
      logApiError("Failed to load student learning profile", reason);
      setError(t("admin.learning.load_error"));
    } finally {
      setLoading(false);
    }
  }, [t, userId]);

  const loadSection = useCallback(async () => {
    setSectionLoading(true);
    try {
      setSectionPayload(null);
      setTotalPages(0);
      if (section === "coverage") {
        const response = await apiClient.get<TheoryCoverage>(`/admin/learning/users/${userId}/coverage`);
        setSectionPayload(response.data);
        setRows(response.data.categories as unknown as GenericRow[]);
      } else if (section === "difficulty") {
        const response = await apiClient.get<DifficultyPerformanceResponse>(`/admin/learning/users/${userId}/difficulty`);
        setSectionPayload(response.data);
        setRows(response.data.items as unknown as GenericRow[]);
      } else if (section === "categories") {
        const response = await apiClient.get<CategoryPerformance[]>(`/admin/learning/users/${userId}/categories`);
        setRows(response.data as unknown as GenericRow[]);
      } else if (section === "signs") {
        const response = await apiClient.get<GenericRow[]>(`/admin/learning/users/${userId}/signs`);
        setRows(response.data);
      } else if (section === "signStudy" || section === "videos") {
        const response = await apiClient.get<ActivityAvailability>(`/admin/learning/users/${userId}/activity-availability`);
        setRows([response.data as unknown as GenericRow]);
      } else {
        const endpoint = section === "errors" ? "error-patterns" : section;
        const response = await apiClient.get<AdminLearningPage<GenericRow>>(
          `/admin/learning/users/${userId}/${endpoint}`,
          { page: sectionPage, size: 20 },
        );
        setRows(response.data.items);
        setTotalPages(response.data.totalPages);
      }
    } catch (reason) {
      logApiError(`Failed to load learning section ${section}`, reason);
      setRows([]);
      setSectionPayload(null);
      setTotalPages(0);
    } finally {
      setSectionLoading(false);
    }
  }, [section, sectionPage, userId]);

  useEffect(() => void loadSummary(), [loadSummary]);
  useEffect(() => void loadSection(), [loadSection]);

  const sections: Section[] = ["exams", "coverage", "categories", "difficulty", "practices", "lessons", "signs", "errors", "signStudy", "videos"];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={<UserRound className="h-6 w-6" />}
        title={summary?.displayName || summary?.username || t("admin.learning.profile_title")}
        description={summary ? `${summary.email} · ${summary.preferredLanguage?.toUpperCase() || "—"}` : t("admin.learning.profile_description")}
        actions={<div className="flex flex-wrap items-center gap-2"><Button variant="outline" asChild><Link href="/admin/users" className="gap-2"><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t("admin.learning.back_to_users")}</Link></Button><Button variant="outline" onClick={loadSummary} disabled={loading} className="gap-2"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />{t("common.retry")}</Button></div>}
      />

      {error ? <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label={t("admin.learning.completed_exams")} value={summary?.totalCompletedExams} icon={<ClipboardCheck className="h-5 w-5" />} loading={loading} />
        <AdminMetricCard label={t("admin.learning.completed_practices")} value={summary?.totalCompletedPractices} icon={<Target className="h-5 w-5" />} loading={loading} />
        <AdminMetricCard label={t("admin.learning.average_score")} value={summary?.averageExamScore == null ? "—" : `${Math.round(summary.averageExamScore)}%`} icon={<BarChart3 className="h-5 w-5" />} loading={loading} />
        <AdminMetricCard label={t("admin.learning.trend")} value={summary ? t(`admin.learning.trend.${summary.learningTrend.toLowerCase()}`) : undefined} icon={<BookOpen className="h-5 w-5" />} loading={loading} />
      </div>

      {summary ? <div className="grid gap-3 lg:grid-cols-2">
        <CategoryHighlights title={t("admin.learning.strongest_areas")} categories={summary.strongestCategories} language={language} emptyLabel={t("admin.learning.no_data")} />
        <CategoryHighlights title={t("admin.learning.weakest_areas")} categories={summary.weakestCategories} language={language} emptyLabel={t("admin.learning.no_data")} />
      </div> : null}

      <div role="tablist" className="flex max-w-full gap-2 overflow-x-auto pb-1">
        {sections.map((item) => <Button key={item} role="tab" aria-selected={section === item} variant={section === item ? "default" : "outline"} size="sm" onClick={() => { setRows([]); setSectionPayload(null); setTotalPages(0); setSectionPage(0); setSection(item); }} className="shrink-0">{t(`admin.learning.section.${item}`)}</Button>)}
      </div>

      <AdminSectionCard title={t(`admin.learning.section.${section}`)}>
        {sectionLoading ? <div className="py-12 text-center text-sm text-muted-foreground">{t("common.loading")}</div> : <div className="space-y-4">
          <SectionOverview section={section} payload={sectionPayload} t={t} />
          {rows.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground">{t("admin.learning.no_data")}</div> : <div className="grid gap-3">
            {rows.map((row, index) => <LearningRow key={String(row.examId ?? row.sessionId ?? row.lessonId ?? row.categoryId ?? row.difficulty ?? row.id ?? index)} row={row} section={section} userId={userId} language={language} t={t} />)}
          </div>}
          {PAGED_SECTIONS.has(section) && totalPages > 1 ? <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" disabled={sectionPage === 0} onClick={() => setSectionPage((value) => Math.max(0, value - 1))}>{t("admin.learning.previous")}</Button>
            <Badge variant="outline">{sectionPage + 1}/{totalPages}</Badge>
            <Button variant="outline" size="sm" disabled={sectionPage + 1 >= totalPages} onClick={() => setSectionPage((value) => value + 1)}>{t("admin.learning.next")}</Button>
          </div> : null}
        </div>}
      </AdminSectionCard>
    </div>
  );
}

function CategoryHighlights({ title, categories, language, emptyLabel }: { title: string; categories: CategoryPerformance[]; language: string; emptyLabel: string }) {
  return <AdminSectionCard title={title}>
    {categories.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">{emptyLabel}</p> : <div className="flex flex-wrap gap-2">
      {categories.map((category) => <Badge key={category.categoryId} variant="outline" className="gap-1.5 py-1.5"><span>{localizedCategoryName(category, language)}</span><strong>{Math.round(category.accuracy)}%</strong></Badge>)}
    </div>}
  </AdminSectionCard>;
}

function SectionOverview({ section, payload, t }: { section: Section; payload: SectionPayload; t: (key: string) => string }) {
  if (section === "coverage" && payload && "eligibleQuestions" in payload) {
    return <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      <OverviewMetric label={t("admin.learning.coverage")} value={percentage(payload.coveragePercentage)} />
      <OverviewMetric label={t("admin.learning.accuracy")} value={percentage(payload.accuracyPercentage)} />
      <OverviewMetric label={t("admin.learning.questions_seen")} value={`${payload.uniqueQuestionsSeen}/${payload.eligibleQuestions}`} />
      <OverviewMetric label={t("dashboard.theory_coverage.confidence")} value={t(`dashboard.theory_coverage.confidence_${payload.confidenceState.toLowerCase()}`)} />
      <OverviewMetric label={t("admin.learning.presented_answered")} value={`${payload.timesPresented}/${payload.timesAnswered}`} />
    </div>;
  }
  if (section === "difficulty" && payload && "snapshotBackedAnswers" in payload) {
    return <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{t(`admin.learning.difficulty_evidence.${payload.evidenceStatus.toLowerCase()}`)}</p>
      {payload.legacyAnswersExcluded > 0 ? <Badge variant="outline">{t("admin.learning.legacy_answers_excluded")}: {payload.legacyAnswersExcluded}</Badge> : null}
    </div>;
  }
  return null;
}

function OverviewMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-center"><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 text-lg font-black">{value}</p></div>;
}

function percentage(value: number | null): string {
  return value == null ? "—" : `${Math.round(value)}%`;
}

function LearningRow({ row, section, userId, language, t }: { row: GenericRow; section: Section; userId: number; language: string; t: (key: string) => string }) {
  if (section === "exams") {
    const exam = row as unknown as AdminExamSummary;
    return <Link href={`/admin/users/${userId}/learning/exams/${exam.examType}/${exam.examId}`} className="grid gap-2 rounded-xl border border-border/50 p-4 transition-colors hover:bg-muted/30 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div><p className="font-bold">{t(examTypeKey(exam.examType))}{exam.subjectCode ? ` · ${exam.subjectCode}` : ""}</p><p className="text-xs text-muted-foreground">{new Date(exam.completedAt).toLocaleString(`${language}-u-ca-gregory`)}</p></div>
      <div className="flex items-center gap-2"><Badge variant="outline">{exam.correctAnswers}/{exam.totalQuestions}</Badge><Badge className={exam.passed ? "bg-emerald-600" : "bg-destructive"}>{Math.round(exam.scorePercentage)}%</Badge></div>
    </Link>;
  }
  if (section === "categories") {
    const category = row as unknown as CategoryPerformance;
    return <div className="grid gap-2 rounded-xl border border-border/50 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"><div><p className="font-bold">{localizedCategoryName(category, language)}</p><p className="text-xs text-muted-foreground">{category.correctAnswers}/{category.questionsAttempted}</p></div><Badge variant="outline">{Math.round(category.accuracy)}%</Badge></div>;
  }
  if (section === "coverage") {
    const coverage = row as unknown as TheoryCoverageCategory;
    return <div className="grid gap-2 rounded-xl border border-border/50 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"><div><p className="font-bold">{coverage.categoryName || t("common.not_available")}</p><p className="text-xs text-muted-foreground">{coverage.uniqueQuestionsSeen}/{coverage.eligibleQuestions} · {t("admin.learning.questions_seen")}</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{t("admin.learning.coverage")} {percentage(coverage.coveragePercentage)}</Badge><Badge variant="outline">{t("admin.learning.accuracy")} {percentage(coverage.accuracyPercentage)}</Badge><Badge variant="outline">{t(`dashboard.theory_coverage.confidence_${coverage.confidenceState.toLowerCase()}`)}</Badge></div></div>;
  }
  if (section === "difficulty") {
    const difficulty = row as unknown as DifficultyPerformance;
    return <div className="grid gap-2 rounded-xl border border-border/50 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"><div><p className="font-bold">{t(`difficulty.${difficulty.difficulty.toLowerCase()}`)}</p><p className="text-xs text-muted-foreground">{difficulty.correctAnswers}/{difficulty.answeredQuestions}</p></div><Badge variant="outline">{Math.round(difficulty.accuracy)}%</Badge></div>;
  }
  if (section === "practices") {
    const practice = row as unknown as PracticeSummary;
    return <div className="grid gap-2 rounded-xl border border-border/50 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"><div><p className="font-bold">{practice.signCode}</p><p className="text-xs text-muted-foreground">{practice.correctAnswers}/{practice.answeredQuestions} · {new Date(practice.completedAt ?? practice.startedAt).toLocaleString(`${language}-u-ca-gregory`)}</p></div><div className="flex items-center gap-2"><Badge variant="outline">{t(`dashboard.activity_status_${practice.status.toLowerCase()}`)}</Badge><Badge variant="outline">{Math.round(practice.accuracy)}%</Badge></div></div>;
  }
  if (section === "lessons") {
    const lesson = row as unknown as LessonActivity;
    const statusKey = lesson.status === "NOT_STARTED"
      ? "admin.learning.status_not_started"
      : `dashboard.activity_status_${lesson.status.toLowerCase()}`;
    return <div className="grid gap-2 rounded-xl border border-border/50 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"><div><p className="font-bold">{lesson.lessonCode} · {localizedLessonTitle(lesson, language)}</p><p className="text-xs text-muted-foreground">{new Date(lesson.lastSeenAt ?? lesson.openedAt).toLocaleString(`${language}-u-ca-gregory`)}</p></div><div className="flex items-center gap-2"><Badge variant="outline">{t(statusKey)}</Badge><Badge variant="outline">{lesson.pagesRead} {t("admin.learning.pages_read")}</Badge></div></div>;
  }
  if (section === "signs") {
    const sign = row as unknown as SignPerformance;
    return <div className="grid gap-2 rounded-xl border border-border/50 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"><div><p className="font-bold">{sign.signCode}</p><p className="text-xs text-muted-foreground">{sign.attempts} {t("admin.learning.attempts")} · {sign.passedAttempts} {t("admin.learning.passed_attempts")}</p></div><div className="flex items-center gap-2"><Badge variant="outline">{Math.round(sign.averageScore)}%</Badge>{sign.latestScore == null ? null : <Badge variant="outline">{t("admin.learning.latest")} {Math.round(sign.latestScore)}%</Badge>}</div></div>;
  }
  if (section === "errors") {
    const pattern = row as unknown as LearningErrorPattern;
    return <div className="grid gap-2 rounded-xl border border-border/50 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"><div><p className="font-bold">{t(`error_patterns.pattern_${pattern.errorType.toLowerCase()}`)}</p><p className="text-xs text-muted-foreground">{new Date(pattern.occurredAt).toLocaleString(`${language}-u-ca-gregory`)}</p></div>{pattern.trafficSignCode ? <Badge variant="outline">{pattern.trafficSignCode}</Badge> : null}</div>;
  }
  if (section === "signStudy" || section === "videos") {
    const availability = row as unknown as ActivityAvailability;
    const trackingAvailable = section === "signStudy"
      ? availability.trafficSignStudyTrackingAvailable
      : availability.videoTrackingAvailable;
    return <div className="space-y-3 rounded-xl border border-border/50 p-4"><p className="font-bold">{trackingAvailable ? t("admin.learning.no_data") : t("admin.learning.activity_not_tracked")}</p><p className="text-sm text-muted-foreground">{t(section === "signStudy" ? "admin.learning.sign_study_reason" : "admin.learning.video_reason")}</p></div>;
  }
  return null;
}
