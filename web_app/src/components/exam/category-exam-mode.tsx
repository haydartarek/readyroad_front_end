"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Flag } from "lucide-react";
import Link from "@/components/localized-link";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { PageLoading } from "@/components/ui/page-loading";
import { PageSectionSurface } from "@/components/ui/page-surface";
import { FocusedExamShell } from "@/components/exam/focused-exam-shell";
import { FocusedQuestionCard } from "@/components/exam/focused-question-card";
import { ExamQuestionImageFrame } from "@/components/exam/exam-question-image-frame";
import { ExitConfirmDialog } from "@/components/exam/exit-confirm-dialog";
import { FreeExamPaywall } from "@/components/exam/free-exam-paywall";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useLocalizedRouter } from "@/hooks/use-localized-router";
import { buildLearningLoginHref } from "@/lib/auth-return-url";
import { convertToPublicImageUrl } from "@/lib/image-utils";
import { getLessonCategoryName, type HomeLessonCategory } from "@/lib/home-lessons-overview";
import { getAccountAccess } from "@/services/paymentService";
import {
  answerCategoryExam, getCategoryExam, getCategoryExamSummary,
  type CategoryExamData, type CategoryExamFeedback,
} from "@/services/theoryCategoryExamService";

export default function CategoryExamMode({ categoryCode }: { categoryCode: string }) {

  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { language, t, isRTL } = useLanguage();
  const { push } = useLocalizedRouter();
  const [category, setCategory] = useState<HomeLessonCategory | null>(null);
  const [exam, setExam] = useState<CategoryExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [requestKey, setRequestKey] = useState(0);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<CategoryExamFeedback[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const serverOffset = useRef(0);

  function lock() {
    setShowFinishDialog(false);
    setExam(null);
    setSelected(null);
    setPaywall(true);
  }

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      push(buildLearningLoginHref(`/exam?category=${categoryCode}`, language));
      return;
    }
    const abort = new AbortController();
    async function load() {
      setLoading(true);
      setExam(null);
      setError(null);
      setFinished(false);
      setIndex(0);
      setFeedback([]);
      setAnswers({});
      setSelected(null);
      setDeadline(null);
      setShowFinishDialog(false);
      try {
        const [summary, access] = await Promise.all([
          getCategoryExamSummary(categoryCode, language, abort.signal),
          getAccountAccess(abort.signal),
        ]);
        if (abort.signal.aborted) return;
        setCategory(summary);
        if (!access.active && !access.unlimited) {
          setPaywall(summary.questionCount > 0);
          return;
        }
        // The server independently authorizes delivery, even if the UI access record is stale.
        const data = await getCategoryExam(categoryCode, language, abort.signal);
        if (abort.signal.aborted) return;
        serverOffset.current = Date.parse(data.serverTime) - Date.now();
        const expiresAt = access.unlimited ? null : access.expiresAt;
        const expiry = expiresAt ? Date.parse(expiresAt) : null;
        if (!access.unlimited && (expiry === null || !Number.isFinite(expiry)
          || expiry <= Date.now() + serverOffset.current)) {
          setPaywall(true);
          return;
        }
        setDeadline(expiry);
        setCategory(data.category);
        setExam(data);
        setPaywall(false);
      } catch (err) {
        if (abort.signal.aborted) return;
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 403) setPaywall(true);
        else setError(status === 404 ? "category_exam.unavailable" : "common.load_error");
      } finally {
        if (!abort.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => abort.abort();
  }, [authLoading, isAuthenticated, user?.username, categoryCode, language, push, requestKey]);

  useEffect(() => {
    if (!exam) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const checkDeadline = () => {
      clearTimeout(timer);
      if (deadline === null) return;
      const remaining = deadline - Date.now() - serverOffset.current;
      if (remaining <= 0) { lock(); return; }
      timer = setTimeout(checkDeadline, Math.min(remaining, 60_000));
    };
    let active = true;
    const revalidate = async () => {
      checkDeadline();
      try {
        const access = await getAccountAccess();
        if (!active) return;
        if (!access.active && !access.unlimited) lock();
        else if (!access.unlimited && access.expiresAt) setDeadline(Date.parse(access.expiresAt));
      } catch {
        if (active) lock();
      }
    };
    checkDeadline();
    window.addEventListener("focus", revalidate);
    const visible = () => { if (document.visibilityState === "visible") void revalidate(); };
    document.addEventListener("visibilitychange", visible);
    return () => { active = false; clearTimeout(timer); window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", visible); };
  }, [exam, deadline]);

  const localized = (value: object, field: string): string => {
    const record = value as Record<string, unknown>;
    const suffix = language.charAt(0).toUpperCase() + language.slice(1);
    return String(record[`${field}${suffix}`] || record[`${field}En`] || "");
  };

  async function nextQuestion() {
    const question = exam?.questions[index];
    if (!question || selected === null || submitting.current) return;
    if (deadline !== null && Date.now() + serverOffset.current >= deadline) { lock(); return; }
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await answerCategoryExam(categoryCode, question.id, selected);
      if (deadline !== null && Date.now() + serverOffset.current >= deadline) { lock(); return; }
      setFeedback((current) => [...current, result]);
      setAnswers((current) => ({ ...current, [question.id]: selected }));
      setSelected(null);
      if (index + 1 === exam!.questions.length) setFinished(true);
      else setIndex((current) => current + 1);
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 403) lock();
      else setError("common.load_error");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  if (loading || authLoading) return <PageLoading />;
  const name = category ? getLessonCategoryName(category, language) : t("category_exam.title");
  const question = exam?.questions[index];
  const imageUrl = question?.contentImageUrl ? convertToPublicImageUrl(question.contentImageUrl) : null;
  const total = exam?.questions.length ?? category?.questionCount ?? 0;
  const difficultyLabel = question?.difficultyLevel
    ? t(`practice_exam.difficulty_${question.difficultyLevel.toLowerCase()}`) : undefined;

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      {!exam || !question || finished ? <>
      <div className="rv-container pt-7 md:pt-6">
        <Breadcrumb
          items={[
            {
              label: t("nav.dashboard"),
              href: "/dashboard",
            },
            {
              label: t("practice_exam.intro_title"),
              href: "/exam",
            },
            {
              label: name,
              isCurrentPage: true,
            },
          ]}
        />
      </div>

      <header className="rv-container flex flex-wrap items-center justify-between gap-3 py-4">
        <h1 className="min-w-0 break-words text-xl font-black">{name}</h1>
        <Link className="text-sm font-bold text-primary hover:underline" href="/lessons">{t("nav.lessons")}</Link>
      </header>
      </> : null}
      {error ? <p role="alert" className="rv-container py-3 text-destructive">{t(error)}</p> : null}
      {exam && question && !finished ? (
        <FocusedExamShell dir={isRTL ? "rtl" : "ltr"} counter={`${index + 1} / ${total}`}
          progressPercent={total ? index * 100 / total : 0}
          difficultyLabel={difficultyLabel}
          difficultyClassName="bg-primary/10 text-primary"
          compactInformationBar
          afterCard={
            <div data-testid="exam-actions"
              className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5 pb-3">
              <Button variant="destructive" size="lg" className="w-full whitespace-normal px-3"
                disabled={busy} data-testid="category-exam-finish" onClick={() => setShowFinishDialog(true)}>
                {t("practice_exam.end_exam")}
              </Button>
              <Button variant="outline" size="lg" className="w-full whitespace-normal px-3" asChild>
                <Link href="/contact" data-testid="category-exam-report-question">
                  <Flag className="h-4 w-4" aria-hidden="true" />
                  {t("practice_exam.report_question")}
                </Link>
              </Button>
            </div>
          }>
          <FocusedQuestionCard title={localized(question, "question")} compactOptionGap compactMobile
            headerBadges={<>
              <span className="inline-flex items-center rounded-full border border-border/60 px-2.5 py-1 text-xs font-semibold text-muted-foreground">{name}</span>
              <Link className="text-xs font-bold text-primary hover:underline" href="/lessons">{t("nav.lessons")}</Link>
            </>}
            difficultyBadge={difficultyLabel ? <span className="inline-flex min-h-8 items-center rounded-full border border-primary/20 bg-primary/10 px-3 text-xs font-black text-primary">{difficultyLabel}</span> : undefined}
            media={imageUrl ? <ExamQuestionImageFrame variant="theory" className="max-lg:max-h-[28svh] max-lg:p-1.5">
              <Image src={imageUrl} alt={localized(question, "question")} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain" />
            </ExamQuestionImageFrame> : undefined}
            options={question.options.map((option) => ({ key: option.id, text: localized(option, "optionText"),
              selected: selected === option.id, disabled: busy, onSelect: () => setSelected(option.id) }))}
            footer={
                <Button
                  data-testid="exam-next"
                  size="lg"
                  className="w-full shadow-md shadow-primary/20"
                  disabled={busy || selected === null}
                  onClick={() => void nextQuestion()}
                >
                  {t(index + 1 === total ? "category_exam.finish" : "category_exam.next")}
                  {index + 1 !== total && (isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />)}
                </Button>
            }
          />
        </FocusedExamShell>
      ) : finished && exam ? (
        <main className="rv-container space-y-5 pb-8">
          <PageSectionSurface title={t("category_exam.completed")}>
            <p className="text-2xl font-black text-primary" dir="ltr">
              {feedback.filter((answer) => answer.isCorrect).length} / {total}
            </p>
            <Button className="mt-4 font-bold" onClick={() => setRequestKey((current) => current + 1)}>{t("category_exam.restart")}</Button>
          </PageSectionSurface>
          {exam.questions.map((item, questionIndex) => {
            const answer = feedback.find((entry) => entry.questionId === item.id);
            return <PageSectionSurface key={item.id} title={`${questionIndex + 1} / ${total}`}>
              <FocusedQuestionCard title={localized(item, "question")}
                options={item.options.map((option) => ({ key: option.id, text: localized(option, "optionText"),
                  selected: answers[item.id] === option.id, disabled: true, onSelect: () => {},
                  state: option.id === answer?.correctOptionId ? "correct" : answers[item.id] === option.id ? "incorrect" : "idle" }))}
                feedback={answer ? <p className="text-sm leading-6">{localized(answer, "explanation")}</p> : undefined} />
            </PageSectionSurface>;
          })}
        </main>
      ) : (
        <main className="rv-container pb-8">
          <PageSectionSurface title={name} description={t("category_exam.questions", { count: total })}>
            {total > 0 && !error ? <Button onClick={() => setPaywall(true)}>
              {t("exam.paywall.choose_plan")}
            </Button> : <p>{t(error ?? "category_exam.empty")}</p>}
          </PageSectionSurface>
        </main>
      )}
      <ExitConfirmDialog
        open={showFinishDialog}
        onOpenChange={setShowFinishDialog}
        onStay={() => undefined}
        onLeave={() => {
          setShowFinishDialog(false);
          setSelected(null);
          setFinished(true);
        }}
        context="exam"
      />
      <FreeExamPaywall open={paywall} categoryCode={categoryCode} totalQuestions={total}
        completedQuestions={feedback.length} onOpenChange={setPaywall} />
    </div>
  );
}
