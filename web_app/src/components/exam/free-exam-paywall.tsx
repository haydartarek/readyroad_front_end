"use client";

import { useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

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

export function FreeExamPaywall({
  open,
  examId,
  onOpenChange,
}: {
  open: boolean;
  examId: number;
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

      window.location.assign(
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
        className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">
            {t("exam.paywall.title")}
          </DialogTitle>

          <DialogDescription className="text-sm leading-6">
            {t("exam.paywall.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold">
          <span className="inline-flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {t("exam.paywall.answers_saved")}
          </span>
        </div>

        <div>
          <p className="mb-3 text-sm font-black">
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
                    "relative rounded-2xl border-2 px-4 py-4 text-start transition",
                    selected
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border bg-card hover:border-primary/40",
                  ].join(" ")}
                >
                  {recommended ? (
                    <span className="absolute -top-3 end-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-black text-primary-foreground">
                      {t(
                        "exam.paywall.recommended",
                      )}
                    </span>
                  ) : null}

                  <p className="font-black">
                    {t(`payment.plan.${plan}`)}
                  </p>

                  <p className="mt-2 text-2xl font-black text-primary">
                    {PRICE_BY_PLAN[plan]}
                  </p>
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
          className="w-full"
          disabled={
            busy ||
            !PAYMENTS_ENABLED
          }
          onClick={() =>
            void continueToCheckout()
          }
        >
          {t(
            busy
              ? "payment.opening"
              : "exam.paywall.continue",
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {t("payment.one_time")}
        </p>
      </DialogContent>
    </Dialog>
  );
}