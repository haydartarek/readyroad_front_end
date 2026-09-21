"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLocalizedRouter } from "@/hooks/use-localized-router";

import {
  ArrowRight,
  Banknote,
  CalendarCheck,
  CalendarX2,
  CheckCircle2,
  ShieldCheck,
  Trophy,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
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
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background py-10 sm:py-12 lg:py-16"
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
        <div className="mx-auto mb-6 max-w-3xl text-center lg:mb-8">
          <h2
            id="pricing-heading"
            className="text-balance text-3xl font-extrabold tracking-tight text-secondary md:text-4xl"
          >
            {t("home.pricing.title")}
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("home.pricing.subtitle")}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] font-semibold text-muted-foreground sm:text-sm">
            <span className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border bg-card px-2 py-2 text-center leading-4 shadow-sm sm:gap-2 sm:px-3">
              <Banknote className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              {t("home.pricing.one_time")}
            </span>

            <span className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border bg-card px-2 py-2 text-center leading-4 shadow-sm sm:gap-2 sm:px-3">
              <CalendarX2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              {t("home.pricing.no_renewal")}
            </span>

            <span className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border bg-card px-2 py-2 text-center leading-4 shadow-sm sm:gap-2 sm:px-3">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              {t("home.pricing.secure")}
            </span>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mx-auto mb-6 max-w-2xl rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-center text-sm font-semibold text-destructive"
          >
            {t(error)}
          </p>
        )}

        <div className="mx-auto grid max-w-6xl items-stretch gap-2.5 lg:grid-cols-3 lg:gap-5">
          {PAYMENT_PLANS.map((plan) => {
            const featured = plan === "RIJVIA_1_WEEK";

            return (
              <article
                key={plan}
                className={[
                  "group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 overflow-hidden rounded-2xl border px-3 pb-3 pt-3 transition-all duration-300 lg:flex lg:h-full lg:flex-col lg:rounded-[24px] lg:px-5 lg:pb-5 lg:pt-5",
                  "hover:-translate-y-0.5 hover:shadow-lg lg:hover:-translate-y-1 lg:hover:shadow-xl",
                  featured
                    ? "border-secondary bg-secondary pt-9 text-secondary-foreground shadow-lg shadow-secondary/15 lg:-translate-y-1 lg:pt-10"
                    : "border-border bg-card text-card-foreground shadow-sm hover:border-primary/25 hover:shadow-primary/10",
                ].join(" ")}
              >
                {featured && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
                )}

                {featured && (
                  <span className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground shadow-sm lg:top-3 lg:px-2.5 lg:py-1 lg:text-xs">
                    {t("home.pricing.recommended")}
                  </span>
                )}

                <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 text-start lg:mb-3 lg:flex-col lg:text-center">
                  <div
                    className={[
                      "grid h-7 w-7 shrink-0 place-items-center rounded-lg border lg:h-8 lg:w-8 lg:rounded-xl",
                      featured
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-primary/15 bg-primary/10 text-primary",
                    ].join(" ")}
                  >
                    <PlanIcon plan={plan} />
                  </div>

                  <h3
                    className={[
                      "mt-0 truncate text-start text-base font-black lg:mt-2 lg:text-center lg:text-xl",
                      featured
                        ? "text-secondary-foreground"
                        : "text-secondary",
                    ].join(" ")}
                  >
                    {t(`payment.plan.${plan}`)}
                  </h3>
                </div>

                <div className="col-start-2 row-start-1 row-span-2 text-end lg:mb-4 lg:text-center">
                  <bdi
                    dir="ltr"
                    className={[
                      "block text-xl font-black tracking-tight lg:text-4xl",
                      featured
                        ? "text-secondary-foreground"
                        : "text-secondary",
                    ].join(" ")}
                  >
                    {PRICE_BY_PLAN[plan]}
                  </bdi>

                  <bdi
                    dir="ltr"
                    className="mt-0.5 block text-[11px] font-semibold text-primary lg:mt-1 lg:text-xs"
                  >
                    {t(`home.pricing.per_day.${plan}`)}
                  </bdi>

                  <p
                    className={[
                      "hidden text-center font-bold leading-relaxed lg:mt-2 lg:block lg:text-sm",
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
                    "hidden h-px w-full lg:mb-4 lg:block",
                    featured ? "bg-white/10" : "bg-border",
                  ].join(" ")}
                />

                <ul className="hidden lg:mb-5 lg:block lg:space-y-2">
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
                    "col-span-2 mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold transition-all lg:mt-auto lg:h-11",
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