'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/language-context';

type SettingsModel = {
    siteName: string;
    defaultLanguage: 'en' | 'ar' | 'nl' | 'fr';
    maintenanceMode: boolean;
    allowRegistrations: boolean;
    examQuestions: number;
    examDurationMinutes: number;
    passingScorePercent: number;
};

const DEFAULTS: SettingsModel = {
    siteName: 'ReadyRoad',
    defaultLanguage: 'en',
    maintenanceMode: false,
    allowRegistrations: true,
    examQuestions: 50,
    examDurationMinutes: 45,
    passingScorePercent: 82,
};

const STORAGE_KEY = 'readyroad_admin_settings';

export default function AdminSettingsPage() {
    const { t } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [settings, setSettings] = useState<SettingsModel>(DEFAULTS);

    // Load from localStorage
    const loadSettings = useCallback(() => {
        setLoading(true);
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setSettings({ ...DEFAULTS, ...parsed });
            }
        } catch {
            // Safari private mode / quota exceeded — use defaults silently
            if (process.env.NODE_ENV !== 'production') {
                console.warn('[Settings] localStorage read failed, using defaults');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Save to localStorage
    const saveSettings = async () => {
        setSaving(true);
        setSuccess(null);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            setSuccess(t('admin.settings_page.save_success'));
            setTimeout(() => setSuccess(null), 3000);
        } catch {
            // Safari private mode / quota exceeded — save failed silently
            if (process.env.NODE_ENV !== 'production') {
                console.warn('[Settings] localStorage write failed');
            }
        } finally {
            setSaving(false);
        }
    };

    // Reset to defaults
    const resetSettings = () => {
        setSettings(DEFAULTS);
        localStorage.removeItem(STORAGE_KEY);
        setSuccess(t('admin.settings_page.reset_success'));
        setTimeout(() => setSuccess(null), 3000);
    };

    const updateField = <K extends keyof SettingsModel>(key: K, value: SettingsModel[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('admin.settings_page.title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('admin.settings_page.description')}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={resetSettings}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                        disabled={loading || saving}
                    >
                        {t('admin.settings_page.reset')}
                    </button>
                    <button
                        onClick={saveSettings}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                        disabled={loading || saving}
                    >
                        {saving ? t('admin.settings_page.saving') : t('admin.settings_page.save')}
                    </button>
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center justify-between">
                    <span>{success}</span>
                    <button onClick={() => setSuccess(null)} className="ml-3 text-green-500 hover:text-green-700 font-bold">&times;</button>
                </div>
            )}

            {/* General Settings */}
            <Section title={t('admin.settings_page.section_general')} icon="🌐">
                <Field label={t('admin.settings_page.site_name')}>
                    <input
                        type="text"
                        value={settings.siteName}
                        onChange={e => updateField('siteName', e.target.value)}
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-ring focus:ring-1 focus:ring-ring outline-none"
                        placeholder="ReadyRoad"
                        disabled={loading}
                    />
                </Field>

                <Field label={t('admin.settings_page.default_language')}>
                    <select
                        value={settings.defaultLanguage}
                        onChange={e => updateField('defaultLanguage', e.target.value as any)}
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-ring focus:ring-1 focus:ring-ring outline-none"
                        disabled={loading}
                    >
                        <option value="en">English</option>
                        <option value="ar">العربية (Arabic)</option>
                        <option value="nl">Nederlands (Dutch)</option>
                        <option value="fr">Fran&ccedil;ais (French)</option>
                    </select>
                </Field>
            </Section>

            {/* Exam Settings */}
            <Section title={t('admin.settings_page.section_exam')} icon="📝">
                <Field label={t('admin.settings_page.exam_questions')}>
                    <input
                        type="number"
                        min={10}
                        max={100}
                        value={settings.examQuestions}
                        onChange={e => updateField('examQuestions', Number(e.target.value))}
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-ring focus:ring-1 focus:ring-ring outline-none"
                        disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t('admin.settings_page.exam_questions_hint')}</p>
                </Field>

                <Field label={t('admin.settings_page.exam_duration')}>
                    <input
                        type="number"
                        min={10}
                        max={120}
                        value={settings.examDurationMinutes}
                        onChange={e => updateField('examDurationMinutes', Number(e.target.value))}
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-ring focus:ring-1 focus:ring-ring outline-none"
                        disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t('admin.settings_page.exam_duration_hint')}</p>
                </Field>

                <Field label={t('admin.settings_page.passing_score')}>
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min={50}
                            max={100}
                            value={settings.passingScorePercent}
                            onChange={e => updateField('passingScorePercent', Number(e.target.value))}
                            className="flex-1"
                            disabled={loading}
                        />
                        <span className="text-sm font-bold text-foreground w-12 text-center">{settings.passingScorePercent}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t('admin.settings_page.passing_score_hint')}</p>
                </Field>
            </Section>

            {/* Access Settings */}
            <Section title={t('admin.settings_page.section_access')} icon="🔒">
                <Toggle
                    label={t('admin.settings_page.allow_registrations')}
                    description={t('admin.settings_page.allow_registrations_desc')}
                    value={settings.allowRegistrations}
                    onChange={v => updateField('allowRegistrations', v)}
                    disabled={loading}
                />

                <Toggle
                    label={t('admin.settings_page.maintenance_mode')}
                    description={t('admin.settings_page.maintenance_mode_desc')}
                    value={settings.maintenanceMode}
                    onChange={v => updateField('maintenanceMode', v)}
                    disabled={loading}
                    danger={settings.maintenanceMode}
                />
            </Section>

            {/* Info */}
            <div className="rounded-lg border bg-muted px-4 py-3 text-xs text-muted-foreground">
                {t('admin.settings_page.local_storage_note')}
            </div>
        </div>
    );
}

// ─── Sub-components ─────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return (
        <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span>{icon}</span>
                    {title}
                </h3>
            </div>
            <div className="p-5 space-y-5">
                {children}
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
            {children}
        </div>
    );
}

function Toggle({ label, description, value, onChange, disabled, danger }: {
    label: string;
    description: string;
    value: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
    danger?: boolean;
}) {
    return (
        <div className={`flex items-center justify-between gap-4 rounded-lg border p-4 ${danger ? 'border-red-200 bg-red-50/30' : ''}`}>
            <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={value}
                onClick={() => onChange(!value)}
                disabled={disabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 ${value
                    ? danger ? 'bg-red-500' : 'bg-blue-600'
                    : 'bg-input'
                    }`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${value ? 'translate-x-6' : 'translate-x-1'
                    }`} />
            </button>
        </div>
    );
}
