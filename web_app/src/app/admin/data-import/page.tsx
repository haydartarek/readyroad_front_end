'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient, isServiceUnavailable, logApiError } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useLanguage } from '@/contexts/language-context';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Upload, ChevronDown, ChevronRight, RefreshCw, X, Eye, Play } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────

interface ImportReport {
  type: string; mode: string; dryRun: boolean;
  recordsTotal: number; created: number; updated: number; skipped: number;
  warnings: string[]; errors: string[];
}
interface HistoryRecord {
  id: number; performedBy: string; performedAt: string;
  importType: string; fileName: string; fileChecksum: string;
  dryRun: boolean; createdCount: number; updatedCount: number;
  skippedCount: number; status: string;
  errorSummary: string | null; warningSummary: string | null;
}
type ImportType = 'signs' | 'lessons' | 'categories' | 'quiz_questions';

const IMPORT_TYPES: { key: ImportType; icon: string; labelKey: string }[] = [
  { key: 'signs',          icon: '🚦', labelKey: 'admin.import.type_signs' },
  { key: 'lessons',        icon: '📚', labelKey: 'admin.import.type_lessons' },
  { key: 'categories',     icon: '📋', labelKey: 'admin.import.type_categories' },
  { key: 'quiz_questions', icon: '❓', labelKey: 'admin.import.type_quiz' },
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ─── Sub-components ───────────────────────────────────────

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin h-4 w-4', className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function SectionCard({ title, children, className }: {
  title: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-4', className)}>
      <h2 className="text-base font-black text-foreground">{title}</h2>
      {children}
    </div>
  );
}

function CountCard({ label, count, colorClass, bgClass }: {
  label: string; count: number; colorClass: string; bgClass: string;
}) {
  return (
    <div className={cn('rounded-xl border px-4 py-3 text-center', bgClass)}>
      <div className={cn('text-2xl font-black', colorClass)}>{count}</div>
      <div className="text-xs font-semibold mt-1 text-muted-foreground">{label}</div>
    </div>
  );
}

function TypeBadge({ type, t }: { type: string; t: (k: string) => string }) {
  const map: Record<string, { icon: string; key: string }> = {
    signs:          { icon: '🚦', key: 'admin.import.type_signs' },
    lessons:        { icon: '📚', key: 'admin.import.type_lessons' },
    categories:     { icon: '📋', key: 'admin.import.type_categories' },
    quiz_questions: { icon: '❓', key: 'admin.import.type_quiz' },
  };
  const entry = map[type] || { icon: '📦', key: type };
  return <span className="text-sm font-medium text-foreground">{entry.icon} {t(entry.key)}</span>;
}

