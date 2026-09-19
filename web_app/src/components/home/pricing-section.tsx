"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLocalizedRouter } from "@/hooks/use-localized-router";

import {
  ArrowRight,
  CalendarCheck,
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
  const iconClass = "h-5 w-5";

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
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background py-16 lg:py-24"
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
        <div className="mx-auto mb-10 max-w-3xl text-center lg:mb-14">
          <h2
            id="pricing-heading"
            className="text-balance text-3xl font-extrabold tracking-tight text-secondary md:text-4xl lg:text-5xl"
          >
            {t("home.pricing.title")}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("home.pricing.subtitle")}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
              {t("home.pricing.one_time")}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
              {t("home.pricing.no_renewal")}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
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

        <div className="mx-auto grid max-w-6xl items-stretch gap-5 lg:grid-cols-3 lg:gap-6">
          {PAYMENT_PLANS.map((plan) => {
            const featured = plan === "RIJVIA_1_WEEK";

            return (
              <article
                key={plan}
                className={[
                  "group relative flex h-full flex-col overflow-hidden rounded-[28px] border p-6 transition-all duration-300 md:p-7",
                  "hover:-translate-y-1 hover:shadow-xl",
                  featured
                    ? "border-secondary bg-secondary text-secondary-foreground shadow-xl shadow-secondary/15 lg:-translate-y-2"
                    : "border-border bg-card text-card-foreground shadow-sm hover:border-primary/25 hover:shadow-primary/10",
                ].join(" ")}
              >
                {featured && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
                )}

                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={[
                        "grid h-10 w-10 shrink-0 place-items-center rounded-xl border",
                        featured
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-primary/15 bg-primary/10 text-primary",
                      ].join(" ")}
                    >
                      <PlanIcon plan={plan} />
                    </div>

                    <h3
                      className={[
                        "text-xl font-extrabold",
                        featured
                          ? "text-secondary-foreground"
                          : "text-secondary",
                      ].join(" ")}
                    >
                      {t(`payment.plan.${plan}`)}
                    </h3>
                  </div>

                  {featured && (
                    <span className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground shadow-sm">
                      {t("home.pricing.popular")}
                    </span>
                  )}
                </div>

                <div className="mb-6 text-center">
                  <div
                    className={[
                      "text-5xl font-black tracking-tight md:text-6xl",
                      featured
                        ? "text-secondary-foreground"
                        : "text-secondary",
                    ].join(" ")}
                  >
                    {PRICE_BY_PLAN[plan]}
                  </div>

                  <p
                    className={[
                      "mt-2 text-sm font-semibold",
                      featured
                        ? "text-primary"
                        : "text-primary",
                    ].join(" ")}
                  >
                    {t(`home.pricing.per_day.${plan}`)}
                  </p>

                  <p
                    className={[
                      "mt-4 text-center text-base font-bold leading-relaxed",
                      featured
                        ? "text-secondary-foreground"
                        : "text-foreground",
                    ].join(" ")}
                  >
                    {t(`home.pricing.access.${plan}`)}
                  </p>
                </div>

                <div
                  className={[
                    "mb-7 h-px w-full",
                    featured ? "bg-white/10" : "bg-border",
                  ].join(" ")}
                />

                <ul className="mb-8 space-y-3.5">
                  {FEATURES.map((feature) => (
                    <li
                      key={feature}
                      className={[
                        "flex items-start gap-3 text-sm font-semibold leading-6",
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
                    "mt-auto inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-extrabold transition-all",
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

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
          {t("home.pricing.extension_note")}
        </p>
      </div>
    </section>
  );
}