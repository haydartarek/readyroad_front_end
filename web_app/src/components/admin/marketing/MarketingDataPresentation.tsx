"use client";

import { Badge } from "@/components/ui/badge";
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
  "evidence",
  "payload",
  "raw_payload",
  "report",
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
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
  return translatedOrFallback(
    t,
    `admin.marketing.value_${normalizeKey(value)}`,
    fallbackLabel(value),
  );
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
  showCode = false,
}: {
  status: string;
  t: MarketingTranslate;
  showCode?: boolean;
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
      {showCode ? (
        <code dir="ltr" className="max-w-full break-all text-[10px] text-muted-foreground">
          {status}
        </code>
      ) : null}
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
    return <HumanStatusBadge status={value} t={t} showCode />;
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
    const visible = value.slice(0, 8);
    return (
      <div className="space-y-2">
        {visible.map((item, index) => (
          <div key={`${field}-${index}`} className="rounded-lg border border-border/50 bg-background/70 p-2.5">
            {isRecord(item) ? (
              <StructuredFields data={item} t={t} formatDate={formatDate} depth={depth + 1} />
            ) : (
              <StructuredValue field={field} value={item} t={t} formatDate={formatDate} depth={depth + 1} />
            )}
          </div>
        ))}
        {value.length > visible.length ? (
          <p className="text-xs text-muted-foreground">
            {t("admin.marketing.more_items", { count: value.length - visible.length })}
          </p>
        ) : null}
      </div>
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
  const entries = Object.entries(data).filter(([, value]) => value !== undefined);
  if (!entries.length) return <p className="text-sm text-muted-foreground">{t("admin.marketing.empty")}</p>;

  return (
    <dl className={cn("grid min-w-0 gap-2", depth < 2 && "sm:grid-cols-2")}>
      {entries.map(([field, value]) => (
        <div key={field} className="min-w-0 rounded-lg bg-muted/35 p-2.5">
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
  return (
    <details data-testid="marketing-technical-details" className="mt-3 rounded-xl border border-border/50 bg-muted/20 p-3">
      <summary className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground">
        {t("admin.marketing.technical_details")}
      </summary>
      <pre dir="ltr" className="mt-3 max-h-80 max-w-full overflow-auto whitespace-pre-wrap break-all rounded-lg bg-background p-3 text-start text-[11px] leading-5">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

export function StructuredData({
  data,
  t,
  formatDate,
  technicalDetails = true,
}: {
  data: unknown;
  t: MarketingTranslate;
  formatDate?: DateFormatter;
  technicalDetails?: boolean;
}) {
  const primary = isRecord(data)
    ? Object.fromEntries(Object.entries(data).filter(([field]) => !isTechnicalField(field)))
    : data;

  return (
    <div className="min-w-0">
      {isRecord(primary) ? (
        <StructuredFields data={primary} t={t} formatDate={formatDate} />
      ) : (
        <StructuredValue field="value" value={primary} t={t} formatDate={formatDate} depth={0} />
      )}
      {technicalDetails ? <TechnicalDetails data={data} t={t} /> : null}
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
  const rawTitle = titleField && data[titleField] != null ? String(data[titleField]) : fallbackTitle;
  const title = titleField && isMachineValue(titleField, rawTitle) ? machineLabel(t, rawTitle) : rawTitle;
  const primary = Object.fromEntries(
    Object.entries(data).filter(([field]) => field !== titleField && !isTechnicalField(field)),
  );
  return (
    <article className="min-w-0 rounded-xl border border-border/55 bg-muted/20 p-4">
      <h3 className="break-words font-bold text-foreground">{title}</h3>
      <div className="mt-3">
        <StructuredFields data={primary} t={t} formatDate={formatDate} />
      </div>
      <TechnicalDetails data={data} t={t} />
    </article>
  );
}
