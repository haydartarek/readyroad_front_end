"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Children, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type MarketingTranslate = (
  key: string,
  variables?: Record<string, string | number>,
) => string;

type DateFormatter = (value: string | null) => string;

const TECHNICAL_FIELDS = new Set([
  "id",
  "uuid",
  "task_id",
  "attempt_id",
  "file_sha256",
  "payload",
  "raw_payload",
  "container_node",
  "pojo",
  "correlation_id",
  "idempotency_key",
]);

const STATUS_SUCCESS = new Set([
  "ACTIVE",
  "APPROVED",
  "COMPLETED",
  "CONFIGURED",
  "ENABLED",
  "ESTABLISHED",
  "HEALTHY",
  "IMPORTED",
  "PASSED",
  "RELEASED",
  "SUCCESS",
  "VERIFIED",
]);

const STATUS_DANGER = new Set([
  "BLOCKED",
  "DECLINING",
  "DEGRADED",
  "DISABLED",
  "FAILED",
  "MALFORMED_STRUCTURED_OUTPUT",
  "NETWORK_INTERRUPTION",
  "REJECTED",
]);

const STATUS_WARNING = new Set([
  "DISCOVERING",
  "EMERGING",
  "INSUFFICIENT_DATA",
  "MISSING",
  "OPPORTUNITY",
  "PENDING",
  "BLOCKED_PROVIDER_API_OAUTH",
  "PENDING_RELEASE",
  "RETRY_SCHEDULED",
  "SCHEDULED",
  "WAITING_APPROVAL",
]);

function normalizeKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[.\s-]+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .replace(/_+/g, "_")
    .toLowerCase();
}

function fallbackLabel(value: string) {
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (words === words.toUpperCase() ? words.toLowerCase() : words)
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bRijvia\b/g, "RijVia");
}

function translatedOrFallback(
  t: MarketingTranslate,
  key: string,
  fallback: string,
) {
  const translated = t(key);
  return translated === key ? fallback : translated;
}

export function fieldLabel(t: MarketingTranslate, field: string) {
  return translatedOrFallback(
    t,
    `admin.marketing.field_${normalizeKey(field)}`,
    fallbackLabel(field),
  );
}

export function machineLabel(t: MarketingTranslate, value: string) {
  const normalized = normalizeKey(value);
  if (["ar", "nl", "fr", "en"].includes(normalized)) {
    return t(`admin.settings_page.language_${normalized}`);
  }
  if (normalized === "ga4") return machineLabel(t, "google.ga4");
  if (normalized === "readyroad_core_data" || normalized === "rijvia_core_data") {
    return translatedOrFallback(t, "admin.marketing.value_rijvia_core_data", "RijVia Core Data");
  }
  if (normalized === "readyroad_feature" || normalized === "rijvia_product_capability") {
    return translatedOrFallback(t, "admin.marketing.value_rijvia_product_capability", "RijVia Product Capability");
  }
  if (normalized === "old_brand_readyroad" || normalized === "legacy_source_domain") {
    return translatedOrFallback(t, "admin.marketing.value_legacy_source_domain", "Legacy source domain");
  }
  return translatedOrFallback(
    t,
    `admin.marketing.value_${normalizeKey(value)}`,
    fallbackLabel(value),
  );
}

function presentationSafeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(presentationSafeValue);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, presentationSafeValue(item)]),
    );
  }
  if (typeof value !== "string") return value;
  if (value === "READYROAD_CORE_DATA") return "RIJVIA_CORE_DATA";
  if (value === "READYROAD_FEATURE") return "RIJVIA_PRODUCT_CAPABILITY";
  if (value === "OLD_BRAND_READYROAD") return "LEGACY_SOURCE_DOMAIN";
  if (/^(sc-domain:)?(?:www\.)?readyroad\.be$/i.test(value)) return "LEGACY_SEARCH_CONSOLE_PROPERTY";
  if (/^https?:\/\/(?:www\.)?readyroad\.be(?:\/|$)/i.test(value)) {
    const url = new URL(value);
    return url.pathname + url.search;
  }
  return value
    .replaceAll("OLD_BRAND_READYROAD", "LEGACY_SOURCE_DOMAIN")
    .replaceAll("READYROAD_CORE_DATA", "RIJVIA_CORE_DATA")
    .replaceAll("READYROAD_FEATURE", "RIJVIA_PRODUCT_CAPABILITY")
    .replace(/ReadyRoad/gi, "RijVia");
}

