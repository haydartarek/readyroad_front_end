"use client";

import Link from "@/components/localized-link";
import { Cookie, ShieldCheck } from "lucide-react";
import { useCookieConsent } from "@/contexts/cookie-consent-context";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConsentToggleProps = {
  checked: boolean;
  disabled?: boolean;
  label: string;
  description: string;
  status: string;
  onChange?: (checked: boolean) => void;
};

function ConsentToggle({
  checked,
  disabled = false,
  label,
  description,
  status,
  onChange,
}: ConsentToggleProps) {
  const id = `consent-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 py-4 last:border-b-0">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-bold text-foreground">
          {label}
        </label>
        <p id={`${id}-description`} className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <label className="relative inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            aria-describedby={`${id}-description`}
            onChange={(event) => onChange?.(event.target.checked)}
            className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
          <span className="pointer-events-none h-6 w-11 rounded-full border border-border bg-muted transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:opacity-70 after:absolute after:start-[6px] after:top-1/2 after:h-4 after:w-4 after:-translate-y-1/2 after:rounded-full after:bg-background after:shadow-sm after:transition-transform peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5" />
        </label>
        <span className="text-sm font-semibold text-muted-foreground">
          {status}
        </span>
      </div>
    </div>
  );
}

export function CookieConsentManager() {
  const { t, isRTL } = useLanguage();
  const {
    consent,
    isSettingsOpen,
    draft,
    announcement,
    openSettings,
    closeSettings,
    setDraftCategory,
    acceptAll,
    rejectOptional,
    saveDraft,
  } = useCookieConsent();

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {!consent && (
        <section
          role="region"
          aria-label={t("consent.banner.label")}
          dir={isRTL ? "rtl" : "ltr"}
          className="readyroad-cookie-consent-banner fixed inset-x-3 bottom-3 z-40 mx-auto max-w-5xl rounded-lg border border-border bg-background p-4 shadow-2xl sm:inset-x-6 sm:p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-primary">
                <Cookie className="h-5 w-5" aria-hidden="true" />
                <h2 className="text-base font-bold text-foreground">
                  {t("consent.banner.title")}
                </h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("consent.banner.description")}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <Link className="font-semibold text-primary underline-offset-4 hover:underline" href="/cookie-policy">
                  {t("consent.cookie_policy")}
                </Link>
                <Link className="font-semibold text-primary underline-offset-4 hover:underline" href="/privacy-policy">
                  {t("consent.privacy_policy")}
                </Link>
              </div>
            </div>
            <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-3 lg:min-w-[430px]">
              <Button className="min-h-11" variant="outline" onClick={rejectOptional}>
                {t("consent.reject_optional")}
              </Button>
              <Button className="min-h-11" variant="outline" onClick={openSettings}>
                {t("consent.customize")}
              </Button>
              <Button className="min-h-11" onClick={acceptAll}>
                {t("consent.accept_all")}
              </Button>
            </div>
          </div>
        </section>
      )}

      <Dialog
        open={isSettingsOpen}
        onOpenChange={(open) => (open ? openSettings() : closeSettings())}
      >
        <DialogContent
          dir={isRTL ? "rtl" : "ltr"}
          className="max-h-[min(90vh,760px)] overflow-y-auto sm:max-w-xl"
        >
          <DialogHeader className="text-start">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              <DialogTitle>{t("consent.settings.title")}</DialogTitle>
            </div>
            <DialogDescription className="text-start leading-6">
              {t("consent.settings.description")}
            </DialogDescription>
          </DialogHeader>

          <div>
            <ConsentToggle
              checked
              disabled
              label={t("consent.category.necessary")}
              description={t("consent.category.necessary_description")}
              status={t("consent.always_active")}
            />
            <ConsentToggle
              checked={draft.preferences}
              label={t("consent.category.preferences")}
              description={t("consent.category.preferences_description")}
              status={draft.preferences ? t("consent.enabled") : t("consent.disabled")}
              onChange={(checked) => setDraftCategory("preferences", checked)}
            />
            <ConsentToggle
              checked={draft.analytics}
              label={t("consent.category.analytics")}
              description={t("consent.category.analytics_description")}
              status={draft.analytics ? t("consent.enabled") : t("consent.disabled")}
              onChange={(checked) => setDraftCategory("analytics", checked)}
            />
            <div className="flex items-start justify-between gap-4 py-4">
              <div>
                <p className="text-sm font-bold text-foreground">
                  {t("consent.category.marketing")}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t("consent.category.marketing_description")}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                {t("consent.not_used")}
              </span>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row sm:flex-wrap">
            <Button className="min-h-11" variant="ghost" onClick={closeSettings}>
              {t("common.cancel")}
            </Button>
            <Button className="min-h-11" variant="outline" onClick={rejectOptional}>
              {t("consent.reject_optional")}
            </Button>
            <Button className="min-h-11" variant="outline" onClick={acceptAll}>
              {t("consent.accept_all")}
            </Button>
            <Button className="min-h-11" onClick={saveDraft}>
              {t("consent.save_preferences")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
