"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Crown, ShieldCheck, WalletCards } from "lucide-react";

import Link from "@/components/localized-link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import {
  getAccountAccess,
  type AccountAccess,
} from "@/services/paymentService";

function remainingParts(expiresAt: string, now: number) {
  const remainingMs = Math.max(0, new Date(expiresAt).getTime() - now);
  const totalHours = Math.floor(remainingMs / 3_600_000);

  return {
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
  };
}

export function AccountAccessCard() {
  const { language, t, isRTL } = useLanguage();
  const [access, setAccess] = useState<AccountAccess | null>(null);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const abort = new AbortController();
    let active = true;

    getAccountAccess(abort.signal)
      .then((result) => {
        if (!active) return;
        setAccess(result);
        setFailed(false);
      })
      .catch(() => {
        if (!active) return;
        setFailed(true);
      });

    return () => {
      active = false;
      abort.abort();
    };
  }, []);

  useEffect(() => {
    if (!access?.active) return;

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [access?.active]);

  const expiryLabel = useMemo(() => {
    if (!access?.active || !access.expiresAt) return "—";

    return new Intl.DateTimeFormat(`${language}-u-ca-gregory`, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Brussels",
    }).format(new Date(access.expiresAt));
  }, [access, language]);

  if (!access && !failed) {
    return (
      <section
        data-testid="account-access-card"
        aria-label={t("account_access.title")}
        className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
      >
        <p className="text-sm font-semibold text-muted-foreground">
          {t("account_access.loading")}
        </p>
      </section>
    );
  }

  if (failed || !access) {
    return (
      <section
        data-testid="account-access-card"
        aria-label={t("account_access.title")}
        className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
      >
        <p className="text-sm font-semibold text-muted-foreground">
          {t("account_access.unavailable")}
        </p>
      </section>
    );
  }

  const isPaid = access.active && Boolean(access.expiresAt);
  const remaining =
    isPaid && access.expiresAt
      ? remainingParts(access.expiresAt, now)
      : null;
  const planLabel =
    isPaid && access.plan
      ? t(`payment.plan.${access.plan}`)
      : "—";

  return (
    <section
      data-testid="account-access-card"
      dir={isRTL ? "rtl" : "ltr"}
      className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/25 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            {isPaid ? (
              <Crown className="h-4 w-4" aria-hidden />
            ) : (
              <WalletCards className="h-4 w-4" aria-hidden />
            )}
          </span>

          <div className="min-w-0">
            <h2 className="font-black text-foreground">
              {t("account_access.title")}
            </h2>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {isPaid
                ? t("account_access.active_hint")
                : t("account_access.free_hint")}
            </p>
          </div>
        </div>

        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black text-primary">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          {t(isPaid ? "account_access.paid" : "account_access.free")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border/60 sm:grid-cols-4">
        <div className="bg-card px-4 py-3">
          <p className="text-[11px] font-semibold text-muted-foreground">
            {t("account_access.account_type")}
          </p>
          <p className="mt-1 text-sm font-black text-foreground">
            {t(isPaid ? "account_access.paid" : "account_access.free")}
          </p>
        </div>

        <div className="bg-card px-4 py-3">
          <p className="text-[11px] font-semibold text-muted-foreground">
            {t("account_access.plan")}
          </p>
          <p className="mt-1 text-sm font-black text-foreground">
            {planLabel}
          </p>
        </div>

        <div className="bg-card px-4 py-3">
          <p className="text-[11px] font-semibold text-muted-foreground">
            {t("account_access.remaining")}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-black text-foreground">
            <Clock3 className="h-3.5 w-3.5 text-primary" aria-hidden />
            {remaining
              ? t("account_access.remaining_value", remaining)
              : "—"}
          </p>
        </div>

        <div className="bg-card px-4 py-3">
          <p className="text-[11px] font-semibold text-muted-foreground">
            {t("account_access.expires")}
          </p>
          <p className="mt-1 text-sm font-black text-foreground">
            {expiryLabel}
          </p>
        </div>
      </div>

      <div className="flex justify-end px-4 py-3 sm:px-5">
        <Button asChild size="sm" variant={isPaid ? "outline" : "default"}>
          <Link href="/#pricing">
            {t(
              isPaid
                ? "account_access.extend"
                : "account_access.view_packages",
            )}
          </Link>
        </Button>
      </div>
    </section>
  );
}