export function marketingDisplayText(value: string) {
  return String(presentationSafeValue(value));
}

export function marketingActorLabel(actor: string, t: MarketingTranslate) {
  // The worker identifies itself with hostname + UUID, not a user account.
  const workerIdentity = /^(?:[a-z0-9._-]+-)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return workerIdentity.test(actor) || /^(?:worker[:_-].*|SYSTEM(?:_.*)?)$/i.test(actor)
    ? t("admin.marketing.automatic_worker") : marketingDisplayText(actor);
}

export function marketingErrorText(t: MarketingTranslate, code: string) {
  const known: Record<string, string> = {
    OPENAI_QUOTA_EXHAUSTED: "error_openai_quota",
    HTTP_429: "error_rate_limit",
    RATE_LIMIT: "error_rate_limit",
    OPENAI_API_KEY_MISSING: "error_openai_credentials",
    INVALID_API_KEY: "error_openai_credentials",
    NETWORK_INTERRUPTION: "error_temporary_connection",
    TIMEOUT: "error_temporary_connection",
    HTTP_502: "error_temporary_connection",
    HTTP_503: "error_temporary_connection",
    HTTP_504: "error_temporary_connection",
    MALFORMED_STRUCTURED_OUTPUT: "error_invalid_content",
  };
  return t(`admin.marketing.${known[code] ?? "error_review_task"}`);
}

export function marketingImportError(t: MarketingTranslate, error: unknown) {
  const response = (error as { response?: { status?: number; data?: { message?: string } } })?.response;
  const message = response?.data?.message ?? "";
  let key = "seo_import_failed";
  if (response?.status === 400) {
    key = /sheet|header|chart/i.test(message) ? "seo_import_wrong_report"
      : /formula|external.*link/i.test(message) ? "seo_import_unsafe"
        : /upload limit/i.test(message) ? "seo_import_too_large" : "seo_import_invalid";
  } else if (response?.status === 403) key = "seo_import_forbidden";
  else if (response?.status === 413) key = "seo_import_too_large";
  return t(`admin.marketing.${key}`);
}

export function isTechnicalField(field: string) {
  return TECHNICAL_FIELDS.has(normalizeKey(field));
}

function statusTone(value: string) {
  const status = value.toUpperCase();
  if (STATUS_SUCCESS.has(status)) return "success";
  if (STATUS_DANGER.has(status)) return "danger";
  if (STATUS_WARNING.has(status)) return "warning";
  return "default";
}

