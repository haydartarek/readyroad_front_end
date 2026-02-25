'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SignImage } from '@/components/traffic-signs/sign-image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrafficSign } from '@/lib/types';
import { apiClient, isServiceUnavailable, logApiError } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { useLanguage } from '@/contexts/language-context';

// ─── Category helpers ────────────────────────────────────

interface CategoryOption {
  id: number;
  code: string;
  nameEn: string;
  nameAr: string;
  nameNl: string;
  nameFr: string;
}

function getCategoryColor(code: string): string {
  const colors: Record<string, string> = {
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
  return colors[code] || 'bg-muted text-foreground border-border';
}

// ─── Component ───────────────────────────────────────────

export default function TrafficSignDetailPage() {
  const params = useParams();
  const signCode = params.signCode as string;
  const { t, language, isRTL } = useLanguage();

  const [sign, setSign] = useState<TrafficSign | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [signRes, catRes] = await Promise.all([
          apiClient.get<TrafficSign>(API_ENDPOINTS.TRAFFIC_SIGNS.DETAIL(signCode)),
          apiClient.get<CategoryOption[]>('/categories').catch(() => ({ data: [] as CategoryOption[] })),
        ]);
        setSign(signRes.data);
        setCategories(catRes.data);
      } catch (err) {
        logApiError('Error fetching traffic sign', err);
        if (isServiceUnavailable(err)) {
          setServiceUnavailable(true);
        } else {
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signCode, fetchKey]);

  // ─── Language-aware getters ──────────────────────────

  const getSignName = (s: TrafficSign): string => {
    const map: Record<string, string> = { en: s.nameEn, ar: s.nameAr, nl: s.nameNl, fr: s.nameFr };
    return map[language] || s.nameEn || s.signCode;
  };

  const getSignDescription = (s: TrafficSign, lang: string): string => {
    const map: Record<string, string> = {
      en: s.descriptionEn, ar: s.descriptionAr, nl: s.descriptionNl, fr: s.descriptionFr,
    };
    return map[lang] || '';
  };

  const getLongDescription = (s: TrafficSign, lang: string): string => {
    const map: Record<string, string | undefined> = {
      en: s.longDescriptionEn, ar: s.longDescriptionAr, nl: s.longDescriptionNl, fr: s.longDescriptionFr,
    };
    return map[lang] || '';
  };

  const getSignNameByLang = (s: TrafficSign, lang: string): string => {
    const map: Record<string, string> = { en: s.nameEn, ar: s.nameAr, nl: s.nameNl, fr: s.nameFr };
    return map[lang] || s.nameEn || '';
  };

  const getCategoryLabel = (code: string): string => {
    const cat = categories.find(c => c.code === code);
    if (cat) {
      const map: Record<string, string> = { en: cat.nameEn, ar: cat.nameAr, nl: cat.nameNl, fr: cat.nameFr };
      return map[language] || cat.nameEn;
    }
    const fallback: Record<string, Record<string, string>> = {
      A: { en: 'Danger Signs', ar: 'علامات الخطر', nl: 'Gevaarsborden', fr: 'Panneaux de danger' },
      B: { en: 'Priority Signs', ar: 'علامات الأولوية', nl: 'Voorrangsborden', fr: 'Panneaux de priorité' },
      C: { en: 'Prohibition Signs', ar: 'علامات المنع', nl: 'Verbodsborden', fr: "Panneaux d'interdiction" },
      D: { en: 'Mandatory Signs', ar: 'علامات الإلزام', nl: 'Gebodsborden', fr: "Panneaux d'obligation" },
      E: { en: 'Parking Signs', ar: 'علامات الوقوف', nl: 'Stilstaan en parkeren', fr: 'Stationnement' },
      F: { en: 'Information Signs', ar: 'علامات المعلومات', nl: 'Aanwijzingsborden', fr: "Panneaux d'indication" },
      G: { en: 'Zone Signs', ar: 'علامات المناطق', nl: 'Zoneborden', fr: 'Panneaux de zone' },
      M: { en: 'Additional Signs', ar: 'لوحات إضافية', nl: 'Onderborden', fr: 'Panneaux additionnels' },
      Z: { en: 'Delineation Signs', ar: 'علامات التحديد', nl: 'Afbakeningsborden', fr: 'Panneaux de délimitation' },
    };
    return fallback[code]?.[language] || fallback[code]?.en || code;
  };

  // ─── Loading state ───────────────────────────────────

  if (serviceUnavailable) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <ServiceUnavailableBanner onRetry={() => { setServiceUnavailable(false); setFetchKey(k => k + 1); }} className="mb-4" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted to-background">
        <div className="container mx-auto px-4 py-12">
          <div className="h-8 bg-muted rounded w-32 animate-pulse mb-6" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-card rounded-lg border p-8 space-y-4">
                <div className="h-8 bg-muted rounded w-2/3 animate-pulse" />
                <div className="h-6 bg-muted rounded w-24 animate-pulse" />
                <div className="h-64 bg-muted rounded animate-pulse" />
              </div>
              <div className="bg-card rounded-lg border p-8 space-y-4">
                <div className="h-6 bg-muted rounded w-40 animate-pulse" />
                <div className="h-20 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-card rounded-lg border p-6 h-40 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────

  if (error || !sign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">{t('sign_detail.not_found')}</p>
        <Link href="/traffic-signs">
          <Button variant="outline">
            {isRTL ? '\u2192' : '\u2190'} {t('sign_detail.back_to_all')}
          </Button>
        </Link>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────

  const categoryCode = sign.categoryCode || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background">
      <div className="container mx-auto px-4 py-12">
        {/* Back button */}
        <Link href="/traffic-signs">
          <Button variant="ghost" className="mb-6">
            {isRTL ? '\u2192' : '\u2190'} {t('sign_detail.back_to_all')}
          </Button>
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Sign image card */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl">{getSignName(sign)}</CardTitle>
                    <Badge className={`mt-2 ${getCategoryColor(categoryCode)}`}>
                      {getCategoryLabel(categoryCode)}
                    </Badge>
                  </div>
                  <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                    {sign.signCode}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center rounded-lg bg-card p-8">
                  <div className="relative h-64 w-64">
                    <SignImage
                      src={sign.imageUrl}
                      alt={getSignName(sign)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Multi-language descriptions */}
            <Card>
              <CardHeader>
                <CardTitle>{t('sign_detail.description')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={language} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="en">EN English</TabsTrigger>
                    <TabsTrigger value="ar">AR العربية</TabsTrigger>
                    <TabsTrigger value="nl">NL Nederlands</TabsTrigger>
                    <TabsTrigger value="fr">FR Français</TabsTrigger>
                  </TabsList>

                  {(['en', 'ar', 'nl', 'fr'] as const).map(lang => {
                    const name = getSignNameByLang(sign, lang);
                    const desc = getSignDescription(sign, lang);
                    const nameLabel: Record<string, string> = {
                      en: 'Name', ar: 'الاسم', nl: 'Naam', fr: 'Nom',
                    };
                    const descLabel: Record<string, string> = {
                      en: 'Description', ar: 'الوصف', nl: 'Beschrijving', fr: 'Description',
                    };
                    const longDescLabel: Record<string, string> = {
                      en: 'Detailed Description', ar: 'وصف مفصل', nl: 'Gedetailleerde beschrijving', fr: 'Description détaillée',
                    };
                    const longDesc = getLongDescription(sign, lang);

                    return (
                      <TabsContent
                        key={lang}
                        value={lang}
                        className="space-y-4"
                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      >
                        <div>
                          <h3 className="mb-2 font-semibold text-foreground">{nameLabel[lang]}</h3>
                          {name ? (
                            <p className="text-foreground">{name}</p>
                          ) : (
                            <p className="text-muted-foreground italic">{t('sign_detail.no_name')}</p>
                          )}
                        </div>
                        <div>
                          <h3 className="mb-2 font-semibold text-foreground">{descLabel[lang]}</h3>
                          {desc ? (
                            <p className="text-foreground whitespace-pre-line">{desc}</p>
                          ) : (
                            <p className="text-muted-foreground italic">{t('sign_detail.no_description')}</p>
                          )}
                        </div>
                        <div className="border-t pt-4">
                          <h3 className="mb-2 font-semibold text-foreground">{longDescLabel[lang]}</h3>
                          {longDesc ? (
                            <p className="text-foreground whitespace-pre-line">{longDesc}</p>
                          ) : (
                            <p className="text-muted-foreground italic">{t('sign_detail.no_long_description')}</p>
                          )}
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick info */}
            <Card>
              <CardHeader>
                <CardTitle>{t('sign_detail.quick_info')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('sign_detail.sign_code')}</p>
                  <p className="font-mono font-semibold text-lg">{sign.signCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('sign_detail.category')}</p>
                  <Badge className={`mt-1 ${getCategoryColor(categoryCode)}`}>
                    {getCategoryLabel(categoryCode)}
                  </Badge>
                </div>

                {/* All language names in sidebar */}
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">{t('sign_detail.all_names')}</p>
                  <div className="space-y-1.5">
                    {sign.nameEn && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground w-6">EN</span>
                        <span className="text-sm text-foreground">{sign.nameEn}</span>
                      </div>
                    )}
                    {sign.nameAr && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground w-6">AR</span>
                        <span className="text-sm text-foreground" dir="rtl">{sign.nameAr}</span>
                      </div>
                    )}
                    {sign.nameNl && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground w-6">NL</span>
                        <span className="text-sm text-foreground">{sign.nameNl}</span>
                      </div>
                    )}
                    {sign.nameFr && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground w-6">FR</span>
                        <span className="text-sm text-foreground">{sign.nameFr}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Study tips */}
            <Card>
              <CardHeader>
                <CardTitle>{t('sign_detail.study_tips')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{t('sign_detail.tip_1')}</p>
                <p>{t('sign_detail.tip_2')}</p>
                <p>{t('sign_detail.tip_3')}</p>
                <p>{t('sign_detail.tip_4')}</p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Link href="/practice">
                <Button className="w-full" variant="default">
                  {t('sign_detail.practice_questions')}
                </Button>
              </Link>
              <Link href="/exam">
                <Button className="w-full" variant="outline">
                  {t('sign_detail.take_exam')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
