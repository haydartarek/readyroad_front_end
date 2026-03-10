'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SignImage } from '@/components/traffic-signs/sign-image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrafficSign } from '@/lib/types';
import { apiClient, isServiceUnavailable, logApiError } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Lock, CheckCircle2, BookOpen, Trophy, ChevronRight } from 'lucide-react';
import { getSignStatus, type SignUserProgress } from '@/services';

// ─── Types ──────────────────────────────────────────────

interface CategoryOption {
  id: number; code: string;
  nameEn: string; nameAr: string; nameNl: string; nameFr: string;
}

type Lang = 'en' | 'ar' | 'nl' | 'fr';

// ─── Constants ──────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  A: 'bg-red-100 text-red-800 border-red-200',
  B: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  C: 'bg-red-100 text-red-800 border-red-200',
  D: 'bg-blue-100 text-blue-800 border-blue-200',
  E: 'bg-purple-100 text-purple-800 border-purple-200',
  F: 'bg-green-100 text-green-800 border-green-200',
  G: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  M: 'bg-muted text-foreground border-border',
  Z: 'bg-cyan-100 text-cyan-800 border-cyan-200',
};

const CATEGORY_FALLBACK: Record<string, Record<Lang, string>> = {
  A: { en: 'Danger Signs',      ar: 'علامات الخطر',     nl: 'Gevaarsborden',           fr: 'Panneaux de danger' },
  B: { en: 'Priority Signs',    ar: 'علامات الأولوية',   nl: 'Voorrangsborden',          fr: 'Panneaux de priorité' },
  C: { en: 'Prohibition Signs', ar: 'علامات المنع',      nl: 'Verbodsborden',            fr: "Panneaux d'interdiction" },
  D: { en: 'Mandatory Signs',   ar: 'علامات الإلزام',    nl: 'Gebodsborden',             fr: "Panneaux d'obligation" },
  E: { en: 'Parking Signs',     ar: 'علامات الوقوف',     nl: 'Stilstaan en parkeren',    fr: 'Stationnement' },
  F: { en: 'Information Signs', ar: 'علامات المعلومات',  nl: 'Aanwijzingsborden',        fr: "Panneaux d'indication" },
  G: { en: 'Zone Signs',        ar: 'علامات المناطق',    nl: 'Zoneborden',               fr: 'Panneaux de zone' },
  M: { en: 'Additional Signs',  ar: 'لوحات إضافية',      nl: 'Onderborden',              fr: 'Panneaux additionnels' },
  Z: { en: 'Delineation Signs', ar: 'علامات التحديد',    nl: 'Afbakeningsborden',        fr: 'Panneaux de délimitation' },
};

const FIELD_LABELS: Record<string, Record<Lang, string>> = {
  name: { en: 'Name', ar: 'الاسم', nl: 'Naam', fr: 'Nom' },
  desc: { en: 'Description', ar: 'الوصف', nl: 'Beschrijving', fr: 'Description' },
  long: { en: 'Detailed Description', ar: 'وصف مفصل', nl: 'Gedetailleerde beschrijving', fr: 'Description détaillée' },
};

// ─── Helpers ────────────────────────────────────────────

