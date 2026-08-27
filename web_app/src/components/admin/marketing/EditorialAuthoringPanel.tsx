"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpenCheck, DatabaseZap, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { apiClient, getApiErrorMessage, logApiError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  EditorialAuthoringStatus,
  EditorialLanguage,
  EditorialTopic,
  MarketingStrategySnapshot,
} from "@/lib/marketing-admin";

type Translate = (key: string, variables?: Record<string, string | number>) => string;

interface Props {
  topic: EditorialTopic;
  language: EditorialLanguage;
  strategy: MarketingStrategySnapshot;
  t: Translate;
  onChanged: () => Promise<void>;
}

interface BriefForm {
  searchIntent: string;
  workingTitle: string;
  purpose: string;
  targetQueries: string;
  sourceRequirements: string;
  legalReviewRequired: boolean;
  uspId: string;
  icpId: string;
  contentPillarId: string;
  funnelStageId: string;
  conversionGoalId: string;
}

interface SourceForm {
  claimKey: string;
  claimText: string;
  claimType: string;
  sourceType: string;
  title: string;
  publisher: string;
  url: string;
  internalReference: string;
  jurisdiction: string;
  legalReviewStatus: string;
  fingerprint: string;
}

const SOURCE_TYPES = [
  "RIJVIA_CORE_DATA",
  "APPROVED_INTERNAL_SOURCE",
  "OFFICIAL_LEGAL_SOURCE",
  "OFFICIAL_GOVERNMENT_SOURCE",
  "OFFICIAL_PUBLIC_AUTHORITY_SOURCE",
  "APPROVED_REFERENCE_SOURCE",
] as const;

const CLAIM_TYPES = [
  "FACTUAL",
  "PRODUCT_FACT",
  "LEGAL",
  "REGIONAL",
  "DATE_SENSITIVE",
  "STATISTIC",
] as const;

function initialBrief(topic: EditorialTopic): BriefForm {
  return {
    searchIntent: "INFORMATIONAL",
    workingTitle: topic.title,
    purpose: "",
    targetQueries: "",
    sourceRequirements: "",
    legalReviewRequired: false,
    uspId: topic.uspId?.toString() ?? "",
    icpId: topic.icpId ?? "",
    contentPillarId: topic.contentPillarId?.toString() ?? "",
    funnelStageId: topic.funnelStageId?.toString() ?? "",
    conversionGoalId: topic.conversionGoalId?.toString() ?? "",
  };
}

const EMPTY_SOURCE: SourceForm = {
  claimKey: "",
  claimText: "",
  claimType: "FACTUAL",
  sourceType: "RIJVIA_CORE_DATA",
  title: "",
  publisher: "RijVia",
  url: "",
  internalReference: "",
  jurisdiction: "",
  legalReviewStatus: "REQUIRES_REVIEW",
  fingerprint: "",
};

