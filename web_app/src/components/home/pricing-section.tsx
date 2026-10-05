"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLocalizedRouter } from "@/hooks/use-localized-router";

import {
  ArrowRight,
  Banknote,
  CalendarX2,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import {
  PlanIdentity,
  RecommendedPlanAccent,
  RecommendedPlanBadge,
  RECOMMENDED_PAYMENT_PLAN,
} from "@/components/payment/plan-identity";
import {
  checkoutRequestId,
  createCheckout,
  forgetCheckoutRequest,
  PAYMENTS_ENABLED,
  PAYMENT_PLANS,
  type PaymentPlan,
} from "@/services/paymentService";

const PRICE_BY_PLAN: Record<PaymentPlan, string> = {
  RIJVIA_3_DAYS: "\u20AC2.99",
  RIJVIA_1_WEEK: "\u20AC6.99",
  RIJVIA_4_WEEKS: "\u20AC14.99",
};

const FEATURES = [
  "home.pricing.feature_questions",
  "home.pricing.feature_exam",
  "home.pricing.feature_explanations",
  "home.pricing.feature_progress",
  "home.pricing.feature_languages",
] as const;

const PENDING_PLAN_KEY = "rijvia.pendingCheckoutPlan";

export function PricingSection({ resumeCheckout = false }: { resumeCheckout?: boolean }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { language, t, isRTL } = useLanguage();
  const router = useLocalizedRouter();

  const [busy, setBusy] = useState<PaymentPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);

  useEffect(() => {
    if (window.location.hash !== "#pricing") return;

    const timeout = window.setTimeout(() => {
      document.getElementById("pricing")?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    }, 100);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!resumeCheckout || isLoading || submitting.current) return;

    if (!PAYMENTS_ENABLED) {
      router.replace("/#pricing");
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace("/#pricing");
      return;
    }

    let storedPlan: string | null = null;

    try {
      storedPlan = sessionStorage.getItem(PENDING_PLAN_KEY);
    } catch {
      router.replace("/#pricing");
      return;
    }

    if (
      !storedPlan ||
      !(PAYMENT_PLANS as readonly string[]).includes(storedPlan)
    ) {
      try {
        sessionStorage.removeItem(PENDING_PLAN_KEY);
      } catch {
        // Nothing to clean up.
      }

      router.replace("/#pricing");
      return;
    }

    const plan = storedPlan as PaymentPlan;

    try {
      sessionStorage.removeItem(PENDING_PLAN_KEY);
    } catch {
      // The checkout can still continue.
    }

    submitting.current = true;
    setBusy(plan);
    setError(null);

    const continueCheckout = async () => {
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
    };

    void continueCheckout();
  }, [
    resumeCheckout,
    isLoading,
    isAuthenticated,
    user,
    language,
    router,
  ]);

  async function choose(plan: PaymentPlan) {
    if (!PAYMENTS_ENABLED || submitting.current) return;

    if (!isAuthenticated || !user) {
      try {
        sessionStorage.setItem(PENDING_PLAN_KEY, plan);
      } catch {
        // If storage is unavailable, the user can choose the plan again after login.
      }

      router.push("/login?returnUrl=%2F%3FresumeCheckout%3D1%23pricing");
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

  if (resumeCheckout && !error) {
    return (
      <section
        id="pricing"
        dir={isRTL ? "rtl" : "ltr"}
        className="relative flex min-h-[70vh] scroll-mt-24 items-center bg-background py-16"
      >
        <div className="rv-container flex justify-center">
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-8 py-10 text-center shadow-sm"
          >
            <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" aria-hidden />

            <p className="text-base font-bold text-foreground">
              {t("payment.opening")}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background py-14 sm:py-16 lg:py-20"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 start-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 end-1/4 h-96 w-96 rounded-full bg-secondary/10 blur-3xl"
      />

      <div className="rv-container relative">
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <h2
            id="pricing-heading"
            className="text-balance text-3xl font-black leading-tight tracking-tight text-secondary sm:text-4xl"
          >
            {t("home.pricing.title")}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            {t("home.pricing.subtitle")}
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-semibold text-muted-foreground sm:text-sm">
            <span className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-center leading-4 shadow-sm sm:gap-2 sm:px-4">
              <Banknote className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              {t("home.pricing.one_time")}
            </span>

            <span className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-center leading-4 shadow-sm sm:gap-2 sm:px-4">
              <CalendarX2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              {t("home.pricing.no_renewal")}
            </span>

            <span className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-center leading-4 shadow-sm sm:gap-2 sm:px-4">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              {t("home.pricing.secure")}
            </span>
          </div>
        </div>

        <ul className="mx-auto mb-5 grid max-w-3xl grid-cols-1 gap-2 rounded-2xl border bg-card/70 p-3 text-xs font-semibold text-foreground/80 shadow-sm sm:grid-cols-2 sm:p-4 md:text-sm xl:hidden">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span>{t(feature)}</span>
            </li>
          ))}
        </ul>

        {error && (
          <p
            role="alert"
            className="mx-auto mb-6 max-w-2xl rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-center text-sm font-semibold text-destructive"
          >
            {t(error)}
          </p>
        )}

        <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3 xl:gap-5">
          {PAYMENT_PLANS.map((plan) => {
            const featured = plan === RECOMMENDED_PAYMENT_PLAN;

            return (
              <article
                key={plan}
                className={[
                  "group relative flex h-full min-w-0 flex-col overflow-visible rounded-2xl border px-4 pb-4 pt-8 transition-all duration-300 sm:px-5 md:rounded-[20px] xl:rounded-[24px] xl:px-5 xl:pb-5 xl:pt-8",
                  "hover:-translate-y-0.5 hover:shadow-lg xl:hover:-translate-y-1 xl:hover:shadow-xl",
                  featured
                    ? "order-first z-10 border-secondary bg-secondary text-secondary-foreground shadow-xl shadow-secondary/20 md:col-span-2 xl:order-none xl:col-span-1"
                    : "border-border bg-card text-card-foreground shadow-sm hover:border-primary/25 hover:shadow-primary/10",
                ].join(" ")}
              >
                {featured && (
                  <RecommendedPlanAccent />
                )}

                {featured && (
                  <RecommendedPlanBadge
                    label={t("home.pricing.recommended")}
                    variant="floating"
                  />
                )}

                <PlanIdentity
                  plan={plan}
                  label={t(`payment.plan.${plan}`)}
                  featured={featured}
                  variant="home"
                  labelAs="h3"
                />

                <div className="mb-3 text-center xl:mb-4">
                  <bdi
                    dir="ltr"
                    className={[
                      "block text-3xl font-black tracking-tight sm:text-4xl",
                      featured
                        ? "text-secondary-foreground"
                        : "text-secondary",
                    ].join(" ")}
                  >
                    {PRICE_BY_PLAN[plan]}
                  </bdi>

                  <bdi
                    dir="ltr"
                    className={[
                      "mt-1 block text-xs font-bold sm:text-sm xl:text-xs",
                      featured
                        ? "text-secondary-foreground/80"
                        : "text-primary",
                    ].join(" ")}
                  >
                    {t(`home.pricing.per_day.${plan}`)}
                  </bdi>

                  <p
                    className={[
                      "mx-auto mt-2 block max-w-[28rem] text-center text-sm font-bold leading-relaxed",
                      featured
                        ? "text-secondary-foreground"
                        : "text-foreground",
                    ].join(" ")}
                  >
                    {t(`home.pricing.tagline.${plan}`)}
                  </p>
                </div>

                <div
                  className={[
                    "hidden h-px w-full xl:mb-4 xl:block",
                    featured ? "bg-white/10" : "bg-border",
                  ].join(" ")}
                />

                <ul className="hidden xl:mb-5 xl:block xl:space-y-2">
                  {FEATURES.map((feature) => (
                    <li
                      key={feature}
                      className={[
                        "flex items-start gap-2.5 text-xs font-semibold leading-5",
                        featured
                          ? "text-secondary-foreground/85"
                          : "text-foreground/80",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
                          featured
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-primary",
                        ].join(" ")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      </span>

                      {t(feature)}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={!PAYMENTS_ENABLED || isLoading || busy !== null}
                  onClick={() => void choose(plan)}
                  aria-label={`${t("home.pricing.choose")}: ${t(
                    `payment.plan.${plan}`,
                  )}`}
                  className={[
                    "mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition-all xl:mt-auto",
                    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    featured
                      ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg"
                      : "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90 hover:shadow-md",
                  ].join(" ")}
                >
                  {t(
                    busy === plan
                      ? "payment.opening"
                      : "home.pricing.choose",
                  )}

                  <ArrowRight
                    className={[
                      "h-4 w-4 transition-transform",
                      isRTL
                        ? "rotate-180 group-hover:-translate-x-0.5"
                        : "group-hover:translate-x-0.5",
                    ].join(" ")}
                    aria-hidden
                  />
                </button>
              </article>
            );
          })}
        </div>

        <p className="mx-auto mt-4 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground lg:mt-6 lg:text-sm">
          {t("home.pricing.extension_note")}
        </p>
      </div>
    </section>
  );
}
