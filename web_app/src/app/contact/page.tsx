"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import {
  PageHeroDescription,
  PageHeroSurface,
  PageHeroTitle,
} from "@/components/ui/page-surface";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Clock3,
  Github,
  Linkedin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_APP_URL } from "@/lib/site-copy";
import {
  getPublicBreadcrumbHome,
  getPublicMetadata,
  PUBLIC_CONTACT,
} from "@/lib/public-content";
import {
  createBreadcrumbSchema,
  createPublicPageSchema,
} from "@/lib/public-page-schema";
import { serializeJsonLd } from "@/lib/seo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}
interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  subject?: string;
  message?: string;
}

// ─── Page ────────────────────────────────────────────────

export default function ContactPage() {
  const { t, language, isRTL } = useLanguage();
  const pageTitle = t("contact.title");
  const homeLabel = getPublicBreadcrumbHome(language);
  const metadata = getPublicMetadata(language, "contact");
  const pageSchema = createPublicPageSchema({
    appUrl: APP_URL,
    path: "/contact",
    title: pageTitle,
    description: metadata.description,
    language,
    pageType: "ContactPage",
  });
  const breadcrumbSchema = createBreadcrumbSchema({
    appUrl: APP_URL,
    path: "/contact",
    homeLabel,
    currentLabel: pageTitle,
  });

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [apiError, setApiError] = useState("");

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.firstName.trim()) e.firstName = t("contact.required");
    if (!form.lastName.trim()) e.lastName = t("contact.required");
    if (!form.email.trim()) e.email = t("contact.required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = t("contact.invalidEmail");
    if (!form.subject.trim()) e.subject = t("contact.required");
    if (!form.message.trim()) e.message = t("contact.required");
    else if (form.message.trim().length < 20)
      e.message = t("contact.minMessage");
    setErrors(e);
    const firstInvalidField = Object.keys(e)[0] as keyof FormErrors | undefined;
    if (firstInvalidField) {
      requestAnimationFrame(() => {
        document.getElementById(`contact-${toKebabCase(firstInvalidField)}`)?.focus();
      });
    }
    return Object.keys(e).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    setApiError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": language,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const message =
          typeof data?.error === "string" &&
          !/all fields are required|invalid email address|failed to send message|unknown error/i.test(
            data.error,
          )
            ? data.error
            : t("common.error_desc");
        throw new Error(message);
      }
      setStatus("success");
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : t("common.error_desc"));
      setStatus("error");
    }
  };

  return (
    <main
      className="min-h-screen bg-background"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
      />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Breadcrumb
          items={[
            { label: homeLabel, href: "/" },
            { label: pageTitle, isCurrentPage: true },
          ]}
        />
        <PageHeroSurface className="mb-8">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-1">
              <PageHeroTitle>{pageTitle}</PageHeroTitle>
              <PageHeroDescription className="mx-auto max-w-md leading-relaxed">
                {t("contact.subtitle")}
              </PageHeroDescription>
            </div>
          </div>
        </PageHeroSurface>

        <section
          aria-labelledby="contact-methods-title"
          className="mb-8 border-y border-border py-5"
        >
          <h2 id="contact-methods-title" className="sr-only">
            {t("contact.methods")}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <a
              href={`mailto:${PUBLIC_CONTACT.email}`}
              className="group flex min-w-0 items-start gap-3 rounded-md p-2 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {t("contact.directEmail")}
                </span>
                <span className="block break-all text-sm text-muted-foreground" dir="ltr">
                  {PUBLIC_CONTACT.email}
                </span>
              </span>
            </a>
            <div className="flex items-start gap-3 p-2">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>
                <span className="block text-sm font-semibold">
                  {t("contact.responseTime")}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {t("contact.responseTimeValue")}
                </span>
              </span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 px-2">
            <a
              href={PUBLIC_CONTACT.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <a
              href={PUBLIC_CONTACT.linkedin}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </a>
          </div>
        </section>

        {/* Form */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* First + Last name */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  htmlFor="contact-first-name"
                  label={t("contact.firstName")}
                  required
                  error={errors.firstName}
                  isRTL={isRTL}
                >
                  <input
                    id="contact-first-name"
                    name="firstName"
                    autoComplete="given-name"
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder={t("contact.placeholderFirst")}
                    className={inputCls(!!errors.firstName)}
                    aria-invalid={!!errors.firstName}
                    aria-describedby={
                      errors.firstName ? "contact-first-name-error" : undefined
                    }
                    maxLength={60}
                  />
                </Field>
                <Field
                  htmlFor="contact-last-name"
                  label={t("contact.lastName")}
                  required
                  error={errors.lastName}
                  isRTL={isRTL}
                >
                  <input
                    id="contact-last-name"
                    name="lastName"
                    autoComplete="family-name"
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder={t("contact.placeholderLast")}
                    className={inputCls(!!errors.lastName)}
                    aria-invalid={!!errors.lastName}
                    aria-describedby={
                      errors.lastName ? "contact-last-name-error" : undefined
                    }
                    maxLength={60}
                  />
                </Field>
              </div>

              {/* Email */}
              <Field
                htmlFor="contact-email"
                label={t("contact.email")}
                required
                error={errors.email}
                isRTL={isRTL}
              >
                <input
                  id="contact-email"
                  name="email"
                  autoComplete="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder={t("contact.placeholderEmail")}
                  className={inputCls(!!errors.email)}
                  aria-invalid={!!errors.email}
                  aria-describedby={
                    errors.email ? "contact-email-error" : undefined
                  }
                  maxLength={120}
                />
              </Field>

              {/* Subject */}
              <Field
                htmlFor="contact-subject"
                label={t("contact.subject")}
                required
                error={errors.subject}
                isRTL={isRTL}
              >
                <input
                  id="contact-subject"
                  name="subject"
                  autoComplete="off"
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  placeholder={t("contact.placeholderSubject")}
                  className={inputCls(!!errors.subject)}
                  aria-invalid={!!errors.subject}
                  aria-describedby={
                    errors.subject ? "contact-subject-error" : undefined
                  }
                  maxLength={120}
                />
              </Field>

              {/* Message */}
              <Field
                htmlFor="contact-message"
                label={t("contact.message")}
                required
                error={errors.message}
                isRTL={isRTL}
              >
                <textarea
                  id="contact-message"
                  name="message"
                  autoComplete="off"
                  required
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  placeholder={t("contact.placeholderMsg")}
                  rows={5}
                  className={cn(
                    inputCls(!!errors.message),
                    "resize-y min-h-[120px]",
                  )}
                  aria-invalid={!!errors.message}
                  aria-describedby={
                    errors.message ? "contact-message-error" : undefined
                  }
                  maxLength={2000}
                />
                <p className="mt-1 text-end text-xs text-muted-foreground">
                  {form.message.length}/2000
                </p>
              </Field>

              {/* Submit */}
              <Button
                type="submit"
                disabled={status === "loading"}
                className="w-full h-12 rounded-xl text-base font-bold"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {t("contact.sending")}
                  </>
                ) : (
                  <>
                    <Send className="me-2 h-4 w-4" />
                    {t("contact.send")}
                  </>
                )}
              </Button>

              {/* Success banner */}
              {status === "success" && (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    background: "#dcfce7",
                    border: "2px solid #16a34a",
                    borderRadius: "14px",
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <CheckCircle2
                    style={{
                      color: "#16a34a",
                      flexShrink: 0,
                      marginTop: "2px",
                      width: "24px",
                      height: "24px",
                    }}
                  />
                  <div>
                    <p
                      style={{
                        color: "#14532d",
                        fontWeight: 800,
                        fontSize: "16px",
                        margin: 0,
                      }}
                    >
                      {t("contact.successTitle")}
                    </p>
                    <p
                      style={{
                        color: "#166534",
                        fontWeight: 500,
                        fontSize: "14px",
                        margin: "4px 0 0",
                      }}
                    >
                      {t("contact.successMsg")}
                    </p>
                  </div>
                </div>
              )}

              {/* Error banner */}
              {status === "error" && (
                <div
                  role="alert"
                  aria-live="assertive"
                  style={{
                    background: "#fee2e2",
                    border: "2px solid #dc2626",
                    borderRadius: "14px",
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <AlertCircle
                    style={{
                      color: "#dc2626",
                      flexShrink: 0,
                      marginTop: "2px",
                      width: "24px",
                      height: "24px",
                    }}
                  />
                  <div>
                    <p
                      style={{
                        color: "#7f1d1d",
                        fontWeight: 800,
                        fontSize: "16px",
                        margin: 0,
                      }}
                    >
                      {t("contact.errorTitle")}
                    </p>
                    <p
                      style={{
                        color: "#991b1b",
                        fontWeight: 500,
                        fontSize: "14px",
                        margin: "4px 0 0",
                      }}
                    >
                      {apiError}
                    </p>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

// ─── Helpers ─────────────────────────────────────────────

function Field({
  htmlFor,
  label,
  required,
  error,
  isRTL,
  children,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
  error?: string;
  isRTL: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className={cn(
          "block text-sm font-semibold text-foreground",
          isRTL && "text-right",
        )}
      >
        {label}
        {required && (
          <span className="ms-1 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p
          id={`${htmlFor}-error`}
          className={cn(
            "flex items-center gap-1 text-xs text-destructive",
            isRTL && "flex-row-reverse",
          )}
        >
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    "w-full rounded-xl border px-4 py-2.5 text-sm bg-background text-foreground",
    "placeholder:text-muted-foreground/60 transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring",
    hasError
      ? "border-destructive focus:ring-destructive/30"
      : "border-border hover:border-muted-foreground/40",
  );
}

function toKebabCase(value: string) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
