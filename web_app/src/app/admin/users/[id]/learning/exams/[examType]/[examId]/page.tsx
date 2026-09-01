"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminSectionCard from "@/components/admin/AdminSectionCard";
import { ExamQuestionImageFrame } from "@/components/exam/exam-question-image-frame";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/language-context";
import apiClient, { logApiError } from "@/lib/api";
import { type AdminExamDetailResponse, type AdminExamSummary, examTypeKey } from "@/lib/admin-learning";
import { ClipboardCheck } from "lucide-react";

type QuestionRow = Record<string, unknown>;

export default function AdminLearningExamDetailPage() {
  const params = useParams<{ id: string; examType: string; examId: string }>();
  const { t, language } = useLanguage();
  const [detail, setDetail] = useState<AdminExamDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<AdminExamDetailResponse>(`/admin/learning/users/${params.id}/exams/${params.examType}/${params.examId}`)
      .then((response) => setDetail(response.data))
      .catch((reason) => { logApiError("Failed to load admin exam detail", reason); setError(t("admin.learning.load_error")); });
  }, [params.examId, params.examType, params.id, t]);

  const questions = useMemo(() => {
    const result = detail?.result;
    if (!result) return [];
    return ((result.allAnswers ?? result.questionResults ?? result.questions ?? []) as QuestionRow[]);
  }, [detail]);

  return <div className="space-y-5">
    <AdminPageHeader icon={<ClipboardCheck className="h-6 w-6" />} title={t("admin.learning.exam_detail")} description={detail ? `${t(examTypeKey(detail.examType))} #${detail.examId}` : t("common.loading")} />
    {error ? <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p> : null}
    {detail ? <ExamSummary summary={detail.summary} language={language} t={t} /> : null}
    {detail?.historicalContentStatus === "LEGACY_NO_SNAPSHOT" ? <p role="status" className="rounded-xl border border-amber-300/70 bg-amber-50 p-4 text-sm text-amber-900">{t("admin.learning.legacy_snapshot_notice")}</p> : null}
    {detail?.historicalContentStatus === "SNAPSHOT_PARTIAL" ? <p role="status" className="rounded-xl border border-amber-300/70 bg-amber-50 p-4 text-sm text-amber-900">{t("admin.learning.partial_snapshot_notice")}</p> : null}
    <AdminSectionCard title={t("admin.learning.answer_review")}>
      {!detail ? <p className="py-12 text-center text-sm text-muted-foreground">{t("common.loading")}</p> : questions.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">{t("admin.learning.no_historical_answers")}</p> : <div className="space-y-3">
        {questions.map((question, index) => <QuestionReview key={String(question.questionId ?? index)} question={question} index={index} language={language} resultImage={String(detail.result.signImagePath ?? "")} t={t} />)}
      </div>}
    </AdminSectionCard>
  </div>;
}

function ExamSummary({ summary, language, t }: { summary: AdminExamSummary; language: string; t: (key: string) => string }) {
  const locale = `${language}-u-ca-gregory`;
  const started = new Date(summary.startedAt);
  const completed = new Date(summary.completedAt);
  return <AdminSectionCard title={t("admin.learning.exam_summary")}>
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryItem label={t("admin.learning.exam_date")} value={completed.toLocaleDateString(locale)} />
      <SummaryItem label={t("admin.learning.started_at")} value={started.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })} />
      <SummaryItem label={t("admin.learning.completed_at")} value={completed.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })} />
      <SummaryItem label={t("admin.learning.duration")} value={duration(summary.durationSeconds, t)} />
      <SummaryItem label={t("admin.learning.score")} value={`${summary.correctAnswers}/${summary.totalQuestions} · ${Math.round(summary.scorePercentage)}%`} />
      <SummaryItem label={t("admin.learning.result")} value={t(summary.passed ? "admin.learning.passed" : "admin.learning.failed")} />
      <SummaryItem label={t("admin.learning.exam_type")} value={t(examTypeKey(summary.examType))} />
      <SummaryItem label={t("admin.learning.language")} value={summary.languageCode?.toUpperCase() || "—"} />
    </div>
  </AdminSectionCard>;
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-center"><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 font-black">{value}</p></div>;
}

function duration(seconds: number | null, t: (key: string) => string): string {
  if (seconds == null) return "—";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes} ${t("admin.learning.minutes")} ${remainder} ${t("admin.learning.seconds")}`;
}

function localized(row: QuestionRow, base: string, language: string): string {
  const suffix = language.charAt(0).toUpperCase() + language.slice(1);
  return String(row[`${base}${suffix}`] ?? row[base] ?? "");
}

function firstLocalized(row: QuestionRow, language: string, ...bases: string[]): string {
  return bases.map((base) => localized(row, base, language)).find(Boolean) ?? "";
}

function historicalId(row: QuestionRow, ...keys: string[]): string {
  const value = keys.map((key) => row[key]).find((candidate) => candidate != null);
  return value == null ? "" : `#${String(value)}`;
}

function QuestionReview({ question, index, language, resultImage, t }: { question: QuestionRow; index: number; language: string; resultImage: string; t: (key: string) => string }) {
  const correct = Boolean(question.isCorrect);
  const questionText = firstLocalized(question, language, "questionText", "question");
  const selected = firstLocalized(question, language, "selectedOptionText", "selectedText", "selectedChoice")
    || historicalId(question, "selectedOptionId", "selectedChoiceId");
  const answer = firstLocalized(question, language, "correctOptionText", "correctText", "correctChoice")
    || historicalId(question, "correctOptionId", "correctChoiceId");
  const explanation = localized(question, "explanation", language);
  const category = firstLocalized(question, language, "categoryName");
  const difficulty = String(question.difficulty ?? "").toLowerCase();
  const image = String(question.contentImageUrl ?? question.signImagePath ?? resultImage);
  const unanswered = question.answered === false
    || (!selected && question.selectedChoiceId == null && question.selectedOptionId == null);
  return <article className="space-y-3 rounded-xl border border-border/50 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><p className="font-black">{t("admin.learning.question")} {index + 1}</p>{category ? <Badge variant="outline">{category}</Badge> : null}{difficulty ? <Badge variant="outline">{t(`difficulty.${difficulty}`)}</Badge> : null}{question.snapshotAvailable === false ? <Badge variant="outline">{t("admin.learning.legacy_identity_only")}</Badge> : null}</div><Badge className={unanswered ? "bg-muted text-muted-foreground" : correct ? "bg-emerald-600" : "bg-destructive"}>{t(unanswered ? "exam.unanswered" : correct ? "admin.learning.correct" : "admin.learning.incorrect")}</Badge></div>
    {image ? <ExamQuestionImageFrame variant="wide"><Image src={image} alt={questionText || t("practice.question_image_alt")} fill sizes="(max-width: 640px) 100vw, 520px" className="object-contain" unoptimized /></ExamQuestionImageFrame> : null}
    <p className="font-semibold">{questionText || historicalId(question, "questionId", "questionRef") || "—"}</p>
    <div className="grid gap-2 sm:grid-cols-2"><div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">{t("admin.learning.selected_answer")}</p><p className="mt-1 font-semibold">{selected || "—"}</p></div><div className="rounded-lg bg-emerald-50 p-3"><p className="text-xs text-emerald-700">{t("admin.learning.correct_answer")}</p><p className="mt-1 font-semibold">{answer || "—"}</p></div></div>
    {explanation ? <p className="text-sm leading-6 text-muted-foreground">{explanation}</p> : null}
  </article>;
}