export function HumanStatusBadge({
  status,
  t,
}: {
  status: string;
  t: MarketingTranslate;
}) {
  const tone = statusTone(status);
  return (
    <span className="inline-flex min-w-0 flex-col items-start gap-0.5">
      <Badge
        variant="outline"
        className={cn(
          "max-w-full whitespace-normal border-border/60 bg-muted/30 text-start",
          tone === "success" && "border-green-200 bg-green-50 text-green-700",
          tone === "danger" && "border-red-200 bg-red-50 text-red-700",
          tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
        )}
      >
        {machineLabel(t, status)}
      </Badge>
    </span>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isDateField(field: string) {
  return /(^|_)(at|date|start|end|through)$/.test(normalizeKey(field));
}

function isUrlField(field: string, value: string) {
  const key = normalizeKey(field);
  return key.includes("url") || key === "page" || /^https?:\/\//i.test(value);
}

function isMachineValue(field: string, value: string) {
  const key = normalizeKey(field);
  return (
    ["status", "state", "priority", "classification", "search_intent", "brand_classification", "approval_mode"].some((part) => key.includes(part)) ||
    /^[A-Z][A-Z0-9_]+$/.test(value)
  );
}

function formatNumber(field: string, value: number) {
  const key = normalizeKey(field);
  if (key === "ctr" || key.endsWith("_ctr")) {
    const percentage = Math.abs(value) <= 1 ? value * 100 : value;
    return `${percentage.toFixed(2).replace(/\.?0+$/, "")}%`;
  }
  if (key.includes("percent") || key.endsWith("_rate")) {
    return `${value.toLocaleString()}%`;
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function PrimitiveValue({
  field,
  value,
  t,
  formatDate,
}: {
  field: string;
  value: string | number | boolean | null;
  t: MarketingTranslate;
  formatDate?: DateFormatter;
}) {
  if (value === null || value === "") return <span aria-label={t("admin.marketing.no_value")}>—</span>;
  if (typeof value === "boolean") {
    return <span>{t(value ? "admin.marketing.yes" : "admin.marketing.no")}</span>;
  }
  if (typeof value === "number") return <span dir="ltr">{formatNumber(field, value)}</span>;

  if (formatDate && isDateField(field) && !Number.isNaN(Date.parse(value))) {
    return <time dateTime={value}>{formatDate(value)}</time>;
  }
  if (isMachineValue(field, value)) {
    return <HumanStatusBadge status={value} t={t} />;
  }
  if (isUrlField(field, value)) {
    return <span dir="ltr" className="block max-w-full break-all">{value}</span>;
  }
  return <span className="block max-w-full break-words">{value}</span>;
}

function StructuredValue({
  field,
  value,
  t,
  formatDate,
  depth,
}: {
  field: string;
  value: unknown;
  t: MarketingTranslate;
  formatDate?: DateFormatter;
  depth: number;
}) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
    return (
      <PrimitiveValue
        field={field}
        value={value as string | number | boolean | null}
        t={t}
        formatDate={formatDate}
      />
    );
  }

  if (Array.isArray(value)) {
    if (!value.length) return <span>{t("admin.marketing.empty")}</span>;
    return (
      <MarketingList t={t} pageSize={5}>
        {value.map((item, index) => (
          <div key={`${field}-${index}`} className="min-w-0 border-b border-border/40 py-2 last:border-0">
            {isRecord(item) ? (
              <StructuredFields data={item} t={t} formatDate={formatDate} depth={depth + 1} />
            ) : (
              <StructuredValue field={field} value={item} t={t} formatDate={formatDate} depth={depth + 1} />
            )}
          </div>
        ))}
      </MarketingList>
    );
  }

  if (isRecord(value)) {
    return <StructuredFields data={value} t={t} formatDate={formatDate} depth={depth + 1} />;
  }

  return <span className="break-words">{String(value)}</span>;
}

function StructuredFields({
  data,
  t,
  formatDate,
  depth = 0,
}: {
  data: Record<string, unknown>;
  t: MarketingTranslate;
  formatDate?: DateFormatter;
  depth?: number;
}) {
  const entries = Object.entries(data).filter(([field, value]) =>
    !isTechnicalField(field) && value !== undefined && value !== null && value !== "" &&
    !(Array.isArray(value) && !value.length) && !(isRecord(value) && !Object.keys(value).length),
  );
  if (!entries.length) return <p className="text-sm text-muted-foreground">{t("admin.marketing.empty")}</p>;

  return (
    <dl className={cn("grid min-w-0 gap-x-4 gap-y-1", depth < 2 && "grid-cols-2")}>
      {entries.map(([field, value]) => (
        Array.isArray(value) || isRecord(value) ? (
          <div key={field} className="min-w-0 col-span-full">
            <dt className="sr-only">{t("admin.marketing.details")}</dt>
            <dd>
              <MarketingDetails title={fieldLabel(t, field)} count={Array.isArray(value) ? value.length : undefined}>
                <StructuredValue field={field} value={value} t={t} formatDate={formatDate} depth={depth} />
              </MarketingDetails>
            </dd>
          </div>
        ) : <div key={field} className="min-w-0 border-b border-border/40 py-2">
          <dt className="break-words text-xs font-semibold text-muted-foreground">{fieldLabel(t, field)}</dt>
          <dd className="mt-1 min-w-0 text-sm font-semibold text-foreground">
            <StructuredValue field={field} value={value} t={t} formatDate={formatDate} depth={depth} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function TechnicalDetails({
  data,
  t,
}: {
  data: unknown;
  t: MarketingTranslate;
}) {
  const displayData = presentationSafeValue(data);
  if (!isRecord(displayData) || !Object.keys(displayData).some((field) => !isTechnicalField(field))) return null;
  return (
    <MarketingDetails title={t("admin.marketing.details")}>
      <StructuredFields data={displayData} t={t} />
    </MarketingDetails>
  );
}

export function StructuredData({
  data,
  t,
  formatDate,
}: {
  data: unknown;
  t: MarketingTranslate;
  formatDate?: DateFormatter;
  technicalDetails?: boolean;
}) {
  const displayData = presentationSafeValue(data);
  const primary = isRecord(displayData)
    ? Object.fromEntries(Object.entries(displayData).filter(([field]) => !isTechnicalField(field)))
    : displayData;

  return (
    <div className="min-w-0">
      {isRecord(primary) ? (
        <StructuredFields data={primary} t={t} formatDate={formatDate} />
      ) : (
        <StructuredValue field="value" value={primary} t={t} formatDate={formatDate} depth={0} />
      )}
    </div>
  );
}

export function StructuredRecordCard({
  data,
  titleField,
  fallbackTitle,
  t,
  formatDate,
}: {
  data: Record<string, unknown>;
  titleField?: string;
  fallbackTitle: string;
  t: MarketingTranslate;
  formatDate?: DateFormatter;
}) {
  const displayData = presentationSafeValue(data) as Record<string, unknown>;
  const rawTitle = (titleField && displayData[titleField] != null ? String(displayData[titleField]).trim() : "") || fallbackTitle;
  const title = titleField && isMachineValue(titleField, rawTitle) ? machineLabel(t, rawTitle) : rawTitle;
  const primary = Object.fromEntries(
    Object.entries(displayData).filter(([field]) => field !== titleField && !isTechnicalField(field)),
  );
  const preferred = ["status", "state", "priority", "impressions", "clicks", "ctr", "average_position"];
  const fields = Object.keys(primary);
  const visibleFields = [...preferred.filter((field) => fields.includes(field)), ...fields.filter((field) => !preferred.includes(field))].slice(0, 7);
  const summary = Object.fromEntries(visibleFields.map((field) => [field, primary[field]]));
  const remaining = Object.fromEntries(Object.entries(primary).filter(([field]) => !visibleFields.includes(field)));
  return (
    <article className="min-w-0 border-b border-border/55 py-4 last:border-0">
      <h3 dir={titleField && isUrlField(titleField, rawTitle) ? "ltr" : undefined} className="break-words font-bold text-foreground">{title}</h3>
      <div className="mt-3">
        <StructuredFields data={summary} t={t} formatDate={formatDate} />
      </div>
      {Object.keys(remaining).length ? <TechnicalDetails data={remaining} t={t} /> : null}
    </article>
  );
}

export function MarketingDetails({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="min-w-0 border-b border-border/50 py-3" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="cursor-pointer break-words rounded-sm text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {title}{count !== undefined ? <span className="ms-2 text-xs text-muted-foreground">({count})</span> : null}
      </summary>
      {open ? <div className="mt-3 min-w-0">{children}</div> : null}
    </details>
  );
}

export function MarketingList({ children, t, pageSize = 8 }: { children: ReactNode; t: MarketingTranslate; pageSize?: number }) {
  const items = Children.toArray(children);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pages - 1);
  return (
    <div className="min-w-0 space-y-3">
      {items.slice(current * pageSize, (current + 1) * pageSize)}
      {pages > 1 ? (
        <nav aria-label={t("admin.marketing.list_pages")} className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
          <Button variant="outline" size="icon" disabled={current === 0} aria-label={t("admin.marketing.previous_page")} title={t("admin.marketing.previous_page")} onClick={() => setPage(current - 1)}>
            <ChevronLeft className="rtl:rotate-180" />
          </Button>
          <span className="text-xs text-muted-foreground" aria-live="polite">{t("admin.marketing.page_count", { page: current + 1, pages, count: items.length })}</span>
          <Button variant="outline" size="icon" disabled={current + 1 === pages} aria-label={t("admin.marketing.next_page")} title={t("admin.marketing.next_page")} onClick={() => setPage(current + 1)}>
            <ChevronRight className="rtl:rotate-180" />
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
