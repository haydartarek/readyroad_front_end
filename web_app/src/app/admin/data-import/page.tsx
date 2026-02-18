'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useLanguage } from '@/contexts/language-context';

// ─── Types ────────────────────────────────────────────────

interface ImportReport {
    type: string;
    mode: string;        // "PREVIEW" | "IMPORT"
    dryRun: boolean;     // backward compat
    recordsTotal: number;
    created: number;
    updated: number;
    skipped: number;
    warnings: string[];
    errors: string[];
}

interface HistoryRecord {
    id: number;
    performedBy: string;
    performedAt: string;
    importType: string;
    fileName: string;
    fileChecksum: string;
    dryRun: boolean;
    createdCount: number;
    updatedCount: number;
    skippedCount: number;
    status: string;
    errorSummary: string | null;
    warningSummary: string | null;
}

type ImportType = 'signs' | 'lessons' | 'categories' | 'quiz_questions';

const IMPORT_TYPES: { key: ImportType; icon: string; labelKey: string }[] = [
    { key: 'signs', icon: '🚦', labelKey: 'admin.import.type_signs' },
    { key: 'lessons', icon: '📚', labelKey: 'admin.import.type_lessons' },
    { key: 'categories', icon: '📋', labelKey: 'admin.import.type_categories' },
    { key: 'quiz_questions', icon: '❓', labelKey: 'admin.import.type_quiz' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ─── Component ────────────────────────────────────────────

export default function AdminDataImportPage() {
    const { t, language } = useLanguage();
    const isRTL = language === 'ar';

    // State
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

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Load history on mount ──
    const loadHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const res = await apiClient.get<HistoryRecord[]>(API_ENDPOINTS.ADMIN.DATA_IMPORT.HISTORY);
            setHistory(res.data ?? []);
        } catch { setHistory([]); }
        finally { setHistoryLoading(false); }
    }, []);

    useEffect(() => { loadHistory(); }, [loadHistory]);

    // ── File validation ──
    const validateFile = (f: File): string | null => {
        if (!f) return t('admin.import.validation.no_file');
        if (f.size > MAX_FILE_SIZE) return t('admin.import.validation.too_large');
        if (!f.name.toLowerCase().endsWith('.json')) return t('admin.import.validation.invalid_type');
        // Quick JSON parse check
        return null; // will validate on preview
    };

    const handleFileSelect = (f: File | null) => {
        setReport(null);
        if (!f) { setFile(null); setFileError(null); return; }
        const err = validateFile(f);
        setFileError(err);
        setFile(err ? null : f);
    };

    // ── Drag & Drop ──
    const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDragIn = (e: React.DragEvent) => { handleDrag(e); setDragActive(true); };
    const handleDragOut = (e: React.DragEvent) => { handleDrag(e); setDragActive(false); };
    const handleDrop = (e: React.DragEvent) => {
        handleDrag(e);
        setDragActive(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFileSelect(f);
    };

    // ── API calls ──
    const callImport = async (dryRun: boolean) => {
        if (!file) return;
        dryRun ? setPreviewing(true) : setExecuting(true);
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
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Request failed';
            setReport({
                type: selectedType, mode: dryRun ? 'PREVIEW' : 'IMPORT', dryRun, recordsTotal: 0,
                created: 0, updated: 0, skipped: 0,
                warnings: [], errors: [msg],
            });
        } finally {
            dryRun ? setPreviewing(false) : setExecuting(false);
        }
    };

    const hasBlockingErrors = report && report.errors.length > 0;
    const previewDone = report && report.mode === 'PREVIEW' && !hasBlockingErrors;

    // ── Render ──────────────────────────────────────────────
    return (
        <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('admin.import.title')}</h1>
                <p className="text-gray-600 mt-1">{t('admin.import.description')}</p>
            </div>

            {/* ── Type selector ── */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">{t('admin.import.select_type')}</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {IMPORT_TYPES.map(({ key, icon, labelKey }) => (
                        <button
                            key={key}
                            onClick={() => { setSelectedType(key); setFile(null); setFileError(null); setReport(null); }}
                            className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium
                                ${selectedType === key
                                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                        >
                            <span className="text-xl">{icon}</span>
                            <span>{t(labelKey)}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Upload zone ── */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('admin.import.upload_title')}</h2>

                <div
                    onDragEnter={handleDragIn}
                    onDragLeave={handleDragOut}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
                        ${dragActive ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={e => handleFileSelect(e.target.files?.[0] ?? null)}
                    />
                    <div className="text-4xl mb-3">📁</div>
                    <p className="text-gray-600 font-medium">{t('admin.import.upload_drag')}</p>
                    <p className="text-gray-400 text-sm mt-1">{t('admin.import.upload_browse')}</p>
                    <p className="text-gray-400 text-xs mt-2">JSON · {t('admin.import.upload_max_size')}</p>
                </div>

                {/* File info */}
                {file && (
                    <div className="mt-4 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                        <div className="flex items-center gap-2 text-green-700 text-sm">
                            <span>✅</span>
                            <span className="font-medium">{file.name}</span>
                            <span className="text-green-500">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button onClick={() => { setFile(null); setReport(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            className="text-red-500 hover:text-red-700 text-sm font-medium">
                            {t('admin.import.upload_remove')}
                        </button>
                    </div>
                )}
                {fileError && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                        ⚠️ {fileError}
                    </div>
                )}

                {/* Action buttons */}
                <div className="mt-6 flex gap-3 flex-wrap">
                    <button
                        disabled={!file || previewing || executing}
                        onClick={() => callImport(true)}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm
                            disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                    >
                        {previewing ? (
                            <span className="flex items-center gap-2"><Spinner />{t('admin.import.previewing')}</span>
                        ) : (
                            <span>📋 {t('admin.import.preview')}</span>
                        )}
                    </button>
                    <button
                        disabled={!file || !previewDone || executing || previewing}
                        onClick={() => callImport(false)}
                        className="px-5 py-2.5 bg-orange-600 text-white rounded-lg font-medium text-sm
                            disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-700 transition-colors"
                    >
                        {executing ? (
                            <span className="flex items-center gap-2"><Spinner />{t('admin.import.executing')}</span>
                        ) : (
                            <span>✅ {t('admin.import.execute')}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Results panel ── */}
            {report && <ResultsPanel report={report} t={t} />}

            {/* ── History ── */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('admin.import.history_title')}</h2>
                {historyLoading ? (
                    <div className="text-center py-8 text-gray-400"><Spinner /> {t('admin.import.loading')}</div>
                ) : history.length === 0 ? (
                    <p className="text-gray-400 text-center py-6">{t('admin.import.history_empty')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b">
                                    <th className="pb-2 pr-4 w-6"></th>
                                    <th className="pb-2 pr-4">{t('admin.import.history_date')}</th>
                                    <th className="pb-2 pr-4">{t('admin.import.history_user')}</th>
                                    <th className="pb-2 pr-4">{t('admin.import.history_type')}</th>
                                    <th className="pb-2 pr-4">{t('admin.import.history_file')}</th>
                                    <th className="pb-2 pr-4">{t('admin.import.history_mode')}</th>
                                    <th className="pb-2 pr-4">{t('admin.import.history_records')}</th>
                                    <th className="pb-2">{t('admin.import.history_status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(h => {
                                    const isExpanded = expandedRowId === h.id;
                                    const totalRecords = h.createdCount + h.updatedCount + h.skippedCount;
                                    return (
                                        <React.Fragment key={h.id}>
                                            <tr
                                                onClick={() => setExpandedRowId(isExpanded ? null : h.id)}
                                                className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                                            >
                                                <td className="py-2 pr-2 text-gray-400 text-xs">{isExpanded ? '▼' : '▶'}</td>
                                                <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">
                                                    {new Date(h.performedAt).toLocaleString(language)}
                                                </td>
                                                <td className="py-2 pr-4">{h.performedBy}</td>
                                                <td className="py-2 pr-4">
                                                    <TypeBadge type={h.importType} t={t} />
                                                </td>
                                                <td className="py-2 pr-4 text-gray-500 max-w-[150px] truncate" title={h.fileName}>
                                                    {h.fileName}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium
                                                ${h.dryRun ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {h.dryRun ? t('admin.import.history_preview') : t('admin.import.history_import')}
                                                    </span>
                                                </td>
                                                <td className="py-2 pr-4 text-gray-600">{totalRecords}</td>
                                                <td className="py-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium
                                                ${h.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {h.status === 'SUCCESS' ? t('admin.import.history_success') : t('admin.import.history_failed')}
                                                    </span>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan={8} className="px-6 py-4">
                                                        <div className="grid grid-cols-3 gap-4 mb-3">
                                                            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
                                                                <div className="text-lg font-bold text-green-700">{h.createdCount}</div>
                                                                <div className="text-xs text-green-600">{t('admin.import.created')}</div>
                                                            </div>
                                                            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-center">
                                                                <div className="text-lg font-bold text-blue-700">{h.updatedCount}</div>
                                                                <div className="text-xs text-blue-600">{t('admin.import.updated')}</div>
                                                            </div>
                                                            <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-center">
                                                                <div className="text-lg font-bold text-gray-600">{h.skippedCount}</div>
                                                                <div className="text-xs text-gray-500">{t('admin.import.skipped')}</div>
                                                            </div>
                                                        </div>
                                                        {h.warningSummary && (
                                                            <div className="mb-2">
                                                                <h4 className="text-xs font-semibold text-yellow-700 mb-1">⚠️ {t('admin.import.warnings')}</h4>
                                                                <ul className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800 space-y-0.5 max-h-32 overflow-y-auto">
                                                                    {h.warningSummary.split('; ').map((w, i) => <li key={i}>• {w}</li>)}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {h.errorSummary && (
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-red-700 mb-1">❌ {t('admin.import.errors')}</h4>
                                                                <ul className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-800 space-y-0.5 max-h-32 overflow-y-auto">
                                                                    {h.errorSummary.split('; ').map((e, i) => <li key={i}>• {e}</li>)}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {!h.warningSummary && !h.errorSummary && (
                                                            <p className="text-xs text-gray-400">{t('admin.import.history_no_issues')}</p>
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
            </div>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────

function Spinner() {
    return (
        <svg className="animate-spin h-4 w-4 inline-block" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}

function ResultsPanel({ report, t }: { report: ImportReport; t: (k: string) => string }) {
    const isSuccess = report.errors.length === 0;
    const isPreview = report.mode === 'PREVIEW';
    return (
        <div className={`rounded-lg shadow-sm border p-6 ${isSuccess ? 'bg-white' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-gray-800">{t('admin.import.results_title')}</h2>
                {isPreview && (
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                        {t('admin.import.dry_run_badge')}
                    </span>
                )}
                <span className="text-sm text-gray-500 ml-auto">
                    {t('admin.import.records_total')}: {report.recordsTotal}
                </span>
            </div>

            {isPreview && (
                <p className="text-blue-600 text-sm mb-4 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                    ℹ️ {t('admin.import.dry_run_note')}
                </p>
            )}

            {/* Counts */}
            <div className="grid grid-cols-3 gap-4 mb-5">
                <CountCard label={t('admin.import.created')} count={report.created} color="green" />
                <CountCard label={t('admin.import.updated')} count={report.updated} color="blue" />
                <CountCard label={t('admin.import.skipped')} count={report.skipped} color="gray" />
            </div>

            {/* Warnings */}
            {report.warnings.length > 0 && (
                <div className="mb-4">
                    <h3 className="text-sm font-semibold text-yellow-700 mb-2">
                        ⚠️ {t('admin.import.warnings')} ({report.warnings.length})
                    </h3>
                    <ul className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 space-y-1 max-h-40 overflow-y-auto">
                        {report.warnings.map((w, i) => <li key={i}>• {w}</li>)}
                    </ul>
                </div>
            )}

            {/* Errors */}
            {report.errors.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-red-700 mb-2">
                        ❌ {t('admin.import.errors')} ({report.errors.length})
                    </h3>
                    <ul className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 space-y-1 max-h-40 overflow-y-auto">
                        {report.errors.map((e, i) => <li key={i}>• {e}</li>)}
                    </ul>
                </div>
            )}

            {/* All clear message */}
            {isSuccess && !isPreview && (
                <div className="text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 text-sm">
                    ✅ {t('admin.import.success')}
                </div>
            )}
        </div>
    );
}

function CountCard({ label, count, color }: { label: string; count: number; color: string }) {
    const colorMap: Record<string, string> = {
        green: 'bg-green-50 text-green-700 border-green-200',
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        gray: 'bg-gray-50 text-gray-600 border-gray-200',
    };
    return (
        <div className={`rounded-lg border px-4 py-3 text-center ${colorMap[color]}`}>
            <div className="text-2xl font-bold">{count}</div>
            <div className="text-xs font-medium mt-1">{label}</div>
        </div>
    );
}

function TypeBadge({ type, t }: { type: string; t: (k: string) => string }) {
    const map: Record<string, { icon: string; key: string }> = {
        signs: { icon: '🚦', key: 'admin.import.type_signs' },
        lessons: { icon: '📚', key: 'admin.import.type_lessons' },
        categories: { icon: '📋', key: 'admin.import.type_categories' },
        quiz_questions: { icon: '❓', key: 'admin.import.type_quiz' },
    };
    const entry = map[type] || { icon: '📦', key: type };
    return <span className="text-gray-700">{entry.icon} {t(entry.key)}</span>;
}
