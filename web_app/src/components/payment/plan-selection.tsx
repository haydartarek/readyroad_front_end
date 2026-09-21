"use client";

import { useRef, useState } from "react";
import { CalendarCheck, Trophy, Zap } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useLocalizedRouter } from "@/hooks/use-localized-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkoutRequestId, createCheckout, forgetCheckoutRequest, PAYMENTS_ENABLED, PAYMENT_PLANS, type PaymentPlan } from "@/services/paymentService";

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
        {PAYMENT_PLANS.map((plan) => {
          const featured = plan === "RIJVIA_1_WEEK";

          return (
            <Card
              key={plan}
              className={[
                "relative overflow-hidden",
                featured ? "border-primary shadow-md" : "",
              ].join(" ")}
            >
              {featured ? (
                <span className="absolute end-4 top-4 rounded-full bg-primary px-2.5 py-1 text-xs font-black text-primary-foreground">
                  {t("home.pricing.recommended")}
                </span>
              ) : null}

              <CardHeader className="items-center text-center">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                  <PlanIcon plan={plan} />
                </span>

                <CardTitle className="text-center text-2xl font-black">
                  {t(`payment.plan.${plan}`)}
                </CardTitle>
              </CardHeader>

              <CardContent className="text-center">
                <p className="min-h-10 text-sm font-medium text-muted-foreground">
                  {t(`home.pricing.tagline.${plan}`)}
                </p>

                <bdi
                  dir="ltr"
                  className="mt-5 block text-4xl font-black text-primary"
                >
                  {PRICE_BY_PLAN[plan]}
                </bdi>

                <bdi
                  dir="ltr"
                  className="mt-1 block text-sm font-semibold text-muted-foreground"
                >
                  {t(`home.pricing.per_day.${plan}`)}
                </bdi>

                <p className="my-5 text-sm text-muted-foreground">
                  {t("payment.extension")}
                </p>

                <Button
                  className="w-full whitespace-normal"
                  disabled={!PAYMENTS_ENABLED || isLoading || busy !== null}
                  onClick={() => void choose(plan)}
                >
                  {t(busy === plan ? "payment.opening" : "payment.choose")}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