function ResultsPanel({ report, t }: { report: ImportReport; t: (k: string) => string }) {
  const isSuccess = report.errors.length === 0;
  const isPreview = report.mode === 'PREVIEW';
  return (
    <div className={cn(
      'rounded-2xl border shadow-sm p-5 space-y-4',
      isSuccess ? 'bg-card border-border/50' : 'bg-destructive/5 border-destructive/30'
    )}>
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-base font-black text-foreground">{t('admin.import.results_title')}</h2>
        {isPreview && (
          <Badge className="bg-blue-500/10 text-blue-600 border-0 text-xs">
            {t('admin.import.dry_run_badge')}
          </Badge>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {t('admin.import.records_total')}: <strong>{report.recordsTotal}</strong>
        </span>
      </div>

      {isPreview && (
        <div className="flex items-start gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 px-3 py-2.5 text-sm text-blue-600">
          ℹ️ {t('admin.import.dry_run_note')}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <CountCard label={t('admin.import.created')} count={report.created}
          colorClass="text-green-600" bgClass="bg-green-500/10 border-green-500/20" />
        <CountCard label={t('admin.import.updated')} count={report.updated}
          colorClass="text-blue-600" bgClass="bg-blue-500/10 border-blue-500/20" />
        <CountCard label={t('admin.import.skipped')} count={report.skipped}
          colorClass="text-muted-foreground" bgClass="bg-muted/50 border-border/40" />
      </div>

      {report.warnings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-amber-600">
            ⚠️ {t('admin.import.warnings')} ({report.warnings.length})
          </h3>
          <ul className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-700 space-y-1 max-h-40 overflow-y-auto">
            {report.warnings.map((w, i) => <li key={i}>• {w}</li>)}
          </ul>
        </div>
      )}

      {report.errors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-destructive">
            ❌ {t('admin.import.errors')} ({report.errors.length})
          </h3>
          <ul className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive space-y-1 max-h-40 overflow-y-auto">
            {report.errors.map((e, i) => <li key={i}>• {e}</li>)}
          </ul>
        </div>
      )}

      {isSuccess && !isPreview && (
        <div className="flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 px-3 py-2.5 text-sm text-green-600 font-semibold">
          ✅ {t('admin.import.success')}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────

export default function AdminDataImportPage() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const [selectedType, setSelectedType] = useState<ImportType>('signs');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await apiClient.get<HistoryRecord[]>(API_ENDPOINTS.ADMIN.DATA_IMPORT.HISTORY);
      setHistory(res.data ?? []);
    } catch (err) {
      logApiError('Failed to load import history', err);
      if (isServiceUnavailable(err)) setServiceUnavailable(true);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const validateFile = (f: File): string | null => {
    if (!f) return t('admin.import.validation.no_file');
    if (f.size > MAX_FILE_SIZE) return t('admin.import.validation.too_large');
    if (!f.name.toLowerCase().endsWith('.json')) return t('admin.import.validation.invalid_type');
    return null;
  };

  const handleFileSelect = (f: File | null) => {
    setReport(null);
    if (!f) { setFile(null); setFileError(null); return; }
    const err = validateFile(f);
    setFileError(err);
    setFile(err ? null : f);
  };

  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragIn = (e: React.DragEvent) => { handleDrag(e); setDragActive(true); };
  const handleDragOut = (e: React.DragEvent) => { handleDrag(e); setDragActive(false); };
  const handleDrop = (e: React.DragEvent) => {
    handleDrag(e); setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  };

  const callImport = async (dryRun: boolean) => {
    if (!file) return;
    if (dryRun) { setPreviewing(true); } else { setExecuting(true); }
    setReport(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const endpoint = dryRun
        ? API_ENDPOINTS.ADMIN.DATA_IMPORT.PREVIEW(selectedType)
        : API_ENDPOINTS.ADMIN.DATA_IMPORT.EXECUTE(selectedType);
      const res = await apiClient.post<ImportReport>(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReport(res.data);
      loadHistory();
    } catch (err: unknown) {
      logApiError('Data import failed', err);
      if (isServiceUnavailable(err)) {
        setServiceUnavailable(true);
      } else {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Request failed';
        setReport({
          type: selectedType, mode: dryRun ? 'PREVIEW' : 'IMPORT', dryRun,
          recordsTotal: 0, created: 0, updated: 0, skipped: 0,
          warnings: [], errors: [msg],
        });
      }
    } finally {
      if (dryRun) { setPreviewing(false); } else { setExecuting(false); }
    }
  };

  const hasBlockingErrors = report && report.errors.length > 0;
  const previewDone = report && report.mode === 'PREVIEW' && !hasBlockingErrors;

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>

      {serviceUnavailable && <ServiceUnavailableBanner onRetry={loadHistory} />}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t('admin.import.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('admin.import.description')}</p>
        </div>
        <Button variant="outline" onClick={loadHistory} disabled={historyLoading} className="gap-2">
          <RefreshCw className={cn('w-4 h-4', historyLoading && 'animate-spin')} />
          {t('admin.analytics.refresh')}
        </Button>
      </div>

      {/* Type Selector */}
      <SectionCard title={t('admin.import.select_type')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {IMPORT_TYPES.map(({ key, icon, labelKey }) => (
            <button
              key={key}
              onClick={() => { setSelectedType(key); setFile(null); setFileError(null); setReport(null); }}
              className={cn(
                'flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold',
                selectedType === key
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/50 bg-muted/30 text-muted-foreground hover:border-primary/30 hover:bg-primary/5'
              )}
            >
              <span className="text-xl">{icon}</span>
              <span>{t(labelKey)}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Upload Zone */}
      <SectionCard title={t('admin.import.upload_title')}>
        <div
          onDragEnter={handleDragIn} onDragLeave={handleDragOut}
          onDragOver={handleDrag} onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200',
            dragActive
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border/50 hover:border-primary/40 hover:bg-muted/30'
          )}
        >
          <input
            ref={fileInputRef} type="file" accept=".json" className="hidden"
            onChange={e => handleFileSelect(e.target.files?.[0] ?? null)}
          />
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-7 h-7 text-primary" />
          </div>
          <p className="font-bold text-foreground">{t('admin.import.upload_drag')}</p>
          <p className="text-muted-foreground text-sm mt-1">{t('admin.import.upload_browse')}</p>
          <p className="text-muted-foreground text-xs mt-2 font-medium">
            JSON · {t('admin.import.upload_max_size')}
          </p>
        </div>

        {/* File info */}
        {file && (
          <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <span>✅</span>
              <span>{file.name}</span>
              <span className="text-green-500/70">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button
              onClick={() => { setFile(null); setReport(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="text-destructive hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {fileError && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-destructive text-sm">
            ⚠️ {fileError}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <Button
            disabled={!file || previewing || executing}
            onClick={() => callImport(true)}
            variant="outline"
            className="gap-2 border-blue-500/30 text-blue-600 hover:bg-blue-500/5 hover:border-blue-500/50 disabled:opacity-40"
          >
            {previewing ? <Spinner /> : <Eye className="w-4 h-4" />}
            {previewing ? t('admin.import.previewing') : t('admin.import.preview')}
          </Button>
          <Button
            disabled={!file || !previewDone || executing || previewing}
            onClick={() => callImport(false)}
            className="gap-2 shadow-md shadow-primary/20 hover:shadow-lg disabled:opacity-40 disabled:shadow-none"
          >
            {executing ? <Spinner /> : <Play className="w-4 h-4" />}
            {executing ? t('admin.import.executing') : t('admin.import.execute')}
          </Button>
        </div>
      </SectionCard>

      {/* Results */}
      {report && <ResultsPanel report={report} t={t} />}

      {/* History */}
      <SectionCard title={t('admin.import.history_title')}>
        {historyLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Spinner /> {t('admin.import.loading')}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <div className="text-4xl">📭</div>
            <p className="text-sm text-muted-foreground">{t('admin.import.history_empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/40">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border/40">
                <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-3 w-8" />
                  <th className="px-4 py-3 text-left font-semibold">{t('admin.import.history_date')}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('admin.import.history_user')}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('admin.import.history_type')}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('admin.import.history_file')}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('admin.import.history_mode')}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('admin.import.history_records')}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('admin.import.history_status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {history.map(h => {
                  const isExpanded = expandedRowId === h.id;
                  const totalRecords = h.createdCount + h.updatedCount + h.skippedCount;
                  return (
                    <React.Fragment key={h.id}>
                      <tr
                        onClick={() => setExpandedRowId(isExpanded ? null : h.id)}
                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <td className="px-3 py-3 text-muted-foreground">
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4" />
                            : <ChevronRight className="w-4 h-4" />}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                          {new Date(h.performedAt).toLocaleString(language)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">{h.performedBy}</td>
                        <td className="px-4 py-3"><TypeBadge type={h.importType} t={t} /></td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[140px] truncate text-xs" title={h.fileName}>
                          {h.fileName}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn(
                            'border-0 text-xs font-semibold',
                            h.dryRun
                              ? 'bg-blue-500/10 text-blue-600'
                              : 'bg-primary/10 text-primary'
                          )}>
                            {h.dryRun ? t('admin.import.history_preview') : t('admin.import.history_import')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-medium">{totalRecords}</td>
                        <td className="px-4 py-3">
                          <Badge className={cn(
                            'border-0 text-xs font-semibold',
                            h.status === 'SUCCESS'
                              ? 'bg-green-500/10 text-green-600'
                              : 'bg-destructive/10 text-destructive'
                          )}>
                            {h.status === 'SUCCESS' ? `✅ ${t('admin.import.history_success')}` : `❌ ${t('admin.import.history_failed')}`}
                          </Badge>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-muted/20">
                          <td colSpan={8} className="px-6 py-4 space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                              <CountCard label={t('admin.import.created')} count={h.createdCount}
                                colorClass="text-green-600" bgClass="bg-green-500/10 border-green-500/20" />
                              <CountCard label={t('admin.import.updated')} count={h.updatedCount}
                                colorClass="text-blue-600" bgClass="bg-blue-500/10 border-blue-500/20" />
                              <CountCard label={t('admin.import.skipped')} count={h.skippedCount}
                                colorClass="text-muted-foreground" bgClass="bg-muted/50 border-border/40" />
                            </div>
                            {h.warningSummary && (
                              <div className="space-y-1.5">
                                <h4 className="text-xs font-bold text-amber-600">⚠️ {t('admin.import.warnings')}</h4>
                                <ul className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-700 space-y-0.5 max-h-32 overflow-y-auto">
                                  {h.warningSummary.split('; ').map((w, i) => <li key={i}>• {w}</li>)}
                                </ul>
                              </div>
                            )}
                            {h.errorSummary && (
                              <div className="space-y-1.5">
                                <h4 className="text-xs font-bold text-destructive">❌ {t('admin.import.errors')}</h4>
                                <ul className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive space-y-0.5 max-h-32 overflow-y-auto">
                                  {h.errorSummary.split('; ').map((e, i) => <li key={i}>• {e}</li>)}
                                </ul>
                              </div>
                            )}
                            {!h.warningSummary && !h.errorSummary && (
                              <p className="text-xs text-muted-foreground">
                                ✅ {t('admin.import.history_no_issues')}
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