export default function EditorialAuthoringPanel({ topic, language, strategy, t, onChanged }: Props) {
  const [status, setStatus] = useState<EditorialAuthoringStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"brief" | "source" | "draft" | null>(null);
  const [brief, setBrief] = useState<BriefForm>(() => initialBrief(topic));
  const [source, setSource] = useState<SourceForm>(EMPTY_SOURCE);
  const selectDirection = language === "AR" ? "rtl" : "ltr";

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<EditorialAuthoringStatus>(
        `/admin/marketing/editorial/editor/topics/${topic.topicId}/authoring-status`,
      );
      setStatus(response.data);
    } catch (error) {
      logApiError("Failed to load editorial authoring readiness", error);
      toast.error(getApiErrorMessage(error, t("admin.marketing.action_failed")));
    } finally {
      setLoading(false);
    }
  }, [t, topic.topicId]);

  useEffect(() => {
    setBrief(initialBrief(topic));
    setSource(EMPTY_SOURCE);
    void loadStatus();
  }, [loadStatus, topic]);

  const activeUsps = useMemo(() => strategy.usps.filter((item) => item.active), [strategy.usps]);
  const activeIcps = useMemo(() => strategy.icps.filter((item) => item.active), [strategy.icps]);
  const activePillars = useMemo(
    () => strategy.contentPillars.filter((item) => item.active),
    [strategy.contentPillars],
  );
  const activeFunnels = useMemo(
    () => strategy.funnelStages.filter((item) => item.active),
    [strategy.funnelStages],
  );
  const activeGoals = useMemo(
    () => strategy.conversionGoals.filter(
      (item) => item.active && item.funnelStageId.toString() === brief.funnelStageId,
    ),
    [brief.funnelStageId, strategy.conversionGoals],
  );
  const sourceLocation = isInternalSource(source.sourceType) ? "INTERNAL" : "EXTERNAL";
  const sourceTrust = trustForSource(source.sourceType);
  const legalClaim = source.claimType === "LEGAL";
  const lines = (value: string) => value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  const strategyComplete = Boolean(
    brief.uspId && brief.icpId && brief.contentPillarId
      && brief.funnelStageId && brief.conversionGoalId,
  );
  const briefComplete = Boolean(
    strategyComplete && brief.workingTitle.trim() && brief.purpose.trim()
      && lines(brief.targetQueries).length && lines(brief.sourceRequirements).length,
  );
  const sourceComplete = Boolean(
    source.claimKey.trim() && source.claimText.trim() && source.title.trim()
      && source.publisher.trim()
      && (sourceLocation === "INTERNAL" ? source.internalReference.trim() : source.url.trim())
      && (!legalClaim || source.legalReviewStatus === "VERIFIED"),
  );

  const completeAction = async (action: () => Promise<unknown>, successKey: string) => {
    try {
      await action();
      toast.success(t(successKey));
      await onChanged();
      await loadStatus();
    } catch (error) {
      logApiError("Editorial authoring action failed", error);
      toast.error(getApiErrorMessage(error, t("admin.marketing.action_failed")));
    }
  };

  const createBrief = async () => {
    if (!status?.canCreateBrief || !briefComplete) return;
    setBusy("brief");
    try {
      await completeAction(
        () => apiClient.post(`/admin/marketing/editorial/topics/${topic.topicId}/briefs`, {
          targetLanguage: language,
          searchIntent: brief.searchIntent,
          workingTitle: brief.workingTitle.trim(),
          purpose: brief.purpose.trim(),
          strategyContext: {
            uspId: Number(brief.uspId),
            icpId: brief.icpId,
            contentPillarId: Number(brief.contentPillarId),
            funnelStageId: Number(brief.funnelStageId),
            conversionGoalId: Number(brief.conversionGoalId),
          },
          targetQueries: lines(brief.targetQueries),
          sourceRequirements: lines(brief.sourceRequirements),
          legalReviewRequired: brief.legalReviewRequired,
          idempotencyKey: `admin-brief-${topic.topicId}-${language}-${crypto.randomUUID()}`,
        }),
        "admin.marketing.editorial_authoring_brief_queued",
      );
    } finally {
      setBusy(null);
    }
  };

  const collectSource = async () => {
    if (!status?.canCollectSources || !status.briefReference || !sourceComplete) return;
    setBusy("source");
    try {
      await completeAction(
        () => apiClient.post("/admin/marketing/editorial/source-collections", {
          articleTopicId: topic.topicId,
          briefReference: status.briefReference,
          claims: [{
            claimKey: source.claimKey.trim(),
            claimText: source.claimText.trim(),
            claimType: source.claimType,
            language: status.briefLanguage ?? language,
            legalReviewRequired: legalClaim,
            sources: [{
              sourceType: source.sourceType,
              locationType: sourceLocation,
              title: source.title.trim(),
              publisher: source.publisher.trim(),
              url: sourceLocation === "EXTERNAL" ? source.url.trim() : null,
              internalReference: sourceLocation === "INTERNAL" ? source.internalReference.trim() : null,
              jurisdiction: source.jurisdiction.trim() || null,
              language: status.briefLanguage ?? language,
              verificationStatus: "VERIFIED",
              trustStatus: sourceTrust,
              legalReviewRequired: legalClaim,
              legalReviewStatus: legalClaim ? source.legalReviewStatus : "NOT_REQUIRED",
              fingerprint: source.fingerprint.trim() || null,
              etag: null,
              lastModified: null,
            }],
          }],
          idempotencyKey: `admin-source-${topic.topicId}-${source.claimKey.trim()}-${crypto.randomUUID()}`,
        }),
        "admin.marketing.editorial_authoring_source_queued",
      );
    } finally {
      setBusy(null);
    }
  };

  const createDraft = async () => {
    if (!status?.canCreateDraft || !status.articleId) return;
    setBusy("draft");
    try {
      await completeAction(
        () => apiClient.post(
          `/admin/marketing/editorial/editor/articles/${status.articleId}/draft-requests`,
          { idempotencyKey: `admin-draft-${status.articleId}-${crypto.randomUUID()}` },
        ),
        "admin.marketing.editorial_authoring_draft_queued",
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="min-w-0 space-y-4 rounded-2xl border border-primary/20 bg-primary/[0.035] p-4 sm:p-5" data-testid="editorial-authoring">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-black">
            <BookOpenCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            {t("admin.marketing.editorial_authoring_title")}
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("admin.marketing.editorial_authoring_description")}
          </p>
        </div>
        <Button
          type="button"
          className="w-full sm:w-auto sm:shrink-0"
          variant="outline"
          onClick={() => void loadStatus()}
          disabled={loading || busy !== null}
          aria-busy={loading}
        >
          <RefreshCw className={loading ? "animate-spin" : ""} />
          {t("admin.marketing.refresh")}
        </Button>
      </div>

      {loading && !status ? <div className="h-24 animate-pulse rounded-xl bg-muted/50" /> : null}
      {status ? (
        <>
          <div className="grid min-w-0 gap-2 sm:grid-cols-3">
            <StatusCard label={t("admin.marketing.editorial_authoring_brief")} value={status.briefStatus ?? status.latestBriefTaskStatus ?? "NOT_STARTED"} />
            <StatusCard label={t("admin.marketing.editorial_authoring_evidence")} value={`${status.claimsSupported}/${status.claimsTotal}`} />
            <StatusCard label={t("admin.marketing.editorial_authoring_draft")} value={status.latestDraftTaskStatus ?? status.lifecycleState ?? "NOT_STARTED"} />
          </div>

          {status.canCreateBrief ? (
            <div className="min-w-0 space-y-4 rounded-xl border border-border/60 bg-background/75 p-4">
              <h4 className="font-bold">1. {t("admin.marketing.editorial_authoring_create_brief")}</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <StrategySelect
                  direction={selectDirection}
                  label={t("admin.marketing.editorial_authoring_search_intent")}
                  value={brief.searchIntent}
                  onChange={(value) => setBrief((current) => ({ ...current, searchIntent: value }))}
                  options={[
                    { value: "INFORMATIONAL", label: "INFORMATIONAL" },
                    { value: "TRANSACTIONAL", label: "TRANSACTIONAL" },
                    { value: "NAVIGATIONAL", label: "NAVIGATIONAL" },
                  ]}
                />
                <FormField label={t("admin.marketing.editorial_authoring_working_title")}>
                  <Input value={brief.workingTitle} maxLength={500} onChange={(event) => setBrief((current) => ({ ...current, workingTitle: event.target.value }))} />
                </FormField>
                <StrategySelect direction={selectDirection} label="USP" value={brief.uspId} onChange={(value) => setBrief((current) => ({ ...current, uspId: value }))} options={activeUsps.map((item) => ({ value: item.id.toString(), label: item.title }))} />
                <StrategySelect direction={selectDirection} label="ICP" value={brief.icpId} onChange={(value) => setBrief((current) => ({ ...current, icpId: value }))} options={activeIcps.map((item) => ({ value: item.id, label: item.name }))} />
                <StrategySelect direction={selectDirection} label={t("admin.marketing.editorial_authoring_pillar")} value={brief.contentPillarId} onChange={(value) => setBrief((current) => ({ ...current, contentPillarId: value }))} options={activePillars.map((item) => ({ value: item.id.toString(), label: item.name }))} />
                <StrategySelect direction={selectDirection} label={t("admin.marketing.editorial_authoring_funnel")} value={brief.funnelStageId} onChange={(value) => setBrief((current) => ({ ...current, funnelStageId: value, conversionGoalId: "" }))} options={activeFunnels.map((item) => ({ value: item.id.toString(), label: item.stageKey }))} />
                <StrategySelect direction={selectDirection} label={t("admin.marketing.editorial_authoring_goal")} disabled={!brief.funnelStageId} value={brief.conversionGoalId} onChange={(value) => setBrief((current) => ({ ...current, conversionGoalId: value }))} options={activeGoals.map((item) => ({ value: item.id.toString(), label: item.name }))} />
              </div>
              <FormField label={t("admin.marketing.editorial_authoring_purpose")}>
                <textarea className={textareaClasses} rows={3} maxLength={4000} value={brief.purpose} onChange={(event) => setBrief((current) => ({ ...current, purpose: event.target.value }))} />
              </FormField>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label={t("admin.marketing.editorial_authoring_queries")}>
                  <textarea className={textareaClasses} rows={4} value={brief.targetQueries} onChange={(event) => setBrief((current) => ({ ...current, targetQueries: event.target.value }))} />
                </FormField>
                <FormField label={t("admin.marketing.editorial_authoring_requirements")}>
                  <textarea className={textareaClasses} rows={4} value={brief.sourceRequirements} onChange={(event) => setBrief((current) => ({ ...current, sourceRequirements: event.target.value }))} />
                </FormField>
              </div>
              <label className="flex items-start gap-2 text-sm font-semibold">
                <input type="checkbox" checked={brief.legalReviewRequired} onChange={(event) => setBrief((current) => ({ ...current, legalReviewRequired: event.target.checked }))} className="mt-0.5 h-4 w-4 accent-primary" />
                {t("admin.marketing.editorial_authoring_legal_review")}
              </label>
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={!briefComplete || busy !== null}
                aria-busy={busy === "brief"}
                onClick={() => void createBrief()}
              >
                {busy === "brief" ? <Loader2 className="animate-spin" /> : <BookOpenCheck />}
                {t("admin.marketing.editorial_authoring_create_brief")}
              </Button>
            </div>
          ) : null}

          {status.briefId ? (
            <div className="min-w-0 space-y-4 rounded-xl border border-border/60 bg-background/75 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold">2. {t("admin.marketing.editorial_authoring_collect_source")}</h4>
                <Badge variant="outline">{status.briefReference}</Badge>
              </div>
              {status.latestSourceTaskStatus === "WAITING_APPROVAL" ? (
                <p className="text-sm font-semibold text-amber-700">{t("admin.marketing.editorial_authoring_source_waiting")}</p>
              ) : null}
              {status.canCollectSources ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label={t("admin.marketing.editorial_authoring_claim_key")}>
                      <Input dir="ltr" value={source.claimKey} maxLength={128} onChange={(event) => setSource((current) => ({ ...current, claimKey: event.target.value }))} />
                    </FormField>
                    <StrategySelect direction={selectDirection} label={t("admin.marketing.editorial_authoring_claim_type")} value={source.claimType} onChange={(value) => setSource((current) => ({ ...current, claimType: value }))} options={CLAIM_TYPES.map((item) => ({ value: item, label: item }))} />
                  </div>
                  <FormField label={t("admin.marketing.editorial_authoring_claim_text")}>
                    <textarea className={textareaClasses} rows={3} maxLength={8000} value={source.claimText} onChange={(event) => setSource((current) => ({ ...current, claimText: event.target.value }))} />
                  </FormField>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <StrategySelect direction={selectDirection} label={t("admin.marketing.editorial_authoring_source_type")} value={source.sourceType} onChange={(value) => setSource((current) => ({ ...current, sourceType: value, url: "", internalReference: "" }))} options={SOURCE_TYPES.map((item) => ({ value: item, label: sourceTypeLabel(item) }))} />
                    <FormField label={t("admin.marketing.editorial_authoring_source_title")}>
                      <Input value={source.title} maxLength={2000} onChange={(event) => setSource((current) => ({ ...current, title: event.target.value }))} />
                    </FormField>
                    <FormField label={t("admin.marketing.editorial_authoring_publisher")}>
                      <Input value={source.publisher} maxLength={255} onChange={(event) => setSource((current) => ({ ...current, publisher: event.target.value }))} />
                    </FormField>
                    <FormField label={sourceLocation === "INTERNAL" ? t("admin.marketing.editorial_authoring_internal_reference") : t("admin.marketing.editorial_authoring_source_url")}>
                      <Input dir="ltr" value={sourceLocation === "INTERNAL" ? source.internalReference : source.url} onChange={(event) => setSource((current) => sourceLocation === "INTERNAL" ? { ...current, internalReference: event.target.value } : { ...current, url: event.target.value })} />
                    </FormField>
                    <FormField label={t("admin.marketing.editorial_authoring_jurisdiction")}>
                      <Input value={source.jurisdiction} maxLength={128} onChange={(event) => setSource((current) => ({ ...current, jurisdiction: event.target.value }))} />
                    </FormField>
                    <FormField label={t("admin.marketing.editorial_authoring_fingerprint")}>
                      <Input dir="ltr" value={source.fingerprint} maxLength={128} onChange={(event) => setSource((current) => ({ ...current, fingerprint: event.target.value }))} />
                    </FormField>
                    {legalClaim ? (
                      <StrategySelect direction={selectDirection} label={t("admin.marketing.editorial_authoring_legal_status")} value={source.legalReviewStatus} onChange={(value) => setSource((current) => ({ ...current, legalReviewStatus: value }))} options={[{ value: "REQUIRES_REVIEW", label: "REQUIRES_REVIEW" }, { value: "VERIFIED", label: "VERIFIED" }]} />
                    ) : null}
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {t("admin.marketing.editorial_authoring_source_policy", { location: sourceLocation, trust: sourceTrust })}
                  </p>
                  <Button
                    type="button"
                    className="w-full sm:w-auto"
                    variant="outline"
                    disabled={!sourceComplete || busy !== null}
                    aria-busy={busy === "source"}
                    onClick={() => void collectSource()}
                  >
                    {busy === "source" ? <Loader2 className="animate-spin" /> : <DatabaseZap />}
                    {t("admin.marketing.editorial_authoring_collect_source")}
                  </Button>
                </>
              ) : null}
            </div>
          ) : null}

          <div className="min-w-0 space-y-3 rounded-xl border border-border/60 bg-background/75 p-4">
            <h4 className="font-bold">3. {t("admin.marketing.editorial_authoring_generate_draft")}</h4>
            <p className="text-sm leading-6 text-muted-foreground">
              {status.canCreateDraft
                ? t("admin.marketing.editorial_authoring_draft_ready")
                : t("admin.marketing.editorial_authoring_draft_blocked")}
            </p>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={!status.canCreateDraft || busy !== null}
              aria-busy={busy === "draft"}
              onClick={() => void createDraft()}
            >
              {busy === "draft" ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {t("admin.marketing.editorial_authoring_generate_draft")}
            </Button>
          </div>
        </>
      ) : null}
    </section>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border/50 bg-background/75 p-3 text-center">
      <span className="block text-xs font-semibold text-muted-foreground">{label}</span>
      <strong className="mt-1 block break-words text-sm">{value.replaceAll("_", " ")}</strong>
    </div>
  );
}

