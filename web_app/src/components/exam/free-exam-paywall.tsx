"use client";

import { useRef, useState } from "react";
import { CalendarCheck, CheckCircle2, Trophy, Zap } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import {
  checkoutRequestId,
  createCheckout,
  forgetCheckoutRequest,
  navigateToCheckout,
  PAYMENTS_ENABLED,
  rememberExamCheckoutResume,
  type PaymentPlan,
} from "@/services/paymentService";

const PAYWALL_PLANS: readonly PaymentPlan[] = [
  "RIJVIA_3_DAYS",
  "RIJVIA_1_WEEK",
  "RIJVIA_4_WEEKS",
];

const PRICE_BY_PLAN: Record<PaymentPlan, string> = {
  RIJVIA_3_DAYS: "€2.99",
  RIJVIA_1_WEEK: "€6.99",
  RIJVIA_4_WEEKS: "€14.99",
};

function PlanIcon({ plan }: { plan: PaymentPlan }) {
  const iconClass = "h-4 w-4";

  switch (plan) {
    case "RIJVIA_3_DAYS":
      return <Zap className={iconClass} aria-hidden />;

    case "RIJVIA_1_WEEK":
      return <CalendarCheck className={iconClass} aria-hidden />;

    case "RIJVIA_4_WEEKS":
      return <Trophy className={iconClass} aria-hidden />;
  }
}

export function FreeExamPaywall({
  open,
  examId,
  totalQuestions,
  completedQuestions,
  onOpenChange,
}: {
  open: boolean;
  examId: number;
  totalQuestions: number;
  completedQuestions: number;
  onOpenChange: (open: boolean) => void;
}) {
  const { user, isAuthenticated } = useAuth();
  const { language, t, isRTL } = useLanguage();

  const [selectedPlan, setSelectedPlan] =
    useState<PaymentPlan>("RIJVIA_1_WEEK");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    null,
  );

  const submitting = useRef(false);

  const safeTotalQuestions = Math.max(1, totalQuestions);
  const safeCompletedQuestions = Math.min(
    Math.max(0, completedQuestions),
    safeTotalQuestions,
  );
  const remainingQuestions = Math.max(
    0,
    safeTotalQuestions - safeCompletedQuestions,
  );
  const progressPercent = Math.round(
    (safeCompletedQuestions / safeTotalQuestions) * 100,
  );

  async function continueToCheckout() {
    if (
      submitting.current ||
      !PAYMENTS_ENABLED
    ) {
      return;
    }

    if (!isAuthenticated || !user) {
      setError("payment.login_required");
      return;
    }

    submitting.current = true;
    setBusy(true);
    setError(null);

    try {
      const requestId = checkoutRequestId(
        user.username,
        selectedPlan,
      );

      const checkout = await createCheckout(
        selectedPlan,
        requestId,
        language,
      );

      rememberExamCheckoutResume(
        examId,
        checkout.purchaseId,
      );

      navigateToCheckout(
        checkout.checkoutUrl,
      );
    } catch (err) {
      const status =
        (err as { response?: { status?: number } })
          .response?.status;

      if (status === 409 || status === 410) {
        forgetCheckoutRequest(
          user.username,
          selectedPlan,
        );
        setError("payment.expired");
      } else {
        setError("payment.checkout_error");
      }
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!busy) onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        dir={isRTL ? "rtl" : "ltr"}
        className="max-h-[96vh] gap-3 overflow-y-auto p-4 sm:max-w-3xl sm:p-5"
      >
        <DialogHeader className={isRTL ? "text-right sm:text-right" : "text-left sm:text-left"}>
          <DialogTitle className="text-xl font-black sm:text-2xl">
            {t("exam.paywall.title")}
          </DialogTitle>

          <DialogDescription className={["text-sm leading-5", isRTL ? "text-right" : "text-left"].join(" ")}>
            {t("exam.paywall.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-start text-sm font-semibold">
          <span className="inline-flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {t("exam.paywall.answers_saved")}
          </span>
        </div>

        <div className="rounded-2xl border bg-muted/30 px-4 py-3">
          <div className="flex items-end justify-between gap-4">
            <div className="text-start">
              <bdi
                dir="ltr"
                className="text-2xl font-black tracking-tight text-foreground"
              >
                {safeCompletedQuestions} / {safeTotalQuestions}
              </bdi>

              <p className="mt-1 text-sm font-bold text-foreground">
                {t("exam.paywall.progress_label")}
              </p>
            </div>

            <span className="text-xs font-bold text-muted-foreground">
              {progressPercent}%
            </span>
          </div>

          <div
            role="progressbar"
            aria-label={t("exam.paywall.progress_label")}
            aria-valuemin={0}
            aria-valuemax={safeTotalQuestions}
            aria-valuenow={safeCompletedQuestions}
            className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="mt-1.5 text-start text-xs font-medium text-muted-foreground">
            {t("exam.paywall.remaining", {
              count: remainingQuestions,
            })}
          </p>
        </div>

        <div>
          <p className="mb-2 text-start text-sm font-black">
            {t("exam.paywall.choose_plan")}
          </p>

          <div className="grid gap-3 md:grid-cols-3">
            {PAYWALL_PLANS.map((plan) => {
              const selected =
                selectedPlan === plan;

              const recommended =
                plan === "RIJVIA_1_WEEK";

              return (
                <button
                  key={plan}
                  type="button"
                  aria-pressed={selected}
                  data-testid={`exam-paywall-${plan}`}
                  onClick={() =>
                    setSelectedPlan(plan)
                  }
                  className={[
                    "relative flex min-h-[132px] flex-col rounded-2xl border-2 px-3.5 py-4 text-start transition",
                    selected
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border bg-card hover:border-primary/40",
                  ].join(" ")}
                >
                  {recommended ? (
                    <span className="absolute -top-3 end-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-black text-primary-foreground">
                      {t("home.pricing.recommended")}
                    </span>
                  ) : null}

                  <div className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-primary/15 bg-primary/10 text-primary">
                      <PlanIcon plan={plan} />
                    </span>

                    <p className="font-black">
                      {t(`payment.plan.${plan}`)}
                    </p>
                  </div>

                  <p className="mt-2 text-sm leading-5 text-muted-foreground">
                    {t(`home.pricing.tagline.${plan}`)}
                  </p>

                  <bdi
                    dir="ltr"
                    className="mt-auto block pt-3 text-2xl font-black text-primary"
                  >
                    {PRICE_BY_PLAN[plan]}
                  </bdi>

                  <bdi
                    dir="ltr"
                    className="mt-1 block text-xs font-bold text-muted-foreground"
                  >
                    {t(`home.pricing.per_day.${plan}`)}
                  </bdi>
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive"
          >
            {t(error)}
          </p>
        ) : null}

        <Button
          size="lg"
          className="w-full gap-2 bg-emerald-600 text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700"
          disabled={
            busy ||
            !PAYMENTS_ENABLED
          }
          onClick={() =>
            void continueToCheckout()
          }
        >
          {busy ? (
            t("payment.opening")
          ) : (
            <>
              <span>{t("exam.paywall.continue")}</span>
              <bdi dir="ltr">{PRICE_BY_PLAN[selectedPlan]}</bdi>
            </>
          )}
        </Button>

        <p className="text-center text-xs font-medium text-muted-foreground">
          {t("exam.paywall.trust")}
        </p>
      </DialogContent>
    </Dialog>
  );
}