function getByLang<T extends object>(obj: T, key: string, lang: Lang): string {
  const map = obj as Record<string, string>;
  return map[`${key}${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || '';
}

// ─── Skeleton ───────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background">
      <div className="container mx-auto px-4 py-12">
        <div className="h-8 bg-muted rounded-xl w-32 animate-pulse mb-6" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-2xl border border-border/50 p-8 space-y-4">
              <div className="h-8 bg-muted rounded-xl w-2/3 animate-pulse" />
              <div className="h-6 bg-muted rounded-xl w-24 animate-pulse" />
              <div className="h-64 bg-muted rounded-xl animate-pulse" />
            </div>
            <div className="bg-card rounded-2xl border border-border/50 p-8 space-y-4">
              <div className="h-6 bg-muted rounded-xl w-40 animate-pulse" />
              <div className="h-24 bg-muted rounded-xl animate-pulse" />
            </div>
          </div>
          <div className="space-y-5">
            <div className="bg-card rounded-2xl border border-border/50 p-6 h-48 animate-pulse" />
            <div className="bg-card rounded-2xl border border-border/50 p-6 h-32 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────

export default function TrafficSignDetailPage() {
  const params     = useParams();
  const signCode   = params.signCode as string;
  const { t, language, isRTL } = useLanguage();
  const lang       = language as Lang;

  const [sign, setSign]         = useState<TrafficSign | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const [signProgress, setSignProgress] = useState<SignUserProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true); setError(false);

    Promise.all([
      apiClient.get<TrafficSign>(API_ENDPOINTS.TRAFFIC_SIGNS.DETAIL(signCode)),
      apiClient.get<CategoryOption[]>('/categories').catch(() => ({ data: [] as CategoryOption[] })),
    ])
      .then(([signRes, catRes]) => {
        if (!cancelled) { setSign(signRes.data); setCategories(catRes.data); }
      })
      .catch(err => {
        logApiError('Error fetching traffic sign', err);
        if (!cancelled) {
          if (isServiceUnavailable(err)) setServiceUnavailable(true);
          else setError(true);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [signCode, fetchKey]);

  // Fetch quiz progress for this sign
  useEffect(() => {
    let cancelled = false;
    getSignStatus(signCode)
      .then(p => { if (!cancelled) setSignProgress(p); })
      .catch(() => { /* not logged in or no data — keep null */ })
      .finally(() => { if (!cancelled) setProgressLoading(false); });
    return () => { cancelled = true; };
  }, [signCode]);

  // ── Helpers ──
  const getCategoryColor = (code: string) =>
    CATEGORY_COLORS[code] || 'bg-muted text-foreground border-border';

  const getCategoryLabel = (code: string): string => {
    const cat = categories.find(c => c.code === code);
    if (cat) return getByLang(cat, 'name', lang) || cat.nameEn;
    return CATEGORY_FALLBACK[code]?.[lang] || CATEGORY_FALLBACK[code]?.en || code;
  };

  const getSignName = (s: TrafficSign): string =>
    getByLang(s, 'name', lang) || s.nameEn || s.signCode;

  // ── States ──
  if (serviceUnavailable) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ServiceUnavailableBanner
          onRetry={() => { setServiceUnavailable(false); setFetchKey(k => k + 1); }}
        />
      </div>
    );
  }

  if (loading) return <LoadingSkeleton />;

  if (error || !sign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">{t('sign_detail.not_found')}</p>
        <Button variant="outline" asChild>
          <Link href="/traffic-signs">
            {isRTL ? <ArrowRight className="w-4 h-4 mr-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
            {t('sign_detail.back_to_all')}
          </Link>
        </Button>
      </div>
    );
  }

  const categoryCode = sign.categoryCode || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background">
      <div className="container mx-auto px-4 py-10">

        {/* Back */}
        <Button variant="ghost" size="sm" className="mb-6 gap-2" asChild>
          <Link href="/traffic-signs">
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {t('sign_detail.back_to_all')}
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">

          {/* ── Main ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Sign image card */}
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl md:text-3xl font-black">
                      {getSignName(sign)}
                    </CardTitle>
                    <Badge className={cn('border', getCategoryColor(categoryCode))}>
                      {getCategoryLabel(categoryCode)}
                    </Badge>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-lg flex-shrink-0">
                    {sign.signCode}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center rounded-xl bg-muted/50 p-8">
                  <div className="relative h-56 w-56 md:h-64 md:w-64">
                    <SignImage src={sign.imageUrl} alt={getSignName(sign)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Multi-language descriptions */}
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="font-black">{t('sign_detail.description')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-4">
                  {/* Name */}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-1">
                      {FIELD_LABELS.name[lang]}
                    </h3>
                    {getByLang(sign, 'name', lang)
                      ? <p className="text-foreground font-medium">{getByLang(sign, 'name', lang)}</p>
                      : <p className="text-muted-foreground italic text-sm">{t('sign_detail.no_name')}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-1">
                      {FIELD_LABELS.desc[lang]}
                    </h3>
                    {getByLang(sign, 'description', lang)
                      ? <p className="text-foreground whitespace-pre-line text-base font-medium leading-relaxed">{getByLang(sign, 'description', lang)}</p>
                      : <p className="text-muted-foreground italic text-sm">{t('sign_detail.no_description')}</p>}
                  </div>

                  {/* Long description */}
                  <div className="border-t border-border/40 pt-4">
                    <h3 className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-1">
                      {FIELD_LABELS.long[lang]}
                    </h3>
                    {getByLang(sign, 'longDescription', lang)
                      ? <p className="text-foreground whitespace-pre-line text-base font-medium leading-relaxed">{getByLang(sign, 'longDescription', lang)}</p>
                      : <p className="text-muted-foreground italic text-sm">{t('sign_detail.no_long_description')}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Sign Quiz Section ── */}
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="font-black flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  {t('sign_quiz.quiz_section_title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* ── Practice Card ── */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 transition-colors">
                  <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-background border border-border/40 flex items-center justify-center">
                    <SignImage src={sign.imageUrl} alt={getSignName(sign)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{t('sign_quiz.practice_mode')}</span>
                      {!progressLoading && signProgress?.practiceCompleted && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs border">
                          <CheckCircle2 className="w-3 h-3 mr-1" />{t('sign_quiz.practice_done')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t('sign_quiz.practice_desc')}</p>
                  </div>
                  <Button size="sm" variant="outline" className="flex-shrink-0 rounded-lg" asChild>
                    <Link href={`/traffic-signs/${signCode}/practice`}>
                      {signProgress?.practiceStarted && !signProgress.practiceCompleted
                        ? t('sign_quiz.continue_practice')
                        : signProgress?.practiceCompleted
                          ? t('sign_quiz.practice_again')
                          : t('sign_quiz.start_practice')}
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>

                {/* ── Exam 1 Card ── */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 transition-colors">
                  <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-background border border-border/40 flex items-center justify-center">
                    <SignImage src={sign.imageUrl} alt={getSignName(sign)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{t('sign_quiz.exam_1')}</span>
                      {!progressLoading && signProgress?.exam1Passed && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs border">
                          {t('sign_quiz.passed_badge')}
                        </Badge>
                      )}
                      {!progressLoading && signProgress?.exam1Attempted && !signProgress.exam1Passed && (
                        <Badge className="bg-red-100 text-red-800 border-red-200 text-xs border">
                          {t('sign_quiz.failed_badge')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('sign_quiz.questions_count').replace('{n}', '15')}
                      {' · '}{t('sign_quiz.pass_score')}
                      {signProgress?.exam1BestScorePct != null && ` · ${t('sign_quiz.best_score').replace('{score}', Math.round(signProgress.exam1BestScorePct).toString())}`}
                    </p>
                  </div>
                  <Button size="sm" className="flex-shrink-0 rounded-lg" asChild>
                    <Link href={`/traffic-signs/${signCode}/exam/1`}>
                      {signProgress?.exam1Attempted ? t('sign_quiz.retake_exam') : t('sign_quiz.start_exam')}
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>

                {/* ── Exam 2 Card ── */}
                <div className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border border-border/50 transition-colors",
                  signProgress?.exam2Unlocked ? "bg-muted/30 hover:bg-muted/60" : "bg-muted/10 opacity-75"
                )}>
                  <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-background border border-border/40 flex items-center justify-center">
                    {signProgress?.exam2Unlocked
                      ? <SignImage src={sign.imageUrl} alt={getSignName(sign)} />
                      : <Lock className="w-6 h-6 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{t('sign_quiz.exam_2')}</span>
                      {!signProgress?.exam2Unlocked && (
                        <Badge variant="outline" className="text-xs">
                          <Lock className="w-3 h-3 mr-1" />{t('sign_quiz.locked')}
                        </Badge>
                      )}
                      {signProgress?.exam2Passed && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs border">
                          {t('sign_quiz.passed_badge')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {signProgress?.exam2Unlocked
                        ? `${t('sign_quiz.questions_count').replace('{n}', '15')} · ${t('sign_quiz.pass_score')}`
                        : t('sign_quiz.exam_locked_desc')}
                    </p>
                  </div>
                  {signProgress?.exam2Unlocked ? (
                    <Button size="sm" className="flex-shrink-0 rounded-lg" asChild>
                      <Link href={`/traffic-signs/${signCode}/exam/2`}>
                        {signProgress.exam2Attempted ? t('sign_quiz.retake_exam') : t('sign_quiz.start_exam')}
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  ) : (
                    <Button size="sm" className="flex-shrink-0 rounded-lg" disabled>
                      <Lock className="w-3 h-3 mr-1" />{t('sign_quiz.locked')}
                    </Button>
                  )}
                </div>

              </CardContent>
            </Card>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5">

            {/* Quick info */}
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-black">{t('sign_detail.quick_info')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                    {t('sign_detail.sign_code')}
                  </p>
                  <p className="font-mono font-bold text-lg mt-0.5">{sign.signCode}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                    {t('sign_detail.category')}
                  </p>
                  <Badge className={cn('mt-1.5 border', getCategoryColor(categoryCode))}>
                    {getCategoryLabel(categoryCode)}
                  </Badge>
                </div>

                {/* All names */}
                <div className="border-t border-border/40 pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
                    {FIELD_LABELS.name[lang]}
                  </p>
                  {getByLang(sign, 'name', lang)
                    ? <p className="text-sm text-foreground font-medium" dir={lang === 'ar' ? 'rtl' : 'ltr'}>{getByLang(sign, 'name', lang)}</p>
                    : <p className="text-sm text-muted-foreground italic">{t('sign_detail.no_name')}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Study tips */}
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-black">{t('sign_detail.study_tips')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {['tip_1', 'tip_2', 'tip_3', 'tip_4'].map(tip => (
                  <p key={tip}>{t(`sign_detail.${tip}`)}</p>
                ))}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button className="w-full rounded-xl shadow-md shadow-primary/20" asChild>
                <Link href={`/traffic-signs/${signCode}/practice`}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  {t('sign_quiz.start_practice')}
                </Link>
              </Button>
              <Button className="w-full rounded-xl" variant="outline" asChild>
                <Link href={`/traffic-signs/${signCode}/exam/1`}>
                  <Trophy className="w-4 h-4 mr-2" />
                  {t('sign_quiz.exam_1')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