function StrategySelect({
  direction,
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  direction: "ltr" | "rtl";
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  const validOptions = options.filter(
    (option) =>
      Boolean(option.value?.trim()) &&
      Boolean(option.label?.trim()) &&
      option.label.trim().toLowerCase() !== "null" &&
      option.label.trim().toLowerCase() !== "undefined",
  );

  return (
    <div className="min-w-0 space-y-1.5 text-sm font-semibold">
      <span className="block text-muted-foreground">{label}</span>
      <Select
        dir={direction}
        value={value || undefined}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger
          dir="auto"
          aria-label={label}
          className="min-w-0 max-w-full text-start"
        >
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent align="start" sideOffset={6}>
          <SelectGroup>
            {validOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} dir="auto">
                <span className="block break-words text-start">
                  {option.label.trim()}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="min-w-0 space-y-1.5 text-sm font-semibold">
      <span className="block text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function isInternalSource(sourceType: string) {
  return sourceType === "RIJVIA_CORE_DATA" || sourceType === "APPROVED_INTERNAL_SOURCE";
}

function trustForSource(sourceType: string) {
  if (sourceType === "RIJVIA_CORE_DATA") return "CORE_TRUSTED";
  if (sourceType.startsWith("OFFICIAL_")) return "OFFICIAL";
  return "APPROVED_REFERENCE";
}

function sourceTypeLabel(sourceType: string) {
  if (sourceType === "RIJVIA_CORE_DATA") return "RijVia Core Data";
  return sourceType.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const textareaClasses = "w-full resize-y rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15";
