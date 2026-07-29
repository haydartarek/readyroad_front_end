"use client";

import { useLocalizedRouter } from "@/hooks/use-localized-router";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageHeroDescription,
  PageHeroSurface,
  PageHeroTitle,
  PageMetricCard,
} from "@/components/ui/page-surface";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { LANGUAGES } from "@/lib/constants";
import { isServiceUnavailable, logApiError } from "@/lib/api";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { getOverallProgress, updateProfile } from "@/services";
import { getCsrfToken } from "@/lib/auth-token";
import { cn } from "@/lib/utils";
import {
  User,
  Mail,
  AtSign,
  Globe,
  BarChart2,
  ShieldCheck,
  Pencil,
  Save,
  X,
  Trophy,
  Target,
  Flame,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { DeleteAccountModal } from "@/components/ui/delete-account-modal";
import {
  getSocialAuthErrorMessage,
  getSocialAuthSuccessMessage,
} from "@/lib/social-auth-feedback";

// ─── Section Header ──────────────────────────────────────

function SectionHeader({
  icon,
  title,
  color = "bg-primary/10 text-primary",
}: {
  icon: React.ReactNode;
  title: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}
      >
        {icon}
      </div>
      <CardTitle className="text-lg font-black">{title}</CardTitle>
    </div>
  );
}

function splitFullName(fullName?: string): {
  firstName: string;
  lastName: string;
} {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
  };
}

function buildFormData(
  user: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    username?: string;
  } | null,
) {
  const parsedName = splitFullName(user?.fullName);

  return {
    firstName: user?.firstName || parsedName.firstName,
    lastName: user?.lastName || parsedName.lastName,
    email: user?.email || "",
    username: user?.username || "",
  };
}

// ─── Page ────────────────────────────────────────────────

