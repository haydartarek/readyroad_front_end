"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "@/components/localized-link";
import {
  CheckCircle,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { ROUTES } from "@/lib/constants";
import { apiClient } from "@/lib/api";
import { AuthPageFrame } from "@/components/auth/auth-page-frame";
import { AuthShowcasePanel } from "@/components/auth/auth-showcase-panel";
import { PageLoading } from "@/components/ui/page-loading";
import { cn } from "@/lib/utils";

function ResetPasswordForm() {
  const { t, isRTL } = useLanguage();
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorField, setErrorField] = useState<
    "newPassword" | "confirmPassword" | null
  >(null);

  useEffect(() => {
    setToken(searchParams.get("token"));
  }, [searchParams]);

  if (token === undefined) {
    return <PageLoading />;
  }

  const showcase = (
    <AuthShowcasePanel
      badge={t("auth.forgot_panel_badge")}
      title={t("auth.reset_panel_heading")}
      titleAccent={t("auth.reset_panel_heading2")}
      description={t("auth.reset_panel_subtitle")}
      supportingText={t("auth.panel_learners_text")}
      features={[
        { icon: KeyRound, label: t("auth.reset_feat_1") },
        { icon: ShieldCheck, label: t("auth.reset_feat_2") },
        { icon: Lock, label: t("auth.reset_feat_3") },
      ]}
    />
  );

  if (!token) {
    return (
      <AuthPageFrame
        showcase={showcase}
        title={t("auth.reset_password_invalid_token")}
        subtitle={t("auth.reset_password_invalid_token")}
      >
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Lock className="h-9 w-9" />
          </div>
          <Button
            asChild
            variant="outline"
            className="h-12 w-full rounded-2xl font-semibold"
          >
            <Link href={ROUTES.FORGOT_PASSWORD}>
              {t("auth.forgot_password_back")}
            </Link>
          </Button>
        </div>
      </AuthPageFrame>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrorField(null);

    if (newPassword !== confirmPassword) {
      setError(t("auth.reset_password_mismatch"));
      setErrorField("confirmPassword");
      requestAnimationFrame(() => {
        document.getElementById("confirmPassword")?.focus();
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post("/auth/reset-password", { token, newPassword });
      setSuccess(true);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string } } })
        ?.response?.data;
      setError(data?.error ?? t("auth.reset_password_invalid_token"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageFrame
      showcase={showcase}
      title={
        success
          ? t("auth.reset_password_success_title")
          : t("auth.reset_password_title")
      }
      subtitle={
        success
          ? t("auth.reset_password_success_desc")
          : t("auth.reset_password_desc")
      }
      maxWidthClassName="max-w-md"
      footer={
        <p className="text-center text-xs text-muted-foreground/80">
          © {new Date().getFullYear()} {t("app.name")}. {t("auth.copyright")}
        </p>
      }
    >
      {success ? (
        <div
          role="status"
          aria-live="polite"
          className="space-y-6 text-center"
        >
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>
          <Button
            asChild
            className="h-12 w-full rounded-2xl text-base font-bold"
          >
            <Link href={ROUTES.LOGIN}>{t("auth.reset_password_go_login")}</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error ? (
            <Alert
              id="reset-password-error"
              variant="destructive"
              className="rounded-2xl border-destructive/20 bg-destructive/5 text-sm"
            >
              {error}
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-semibold">
              {t("auth.reset_password_new_label")}
            </Label>
            <div className="relative">
              <Lock
                className={cn(
                  "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                  isRTL ? "right-3" : "left-3",
                )}
              />
              <Input
                id="newPassword"
                name="newPassword"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errorField === "newPassword") {
                    setError("");
                    setErrorField(null);
                  }
                }}
                className={cn(
                  "h-12 rounded-2xl border-border/60 shadow-sm",
                  isRTL ? "pl-12 pr-10" : "pl-10 pr-12",
                )}
                disabled={isLoading}
                minLength={8}
                required
                aria-invalid={errorField === "newPassword"}
                aria-describedby={
                  errorField === "newPassword"
                    ? "reset-password-error"
                    : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowNew((value) => !value)}
                aria-label={
                  showNew ? t("auth.hide_password") : t("auth.show_password")
                }
                aria-pressed={showNew}
                className={cn(
                  "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isRTL ? "left-0.5" : "right-0.5",
                )}
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold">
              {t("auth.reset_password_confirm_label")}
            </Label>
            <div className="relative">
              <Lock
                className={cn(
                  "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                  isRTL ? "right-3" : "left-3",
                )}
              />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorField === "confirmPassword") {
                    setError("");
                    setErrorField(null);
                  }
                }}
                className={cn(
                  "h-12 rounded-2xl border-border/60 shadow-sm",
                  isRTL ? "pl-12 pr-10" : "pl-10 pr-12",
                )}
                disabled={isLoading}
                minLength={8}
                required
                aria-invalid={errorField === "confirmPassword"}
                aria-describedby={
                  errorField === "confirmPassword"
                    ? "reset-password-error"
                    : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowConfirm((value) => !value)}
                aria-label={
                  showConfirm
                    ? t("auth.hide_password")
                    : t("auth.show_password")
                }
                aria-pressed={showConfirm}
                className={cn(
                  "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isRTL ? "left-0.5" : "right-0.5",
                )}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25"
            disabled={isLoading}
          >
            {isLoading
              ? t("auth.reset_password_updating")
              : t("auth.reset_password_submit")}
          </Button>
        </form>
      )}
    </AuthPageFrame>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
