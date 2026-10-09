"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { COOKIE_CONSENT_CHANGED_EVENT } from "@/lib/cookie-consent";
import {
  trackCheckoutAuthRequired,
  trackPlanSelected,
  trackPricingViewed,
} from "@/lib/payment-analytics";
import { useLocalizedRouter } from "@/hooks/use-localized-router";
import { Button } from "@/components/ui/button";
import {
  PlanIdentity,
  RecommendedPlanBadge,
  RECOMMENDED_PAYMENT_PLAN,
} from "@/components/payment/plan-identity";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { checkoutRequestId, createCheckout, forgetCheckoutRequest, PAYMENTS_ENABLED, PAYMENT_PLANS, type PaymentPlan } from "@/services/paymentService";

const PRICE_BY_PLAN: Record<PaymentPlan, string> = {
  RIJVIA_3_DAYS: "€2.99",
  RIJVIA_1_WEEK: "€6.99",
  RIJVIA_4_WEEKS: "€14.99",
};

export function PlanSelection() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { language, t, isRTL } = useLanguage();
  const router = useLocalizedRouter();
  const trackedView = useRef(false);
  const [busy, setBusy] = useState<PaymentPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);

  useEffect(() => {
    if (trackedView.current || typeof IntersectionObserver === "undefined") return;
    const cards = document.getElementById("rijvia-plan-selection-cards");
    if (!cards) return;
    let visible = false;
    const maybeTrack = () => {
      if (visible && !trackedView.current && trackPricingViewed(PAYMENT_PLANS)) {
        trackedView.current = true;
        observer.disconnect();
      }
    };
    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      maybeTrack();
    }, { threshold: 0.1 });
    observer.observe(cards);
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, maybeTrack);
    return () => {
      observer.disconnect();
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, maybeTrack);
    };
  }, []);

  async function choose(plan: PaymentPlan) {
    if (!PAYMENTS_ENABLED || submitting.current) return;
    trackPlanSelected(plan);
    if (!isAuthenticated || !user) {
      trackCheckoutAuthRequired(plan);
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
      <div id="rijvia-plan-selection-cards" className="mt-8 grid gap-5 md:grid-cols-3">
        {PAYMENT_PLANS.map((plan) => {
          const featured = plan === RECOMMENDED_PAYMENT_PLAN;

          return (
            <Card
              key={plan}
              className={[
                "relative overflow-hidden",
                featured ? "border-primary shadow-md" : "",
              ].join(" ")}
            >
              {featured ? (
                <RecommendedPlanBadge
                  label={t("home.pricing.recommended")}
                  variant="corner"
                />
              ) : null}

              <CardHeader className="text-center">
                <PlanIdentity
                  plan={plan}
                  label={t(`payment.plan.${plan}`)}
                  featured={featured}
                  variant="selection"
                  labelAs="h3"
                />
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
