'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Globe, ClipboardList, Lock, Save, RotateCcw,
  CheckCircle2, X, Settings2, Info, AlertTriangle,
  Timer, HelpCircle, Percent,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────

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

// ─── Section Header ────────────────────────────────────

function SectionHeader({
  icon, title, color = 'bg-primary/10 text-primary',
}: { icon: React.ReactNode; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <CardTitle className="text-base font-black">{title}</CardTitle>
    </div>
  );
}

// ─── Field ─────────────────────────────────────────────

function Field({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Toggle ────────────────────────────────────────────

function Toggle({ label, description, value, onChange, danger }: {
  label: string; description: string; value: boolean;
  onChange: (v: boolean) => void; danger?: boolean;
}) {
  return (
    <div className={cn(
      'flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all',
      danger && value
        ? 'border-destructive/40 bg-destructive/5'
        : 'border-border/50 hover:border-border',
    )}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-none">{label}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-snug">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30',
          value ? (danger ? 'bg-destructive' : 'bg-green-500') : 'bg-muted',
        )}
      >
        <span className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
          value ? 'translate-x-6' : 'translate-x-1',
        )} />
      </button>
    </div>
  );
}

// ─── Stat Chip ─────────────────────────────────────────

function StatChip({ icon, label, value }: {
  icon: React.ReactNode; label: string; value: string | number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
      <div className="text-white/80">{icon}</div>
      <div>
        <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider leading-none">{label}</p>
        <p className="text-white font-black text-sm leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ──────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-36 rounded-3xl bg-muted" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-52 rounded-2xl bg-muted" />
        <div className="h-52 rounded-2xl bg-muted" />
      </div>
      <div className="h-64 rounded-2xl bg-muted" />
      <div className="h-12 rounded-2xl bg-muted" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────

export default function AdminSettingsPage() {
  const { t } = useLanguage();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsModel>(DEFAULTS);

  const loadSettings = useCallback(() => {
    setLoading(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSettings({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Settings] localStorage read failed, using defaults');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const saveSettings = async () => {
    setSaving(true); setSuccess(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSuccess(t('admin.settings_page.save_success'));
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Settings] localStorage write failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULTS);
    localStorage.removeItem(STORAGE_KEY);
    setSuccess(t('admin.settings_page.reset_success'));
    setTimeout(() => setSuccess(null), 3000);
  };

  const update = <K extends keyof SettingsModel>(key: K, value: SettingsModel[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const inputClass =
    'w-full rounded-xl border border-border/50 bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all';

  const scoreColor =
    settings.passingScorePercent >= 80
      ? 'bg-green-500/10 text-green-600 border-green-500/30'
      : settings.passingScorePercent >= 65
        ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
        : 'bg-destructive/10 text-destructive border-destructive/30';

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 px-8 py-8 shadow-xl shadow-primary/20">
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Settings2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-none">
                {t('admin.settings_page.title')}
              </h1>
              <p className="text-white/65 text-sm mt-1 font-medium">
                {t('admin.settings_page.description')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <StatChip icon={<HelpCircle className="w-4 h-4" />} label="Questions" value={settings.examQuestions} />
            <StatChip icon={<Timer className="w-4 h-4" />} label="Duration" value={`${settings.examDurationMinutes} min`} />
            <StatChip icon={<Percent className="w-4 h-4" />} label="Pass Score" value={`${settings.passingScorePercent}%`} />
          </div>
        </div>
      </div>

      {/* ── Action Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {settings.maintenanceMode && (
            <Badge variant="destructive" className="gap-1.5 px-3 py-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Maintenance Mode Active
            </Badge>
          )}
          {!settings.allowRegistrations && (
            <Badge variant="outline" className="gap-1.5 px-3 py-1 border-amber-500/30 text-amber-600 bg-amber-500/5">
              <Lock className="w-3.5 h-3.5" />
              Registrations Disabled
            </Badge>
          )}
        </div>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={resetSettings} disabled={saving} className="gap-2 rounded-xl">
            <RotateCcw className="w-4 h-4" />
            {t('admin.settings_page.reset')}
          </Button>
          <Button
            onClick={saveSettings} disabled={saving}
            className="gap-2 rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:scale-[1.01] transition-all disabled:shadow-none disabled:scale-100"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                {t('admin.settings_page.saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('admin.settings_page.save')}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Success Banner ── */}
      {success && (
        <div className="flex items-center justify-between rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 font-semibold">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {success}
          </span>
          <button onClick={() => setSuccess(null)} className="hover:opacity-70 transition-opacity ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Two-column: General + Access ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* General */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <SectionHeader icon={<Globe className="w-4 h-4" />} title={t('admin.settings_page.section_general')} />
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label={t('admin.settings_page.site_name')}>
              <input
                type="text"
                value={settings.siteName}
                onChange={e => update('siteName', e.target.value)}
                className={inputClass}
                placeholder="ReadyRoad"
              />
            </Field>
            <Field label={t('admin.settings_page.default_language')}>
              <Select
                value={settings.defaultLanguage}
                onValueChange={v => update('defaultLanguage', v as SettingsModel['defaultLanguage'])}
              >
                <SelectTrigger className="w-full rounded-xl border-border/50 focus:ring-primary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="en">
                    <span className="flex items-center gap-2">🇬🇧 English</span>
                  </SelectItem>
                  <SelectItem value="ar">
                    <span className="flex items-center gap-2">🇸🇦 Arabic — العربية</span>
                  </SelectItem>
                  <SelectItem value="nl">
                    <span className="flex items-center gap-2">🇧🇪 Dutch — Nederlands</span>
                  </SelectItem>
                  <SelectItem value="fr">
                    <span className="flex items-center gap-2">🇫🇷 French — Français</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>

        {/* Access Control */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <SectionHeader
              icon={<Lock className="w-4 h-4" />}
              title={t('admin.settings_page.section_access')}
              color="bg-amber-500/10 text-amber-600"
            />
          </CardHeader>
          <CardContent className="space-y-3">
            <Toggle
              label={t('admin.settings_page.allow_registrations')}
              description={t('admin.settings_page.allow_registrations_desc')}
              value={settings.allowRegistrations}
              onChange={v => update('allowRegistrations', v)}
            />
            <Toggle
              label={t('admin.settings_page.maintenance_mode')}
              description={t('admin.settings_page.maintenance_mode_desc')}
              value={settings.maintenanceMode}
              onChange={v => update('maintenanceMode', v)}
              danger={settings.maintenanceMode}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Exam Configuration — full width ── */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <SectionHeader
            icon={<ClipboardList className="w-4 h-4" />}
            title={t('admin.settings_page.section_exam')}
            color="bg-blue-500/10 text-blue-600"
          />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label={t('admin.settings_page.exam_questions')} hint={t('admin.settings_page.exam_questions_hint')}>
              <div className="relative">
                <HelpCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number" min={10} max={100}
                  value={settings.examQuestions}
                  onChange={e => update('examQuestions', Number(e.target.value))}
                  className={cn(inputClass, 'pl-9')}
                />
              </div>
            </Field>
            <Field label={t('admin.settings_page.exam_duration')} hint={t('admin.settings_page.exam_duration_hint')}>
              <div className="relative">
                <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number" min={10} max={120}
                  value={settings.examDurationMinutes}
                  onChange={e => update('examDurationMinutes', Number(e.target.value))}
                  className={cn(inputClass, 'pl-9')}
                />
              </div>
            </Field>
            <Field label={t('admin.settings_page.passing_score')} hint={t('admin.settings_page.passing_score_hint')}>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={50} max={100}
                  value={settings.passingScorePercent}
                  onChange={e => update('passingScorePercent', Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <div className={cn('w-14 h-9 rounded-xl flex items-center justify-center text-sm font-black border flex-shrink-0', scoreColor)}>
                  {settings.passingScorePercent}%
                </div>
              </div>
            </Field>
          </div>

          {/* Preview chips */}
          <div className="flex flex-wrap gap-3 rounded-2xl border border-border/40 bg-muted/30 p-4">
            <p className="w-full text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Current exam config
            </p>
            <div className="flex items-center gap-2 rounded-xl bg-background border border-border/50 px-3 py-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">{settings.examQuestions}</span>
              <span className="text-xs text-muted-foreground">questions</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-background border border-border/50 px-3 py-2">
              <Timer className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold">{settings.examDurationMinutes}</span>
              <span className="text-xs text-muted-foreground">minutes</span>
            </div>
            <div className={cn('flex items-center gap-2 rounded-xl border px-3 py-2', scoreColor)}>
              <Percent className="w-4 h-4" />
              <span className="text-sm font-bold">{settings.passingScorePercent}%</span>
              <span className="text-xs opacity-70">to pass</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('admin.settings_page.local_storage_note')}
        </p>
      </div>

    </div>
  );
}
