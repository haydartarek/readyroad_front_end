"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpenCheck,
  CheckCircle2,
  Languages,
  ShieldCheck,
} from "lucide-react";

import Link from "@/components/localized-link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import {
  isPurchaseId,
  resumeCheckout,
} from "@/services/paymentService";

const BENEFIT_KEYS = [
  "payment.cancel_benefit_questions",
  "payment.cancel_benefit_exam",
  "payment.cancel_benefit_explanations",
  "payment.cancel_benefit_languages",
] as const;

export function CheckoutCancel({ expired = false }: { expired?: boolean }) {
  const { t, isRTL } = useLanguage();
  const searchParams = useSearchParams();

  const [resuming, setResuming] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const title = expired
    ? t("payment.expired_recovery_title")
    : t("payment.cancel_recovery_title");

  const description = expired
    ? t("payment.expired_recovery_text")
    : t("payment.cancel_recovery_text");

  async function handleResumeCheckout() {
    if (resuming) return;

    const purchaseId = searchParams.get("purchaseId");

    if (!isPurchaseId(purchaseId)) {
      setResumeError("payment.expired");
      return;
    }

    setResuming(true);
    setResumeError(null);

    try {
      const checkout = await resumeCheckout(purchaseId);
      window.location.assign(checkout.checkoutUrl);
    } catch (err) {
      const status = (
        err as { response?: { status?: number } }
      ).response?.status;

      if (status === 404 || status === 409 || status === 410) {
        setResumeError("payment.expired");
      } else {
        setResumeError("payment.checkout_error");
      }
    } finally {
      setResuming(false);
    }
  }

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="relative overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background px-4 py-8 sm:px-6 lg:py-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 start-1/4 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-5xl">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>

          <p
            role="status"
            className="mx-auto mt-3 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg"
          >
            {description}
          </p>
        </div>

        <div className="mx-auto mt-6 max-w-4xl rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <BookOpenCheck
              className="h-6 w-6 text-primary"
              aria-hidden
            />

            <h2 className="text-xl font-extrabold text-foreground">
              {t("payment.cancel_value_title")}
            </h2>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {BENEFIT_KEYS.map((key, index) => (
              <div
                key={key}
                className="flex items-start gap-3 rounded-2xl border bg-background/70 p-3.5"
              >
                {index === 3 ? (
                  <Languages
                    className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                    aria-hidden
                  />
                ) : (
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                    aria-hidden
                  />
                )}

                <span className="font-medium leading-7 text-foreground">
                  {t(key)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-primary/5 p-3.5">
            <ShieldCheck
              className="mt-0.5 h-5 w-5 shrink-0 text-primary"
              aria-hidden
            />

            <p className="font-medium leading-7 text-foreground">
              {t("payment.one_time")}
            </p>
          </div>

          {resumeError && (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-center text-sm font-medium text-destructive"
            >
              {t(resumeError)}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="min-w-52 font-bold"
            >
              <Link href="/#pricing">
                {t("payment.cancel_primary")}
              </Link>
            </Button>

            {!expired && (
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="min-w-52 font-bold"
                disabled={resuming}
                onClick={handleResumeCheckout}
              >
                {resuming && (
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden
                  />
                )}

                {resuming
                  ? t("payment.opening")
                  : t("payment.cancel_secondary")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}