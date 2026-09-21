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
        className="max-h-[calc(100dvh-0.75rem)] gap-2 overflow-y-auto p-3 sm:max-w-3xl sm:gap-3 sm:p-5"
      >
        <DialogHeader className={isRTL ? "text-right sm:text-right" : "text-left sm:text-left"}>
          <DialogTitle className="text-lg font-black sm:text-2xl">
            {t("exam.paywall.title")}
          </DialogTitle>

          <DialogDescription className={["text-xs leading-4 sm:text-sm sm:leading-5", isRTL ? "text-right" : "text-left"].join(" ")}>
            {t("exam.paywall.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-start text-xs font-semibold sm:px-4 sm:py-2.5 sm:text-sm">
          <span className="inline-flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {t("exam.paywall.answers_saved")}
          </span>
        </div>

        <div className="rounded-xl border bg-muted/30 px-3 py-2 sm:rounded-2xl sm:px-4 sm:py-3">
          <div className="flex items-end justify-between gap-4">
            <div className="text-start">
              <bdi
                dir="ltr"
                className="text-xl font-black tracking-tight text-foreground sm:text-2xl"
              >
                {safeCompletedQuestions} / {safeTotalQuestions}
              </bdi>

              <p className="mt-0.5 text-xs font-bold text-foreground sm:mt-1 sm:text-sm">
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
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted sm:mt-2 sm:h-2"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="mt-1 text-start text-[11px] font-medium text-muted-foreground sm:mt-1.5 sm:text-xs">
            {t("exam.paywall.remaining", {
              count: remainingQuestions,
            })}
          </p>
        </div>

        <div>
          <p className="mb-1 text-start text-xs font-black sm:mb-2 sm:text-sm">
            {t("exam.paywall.choose_plan")}
          </p>

          <div className="grid gap-2 md:grid-cols-3 md:gap-3">
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
                    "relative grid min-h-0 grid-cols-[1fr_auto] items-center gap-x-3 rounded-xl border-2 px-3 py-2 text-start transition md:flex md:min-h-[132px] md:flex-col md:items-stretch md:rounded-2xl md:px-3.5 md:py-4",
                    selected
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border bg-card hover:border-primary/40",
                  ].join(" ")}
                >
                  {recommended ? (
                    <span className="absolute -top-2 end-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground md:-top-3 md:end-3 md:px-2.5 md:py-1 md:text-[11px]">
                      {t("home.pricing.recommended")}
                    </span>
                  ) : null}

                  <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 md:gap-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-primary/15 bg-primary/10 text-primary md:h-7 md:w-7">
                      <PlanIcon plan={plan} />
                    </span>

                    <p className="truncate text-sm font-black md:text-base">
                      {t(`payment.plan.${plan}`)}
                    </p>
                  </div>

                  <p className="hidden text-sm leading-5 text-muted-foreground md:mt-2 md:block">
                    {t(`home.pricing.tagline.${plan}`)}
                  </p>

                  <bdi
                    dir="ltr"
                    className="col-start-2 row-start-1 self-center text-lg font-black text-primary md:mt-auto md:block md:self-auto md:pt-3 md:text-2xl"
                  >
                    {PRICE_BY_PLAN[plan]}
                  </bdi>

                  <bdi
                    dir="ltr"
                    className="col-start-2 row-start-2 self-start text-[11px] font-bold text-muted-foreground md:mt-1 md:block md:text-xs"
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

        <p className="text-center text-[11px] font-medium text-muted-foreground sm:text-xs">
          {t("exam.paywall.trust")}
        </p>
      </DialogContent>
    </Dialog>
  );
}