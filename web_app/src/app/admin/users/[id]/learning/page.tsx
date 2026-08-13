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
  type LearningErrorPattern,
  type LessonActivity,
  type PracticeSummary,
  type SignPerformance,
  type StudentLearningSummary,
  examTypeKey,
  localizedCategoryName,
  localizedLessonTitle,
} from "@/lib/admin-learning";
import { BarChart3, BookOpen, ClipboardCheck, RefreshCw, Target, UserRound } from "lucide-react";

type Section = "exams" | "categories" | "practices" | "lessons" | "signs" | "errors" | "signStudy" | "videos";
type GenericRow = Record<string, unknown>;

export default function AdminUserLearningPage() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const { t, language } = useLanguage();
  const [summary, setSummary] = useState<StudentLearningSummary | null>(null);
  const [section, setSection] = useState<Section>("exams");
  const [rows, setRows] = useState<GenericRow[]>([]);
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
      if (section === "categories") {
        const response = await apiClient.get<CategoryPerformance[]>(`/admin/learning/users/${userId}/categories`);
        setRows(response.data as unknown as GenericRow[]);
      } else if (section === "signs") {
        const response = await apiClient.get<GenericRow[]>(`/admin/learning/users/${userId}/signs`);
        setRows(response.data);
      } else if (section === "signStudy" || section === "videos") {
        const response = await apiClient.get<ActivityAvailability>(`/admin/learning/users/${userId}/activity-availability`);
        setRows([response.data as unknown as GenericRow]);
      } else {
        const response = await apiClient.get<AdminLearningPage<GenericRow>>(
          `/admin/learning/users/${userId}/${section}`,
          { page: 0, size: 20 },
        );
        setRows(response.data.items);
      }
    } catch (reason) {
      logApiError(`Failed to load learning section ${section}`, reason);
      setRows([]);
    } finally {
      setSectionLoading(false);
    }
  }, [section, userId]);

  useEffect(() => void loadSummary(), [loadSummary]);
  useEffect(() => void loadSection(), [loadSection]);

  const sections: Section[] = ["exams", "categories", "practices", "lessons", "signs", "errors", "signStudy", "videos"];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={<UserRound className="h-6 w-6" />}
        title={summary?.displayName || summary?.username || t("admin.learning.profile_title")}
        description={summary ? `${summary.email} · ${summary.preferredLanguage?.toUpperCase() || "—"}` : t("admin.learning.profile_description")}
        actions={<Button variant="outline" onClick={loadSummary} disabled={loading} className="gap-2"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />{t("common.retry")}</Button>}
      />

      {error ? <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label={t("admin.learning.completed_exams")} value={summary?.totalCompletedExams} icon={<ClipboardCheck className="h-5 w-5" />} loading={loading} />
        <AdminMetricCard label={t("admin.learning.completed_practices")} value={summary?.totalCompletedPractices} icon={<Target className="h-5 w-5" />} loading={loading} />
        <AdminMetricCard label={t("admin.learning.average_score")} value={summary?.averageExamScore == null ? "—" : `${Math.round(summary.averageExamScore)}%`} icon={<BarChart3 className="h-5 w-5" />} loading={loading} />
        <AdminMetricCard label={t("admin.learning.trend")} value={summary ? t(`admin.learning.trend.${summary.learningTrend.toLowerCase()}`) : undefined} icon={<BookOpen className="h-5 w-5" />} loading={loading} />
      </div>

      <div role="tablist" className="flex max-w-full gap-2 overflow-x-auto pb-1">
        {sections.map((item) => <Button key={item} role="tab" aria-selected={section === item} variant={section === item ? "default" : "outline"} size="sm" onClick={() => setSection(item)} className="shrink-0">{t(`admin.learning.section.${item}`)}</Button>)}
      </div>

      <AdminSectionCard title={t(`admin.learning.section.${section}`)}>
        {sectionLoading ? <div className="py-12 text-center text-sm text-muted-foreground">{t("common.loading")}</div> : rows.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground">{t("admin.learning.no_data")}</div> : (
          <div className="grid gap-3">
            {rows.map((row, index) => <LearningRow key={String(row.examId ?? row.sessionId ?? row.lessonId ?? row.categoryId ?? row.id ?? index)} row={row} section={section} userId={userId} language={language} t={t} />)}
          </div>
        )}
      </AdminSectionCard>
    </div>
  );
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
    return <div className="grid gap-2 rounded-xl border border-border/50 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"><div><p className="font-bold">{category.categoryCode} · {localizedCategoryName(category, language)}</p><p className="text-xs text-muted-foreground">{category.correctAnswers}/{category.questionsAttempted}</p></div><Badge variant="outline">{Math.round(category.accuracy)}%</Badge></div>;
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
