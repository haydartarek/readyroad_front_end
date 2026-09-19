"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useLocalizedRouter } from "@/hooks/use-localized-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkoutRequestId, createCheckout, forgetCheckoutRequest, PAYMENTS_ENABLED, PAYMENT_PLANS, type PaymentPlan } from "@/services/paymentService";

export function PlanSelection() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { language, t, isRTL } = useLanguage();
  const router = useLocalizedRouter();
  const [busy, setBusy] = useState<PaymentPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);

  async function choose(plan: PaymentPlan) {
    if (!PAYMENTS_ENABLED || submitting.current) return;
    if (!isAuthenticated || !user) {
      router.push("/login?returnUrl=%2Fplans");
      return;
    }
    submitting.current = true;
    setBusy(plan);
    setError(null);
    try {
      const id = checkoutRequestId(user.username, plan);
      const checkout = await createCheckout(plan, id, language);
      window.location.assign(checkout.checkoutUrl);
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 409 || status === 410) {
        forgetCheckoutRequest(user.username, plan);
        setError("payment.expired");
      } else {
        setError("payment.checkout_error");
      }
    } finally {
      submitting.current = false;
      setBusy(null);
    }
  }

  return (
    <main dir={isRTL ? "rtl" : "ltr"} className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">{t("payment.plans_title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("payment.one_time")}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t("payment.price_at_checkout")}</p>
      {error && <p role="alert" className="mt-6 rounded-xl border border-destructive/40 p-4">{t(error)}</p>}
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {PAYMENT_PLANS.map((plan) => (
          <Card key={plan}>
            <CardHeader><CardTitle>{t(`payment.plan.${plan}`)}</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-6 text-sm text-muted-foreground">{t("payment.extension")}</p>
              <Button className="w-full whitespace-normal" disabled={!PAYMENTS_ENABLED || isLoading || busy !== null} onClick={() => void choose(plan)}>
                {t(busy === plan ? "payment.opening" : "payment.choose")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
