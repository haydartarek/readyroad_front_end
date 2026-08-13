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
import { ClipboardCheck } from "lucide-react";

type ExamDetailResponse = { userId: number; examType: string; examId: number; result: Record<string, unknown> };
type QuestionRow = Record<string, unknown>;

export default function AdminLearningExamDetailPage() {
  const params = useParams<{ id: string; examType: string; examId: string }>();
  const { t, language } = useLanguage();
  const [detail, setDetail] = useState<ExamDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<ExamDetailResponse>(`/admin/learning/users/${params.id}/exams/${params.examType}/${params.examId}`)
      .then((response) => setDetail(response.data))
      .catch((reason) => { logApiError("Failed to load admin exam detail", reason); setError(t("admin.learning.load_error")); });
  }, [params.examId, params.examType, params.id, t]);

  const questions = useMemo(() => {
    const result = detail?.result;
    if (!result) return [];
    return ((result.allAnswers ?? result.questionResults ?? result.questions ?? []) as QuestionRow[]);
  }, [detail]);

  return <div className="space-y-5">
    <AdminPageHeader icon={<ClipboardCheck className="h-6 w-6" />} title={t("admin.learning.exam_detail")} description={detail ? `${detail.examType} #${detail.examId}` : t("common.loading")} />
    {error ? <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p> : null}
    <AdminSectionCard title={t("admin.learning.answer_review")}>
      {!detail ? <p className="py-12 text-center text-sm text-muted-foreground">{t("common.loading")}</p> : questions.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">{t("admin.learning.no_historical_answers")}</p> : <div className="space-y-3">
        {questions.map((question, index) => <QuestionReview key={String(question.questionId ?? index)} question={question} index={index} language={language} subjectCode={String(detail.result.signCode ?? "")} resultImage={String(detail.result.signImagePath ?? "")} t={t} />)}
      </div>}
    </AdminSectionCard>
  </div>;
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

function QuestionReview({ question, index, language, subjectCode, resultImage, t }: { question: QuestionRow; index: number; language: string; subjectCode: string; resultImage: string; t: (key: string) => string }) {
  const correct = Boolean(question.isCorrect);
  const questionText = firstLocalized(question, language, "questionText", "question");
  const selected = firstLocalized(question, language, "selectedOptionText", "selectedText", "selectedChoice")
    || historicalId(question, "selectedOptionId", "selectedChoiceId");
  const answer = firstLocalized(question, language, "correctOptionText", "correctText", "correctChoice")
    || historicalId(question, "correctOptionId", "correctChoiceId");
  const explanation = localized(question, "explanation", language);
  const category = firstLocalized(question, language, "categoryName")
    || String(question.categoryCode ?? question.signCode ?? subjectCode);
  const difficulty = String(question.difficulty ?? "").toLowerCase();
  const image = String(question.contentImageUrl ?? question.signImagePath ?? resultImage);
  const unanswered = question.answered === false
    || (!selected && question.selectedChoiceId == null && question.selectedOptionId == null);
  return <article className="space-y-3 rounded-xl border border-border/50 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><p className="font-black">{t("admin.learning.question")} {index + 1}</p>{category ? <Badge variant="outline">{category}</Badge> : null}{difficulty ? <Badge variant="outline">{t(`difficulty.${difficulty}`)}</Badge> : null}</div><Badge className={unanswered ? "bg-muted text-muted-foreground" : correct ? "bg-emerald-600" : "bg-destructive"}>{t(unanswered ? "exam.unanswered" : correct ? "admin.learning.correct" : "admin.learning.incorrect")}</Badge></div>
    {image ? <ExamQuestionImageFrame variant="wide"><Image src={image} alt={questionText || t("practice.question_image_alt")} fill sizes="(max-width: 640px) 100vw, 520px" className="object-contain" unoptimized /></ExamQuestionImageFrame> : null}
    <p className="font-semibold">{questionText || String(question.questionRef ?? "")}</p>
    <div className="grid gap-2 sm:grid-cols-2"><div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">{t("admin.learning.selected_answer")}</p><p className="mt-1 font-semibold">{selected || "—"}</p></div><div className="rounded-lg bg-emerald-50 p-3"><p className="text-xs text-emerald-700">{t("admin.learning.correct_answer")}</p><p className="mt-1 font-semibold">{answer || "—"}</p></div></div>
    {explanation ? <p className="text-sm leading-6 text-muted-foreground">{explanation}</p> : null}
  </article>;
}
