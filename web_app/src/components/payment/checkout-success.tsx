"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "@/components/localized-link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import {
  forgetCheckoutRequest,
  forgetExamCheckoutResume,
  getPurchaseStatus,
  isPurchaseId,
  readExamCheckoutResume,
  type PurchaseStatus,
} from "@/services/paymentService";
import { useLocalizedRouter } from "@/hooks/use-localized-router";

export function CheckoutSuccess() {
  const params = useSearchParams();
  const purchaseId = params.get("purchaseId");
  const { user, isLoading } = useAuth();
  return <PurchaseConfirmation key={`${purchaseId}:${user?.username}`} purchaseId={purchaseId}
    username={user?.username} isAuthLoading={isLoading} />;
}

function PurchaseConfirmation({ purchaseId, username, isAuthLoading }: {
  purchaseId: string | null; username?: string; isAuthLoading: boolean;
}) {
  const { language, t, isRTL } = useLanguage();
  const { replace } = useLocalizedRouter();
  const [purchase, setPurchase] = useState<PurchaseStatus | null>(null);
  const [state, setState] = useState<"confirming" | "waiting" | "invalid" | "login">("confirming");

  useEffect(() => {
    if (!isPurchaseId(purchaseId) || isAuthLoading) return;
    const abort = new AbortController();
    let active = true;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    const deadline = setTimeout(() => {
      active = false;
      abort.abort();
      clearTimeout(pollTimer);
      setState("waiting");
    }, 15_000);

    async function poll() {
      try {
        const result = await getPurchaseStatus(purchaseId!, abort.signal);
        if (!active) return;
        setPurchase(result);
        if (result.status !== "PENDING") {
          active = false;
          clearTimeout(deadline);

          if (username) {
            forgetCheckoutRequest(
              username,
              result.plan,
            );
          }

          if (result.status === "PAID") {
            const resumeExamId =
              readExamCheckoutResume(purchaseId!);

            if (resumeExamId) {
              forgetExamCheckoutResume(purchaseId!);
              replace(`/exam/${resumeExamId}`);
            }
          }

          return;
        }
      } catch (err) {
        if (!active) return;
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 401 || status === 403 || status === 404) {
          active = false;
          clearTimeout(deadline);
          setState(status === 401 ? "login" : "invalid");
          return;
        }
      }
      if (active) pollTimer = setTimeout(() => void poll(), 1500);
    }
    void poll();
    return () => { active = false; clearTimeout(deadline); clearTimeout(pollTimer); abort.abort(); };
  }, [purchaseId, username, isAuthLoading, replace]);

  const invalid = !isPurchaseId(purchaseId) || state === "invalid";
  const paid = !invalid && purchase?.status === "PAID";
  const failed = purchase?.status === "FAILED" || purchase?.status === "REFUNDED";
  const message = invalid ? "payment.expired" : paid ? "payment.success"
    : failed ? "payment.failed" : state === "login" ? "payment.login_required"
    : state === "waiting" ? "payment.still_confirming" : "payment.confirming";

  return (
    <main dir={isRTL ? "rtl" : "ltr"} className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">{t("payment.checkout_title")}</h1>
      <p role="status" className="mt-6 text-lg">{t(message)}</p>
      {paid && purchase && (
        <>
          <p className="mt-4 font-semibold">{t(`payment.plan.${purchase.plan}`)}</p>
          {purchase.expiresAt && <p className="mt-2">{t("payment.expires", {
            date: new Intl.DateTimeFormat(language, { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Brussels" }).format(new Date(purchase.expiresAt)),
          })}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild><Link href="/practice">{t("payment.training")}</Link></Button>
            <Button asChild><Link href="/exam">{t("payment.exam")}</Link></Button>
          </div>
        </>
      )}
      {(invalid || failed) && <Button asChild className="mt-6"><Link href="/plans">{t("payment.back_to_plans")}</Link></Button>}
      {state === "login" && <Button asChild className="mt-6"><Link href={`/login?returnUrl=${encodeURIComponent(`/checkout/success?purchaseId=${purchaseId}`)}`}>{t("payment.login")}</Link></Button>}
      <p className="mt-6"><Link className="text-primary underline underline-offset-4" href="/dashboard">{t("payment.dashboard")}</Link></p>
    </main>
  );
}