export function ProfilePageContent({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { user, fetchUser } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const router = useLocalizedRouter();
  const searchParams = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, username: "" });
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
      const csrfToken = getCsrfToken();
      const res = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: csrfToken ? { "x-csrf-token": csrfToken } : {},
      });
      if (res.ok) {
        setDeleteModal({
          open: true,
          username:
            (user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : user?.username) ?? "",
        });
        return;
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(
          (data as { message?: string }).message || t("profile.delete_error"),
        );
      }
    } catch {
      toast.error(t("profile.delete_error"));
    } finally {
      setIsDeleting(false);
    }
  };

  // Dynamic stats fetched from the backend
  const [stats, setStats] = useState({
    examsCount: 0,
    avgScore: 0,
    practiceCount: 0,
  });

  useEffect(() => {
    getOverallProgress()
      .then((data) => {
        setStats({
          examsCount: data.totalExamsTaken ?? 0,
          avgScore: data.overallAccuracy ?? 0,
          practiceCount: data.totalAttempted ?? 0,
        });
      })
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  useEffect(() => {
    const authStatus = searchParams.get("authStatus");
    const authError = searchParams.get("authError");
    if (!authStatus && !authError) return;

    if (authStatus) {
      const message = getSocialAuthSuccessMessage(t, authStatus);
      if (message) {
        toast.success(message);
      }
      if (authStatus === "linked") {
        void fetchUser();
      }
    }

    if (authError) {
      const message = getSocialAuthErrorMessage(t, authError);
      if (message) {
        toast.error(message);
      }
    }

    router.replace("/dashboard?section=profile");
  }, [fetchUser, router, searchParams, t]);

  const [formData, setFormData] = useState(() => buildFormData(user));

  useEffect(() => {
    setFormData(buildFormData(user));
  }, [user]);

  const handleSave = async () => {
    const fullName = [formData.firstName.trim(), formData.lastName.trim()]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!fullName) {
      toast.error(t("auth.validation.first_name_required"));
      return;
    }

    setIsSaving(true);
    try {
      const updatedProfile = await updateProfile({
        fullName,
        email: formData.email.trim(),
      });

      setFormData(
        buildFormData({
          fullName: updatedProfile.fullName,
          email: updatedProfile.email,
          username: updatedProfile.username,
        }),
      );

      await fetchUser();
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      logApiError("Failed to update profile", err);
      if (isServiceUnavailable(err)) setServiceUnavailable(true);
      else {
        const errorMessage =
          (
            err as {
              response?: { data?: { message?: string; error?: string } };
            }
          ).response?.data?.message || "Failed to update profile";
        toast.error(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(buildFormData(user));
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            {t("profile.loading")}
          </p>
        </div>
      </div>
    );
  }

  // Derive display name: prefer firstName+lastName, fall back to fullName
  const displayName =
    user.firstName || user.lastName
      ? [user.firstName, user.lastName].filter(Boolean).join(" ")
      : user.fullName || t("profile.default_user");
  const nameParts = displayName.trim().split(/\s+/);
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : nameParts[0]?.[0]?.toUpperCase() || "";
  const fullName = displayName;
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
      })
    : "—";

  return (
    <>
      <div
        className={cn(
          !embedded && "min-h-screen bg-background",
        )}
      >
        <div
          className={cn(
            "mx-auto max-w-5xl px-4 space-y-8",
            embedded ? "py-4" : "container py-10",
          )}
        >
          {serviceUnavailable && (
            <ServiceUnavailableBanner
              onRetry={() => setServiceUnavailable(false)}
            />
          )}

          {/* ── Hero Banner ── */}
          <PageHeroSurface>
            <div className="flex min-w-0 flex-col items-center gap-5 sm:flex-row sm:items-end">
              {/* Avatar */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-3xl font-black text-primary shadow-sm sm:h-24 sm:w-24 sm:text-4xl">
                {initials ? (
                  initials
                ) : (
                  <User className="h-11 w-11" strokeWidth={1.5} />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1 space-y-1 text-center sm:text-start">
                <PageHeroTitle>{fullName}</PageHeroTitle>
                <PageHeroDescription className="break-all">
                  @{user.username}
                </PageHeroDescription>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary ring-1 ring-primary/20">
                    {t("profile.badge_free")}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-green-500/10 px-3 py-0.5 text-xs font-semibold text-green-600 dark:text-green-400 ring-1 ring-green-500/20">
                    {t("profile.badge_verified")}
                  </span>
                </div>
              </div>

              {/* Member since */}
              <div className="hidden sm:block text-end">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {t("profile.member_since_label")}
                </p>
                <p className="text-foreground font-bold mt-0.5">
                  {memberSince}
                </p>
              </div>
            </div>
          </PageHeroSurface>

          {/* ── Two-column layout ── */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* ── Left sidebar ── */}
            <div className="space-y-6">
              {/* Stats */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <SectionHeader
                    icon={<BarChart2 className="w-4 h-4" />}
                    title={t("profile.section_statistics")}
                  />
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3">
                  <PageMetricCard
                    icon={<Trophy className="h-4 w-4" />}
                    value={String(stats.examsCount)}
                    label={t("profile.stat_exams_taken")}
                    tone="warning"
                  />
                  <PageMetricCard
                    icon={<Target className="h-4 w-4" />}
                    value={`${Math.round(stats.avgScore)}%`}
                    label={t("profile.stat_avg_score")}
                    tone="success"
                  />
                  <PageMetricCard
                    icon={<Flame className="h-4 w-4" />}
                    value={String(stats.practiceCount)}
                    label={t("profile.stat_practice_qs")}
                    tone="primary"
                  />
                </CardContent>
              </Card>

              {/* Account Status */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <SectionHeader
                    icon={<ShieldCheck className="w-4 h-4" />}
                    title={t("profile.section_account_status")}
                  />
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    {
                      label: t("profile.account_type"),
                      value: (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                          {t("profile.badge_free")}
                        </Badge>
                      ),
                    },
                    {
                      label: t("profile.member_since"),
                      value: (
                        <span className="text-xs font-semibold text-foreground">
                          {memberSince}
                        </span>
                      ),
                    },
                    {
                      label: t("profile.email_verified"),
                      value: (
                        <Badge className="bg-green-500/10 text-green-600 border-green-200 text-xs">
                          {t("profile.badge_verified")}
                        </Badge>
                      ),
                    },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5"
                    >
                      <span className="text-xs text-muted-foreground font-medium">
                        {row.label}
                      </span>
                      {row.value}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <SectionHeader
                    icon={<ShieldCheck className="w-4 h-4" />}
                    title={t("profile.section_sign_in_methods")}
                  />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-2xl border border-border/50 bg-muted/25 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground">
                          {t("profile.google_sign_in")}
                        </p>
                        <p className="text-xs leading-5 text-muted-foreground">
                          {user.googleLinked
                            ? t("profile.google_connected_help")
                            : t("profile.google_connect_help")}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          "border text-xs",
                          user.googleLinked
                            ? "border-green-500/20 bg-green-500/10 text-green-600"
                            : "border-border/60 bg-background text-muted-foreground",
                        )}
                      >
                        {user.googleLinked
                          ? t("profile.google_connected")
                          : t("profile.google_not_connected")}
                      </Badge>
                    </div>
                  </div>

                  {!user.googleLinked && (
                    <GoogleAuthButton
                      mode="link"
                      returnTo="/dashboard?section=profile"
                      label={t("profile.connect_google")}
                      className="h-10 rounded-xl"
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Right main content ── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <SectionHeader
                      icon={<User className="w-4 h-4" />}
                      title={t("profile.section_personal_info")}
                    />
                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="gap-1.5 text-xs h-8 hover:bg-primary/5 hover:border-primary/30 transition-all"
                      >
                        <Pencil className="w-3 h-3" /> {t("profile.edit")}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      {
                        id: "firstName",
                        label: t("profile.label_first_name"),
                        key: "firstName",
                      },
                      {
                        id: "lastName",
                        label: t("profile.label_last_name"),
                        key: "lastName",
                      },
                    ].map(({ id, label, key }) => (
                      <div key={id} className="space-y-1.5">
                        <Label
                          htmlFor={id}
                          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {label}
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                          <Input
                            id={id}
                            name={id}
                            autoComplete={
                              id === "firstName" ? "given-name" : "family-name"
                            }
                            value={formData[key as keyof typeof formData]}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [key]: e.target.value,
                              })
                            }
                            disabled={!isEditing}
                            className="pl-9 h-10 disabled:bg-muted/30 disabled:text-foreground/70"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="email"
                      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {t("profile.label_email")}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        disabled={!isEditing}
                        className="pl-9 h-10 disabled:bg-muted/30 disabled:text-foreground/70"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="username"
                      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {t("profile.label_username")}
                    </Label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input
                        id="username"
                        name="username"
                        autoComplete="username"
                        value={formData.username}
                        disabled
                        className="pl-9 h-10 bg-muted/50 text-muted-foreground"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("profile.username_cannot_change")}
                    </p>
                  </div>

                  {isEditing && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        size="sm"
                        className="gap-2 shadow-md shadow-primary/20"
                      >
                        {isSaving ? (
                          <>
                            <svg
                              className="animate-spin w-3.5 h-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8z"
                              />
                            </svg>
                            {t("profile.saving")}
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            {t("profile.save_changes")}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        className="gap-2"
                      >
                        <X className="w-3.5 h-3.5" /> {t("profile.cancel")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Language Preferences */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <SectionHeader
                    icon={<Globe className="w-4 h-4" />}
                    title={t("profile.section_language_prefs")}
                  />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label
                    id="language-label"
                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {t("profile.label_preferred_language")}
                  </Label>
                  <Select
                    value={language}
                    onValueChange={(v) =>
                      setLanguage(v as "en" | "ar" | "nl" | "fr")
                    }
                  >
                    <SelectTrigger
                      id="language-trigger"
                      aria-labelledby="language-label"
                      className="h-10"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.flag} {lang.nativeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t("profile.language_help")}
                  </p>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-destructive/25 shadow-sm">
                <CardHeader className="pb-4">
                  <SectionHeader
                    icon={<Trash2 className="w-4 h-4" />}
                    title={t("profile.section_danger_zone")}
                    color="bg-destructive/10 text-destructive"
                  />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4">
                    <div>
                      <p className="font-bold text-destructive text-sm">
                        {t("profile.delete_account")}
                      </p>
                      <p className="text-xs text-destructive/60 mt-0.5">
                        {t("profile.delete_account_desc")}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1.5 flex-shrink-0 text-xs"
                      disabled={isDeleting}
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="w-3 h-3" /> {t("profile.delete")}
                    </Button>
                  </div>

                  {/* Confirmation panel */}
                  {showDeleteConfirm && (
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 space-y-3">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <p className="text-sm font-bold">
                          {t("profile.delete_confirm_title")}
                        </p>
                      </div>
                      <p className="text-xs text-destructive/70">
                        {t("profile.delete_confirm_desc")}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1.5 text-xs"
                          disabled={isDeleting}
                          onClick={handleDeleteAccount}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />{" "}
                              {t("profile.deleting")}
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3 h-3" />{" "}
                              {t("profile.delete_confirm_btn")}
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => setShowDeleteConfirm(false)}
                        >
                          <X className="w-3 h-3 mr-1" /> {t("profile.cancel")}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={deleteModal.open}
        username={deleteModal.username}
        title={t("auth.modal.account_deleted")}
        subtitle={t("auth.modal.delete_subtitle")}
        redirectingText={t("auth.modal.delete_redirecting")}
        onRedirect={() => {
          window.location.href = "/login";
        }}
      />
    </>
  );
}

export default function ProfilePage() {
  const router = useLocalizedRouter();

  useEffect(() => {
    router.replace("/dashboard?section=profile");
  }, [router]);

  return null;
}
