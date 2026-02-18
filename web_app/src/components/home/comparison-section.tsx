'use client';

import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function ComparisonSection() {
    const { t } = useLanguage();
    const { isAuthenticated, isLoading } = useAuth();

    const comparisonData = [
        {
            feature: t('home.comparison.feature_format'),
            readyroad: t('home.comparison.value_format_rr'),
            traditional: t('home.comparison.value_format_trad'),
        },
        {
            feature: t('home.comparison.feature_feedback'),
            readyroad: t('home.comparison.value_feedback_rr'),
            traditional: t('home.comparison.value_feedback_trad'),
        },
        {
            feature: t('home.comparison.feature_analytics'),
            readyroad: t('home.comparison.value_analytics_rr'),
            traditional: t('home.comparison.value_analytics_trad'),
        },
        {
            feature: t('home.comparison.feature_signs'),
            readyroad: t('home.comparison.value_signs_rr'),
            traditional: t('home.comparison.value_signs_trad'),
        },
        {
            feature: t('home.comparison.feature_lessons'),
            readyroad: t('home.comparison.value_lessons_rr'),
            traditional: t('home.comparison.value_lessons_trad'),
        },
        {
            feature: t('home.comparison.feature_access'),
            readyroad: t('home.comparison.value_access_rr'),
            traditional: t('home.comparison.value_access_trad'),
        },
    ];

    /** Evidence-based claims backed by real features */
    const evidence = [
        { icon: 'chart', text: t('home.why.evidence_analytics') },
        { icon: 'sign', text: t('home.why.evidence_signs') },
        { icon: 'clock', text: t('home.why.evidence_exam') },
        { icon: 'globe', text: t('home.why.evidence_multilingual') },
    ];

    return (
        <section className="relative overflow-hidden bg-white py-16 lg:py-24">
            <div className="pointer-events-none absolute start-0 top-0 h-96 w-96 ltr:-translate-x-32 rtl:translate-x-32 -translate-y-32 rounded-full bg-gradient-to-br from-blue-100/30 to-transparent blur-3xl" />

            <div className="container relative mx-auto px-4">
                <div className="mb-12 text-center lg:mb-16">
                    <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#2C3E50] md:text-4xl lg:text-5xl">
                        {t('home.comparison.title')}
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
                        {t('home.comparison.subtitle')}
                    </p>
                </div>

                {/* Evidence bullets */}
                <div className="mx-auto mb-10 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {evidence.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span className="text-sm text-gray-700">{item.text}</span>
                        </div>
                    ))}
                </div>

                {/* Comparison table */}
                <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/50">
                                    <th className="px-6 py-4 text-start text-sm font-semibold text-gray-600"></th>
                                    <th className="px-6 py-4 text-center text-sm font-bold text-white">
                                        <span className="inline-block rounded-full bg-[#DF5830] px-4 py-1.5">
                                            {t('home.comparison.readyroad')}
                                        </span>
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">
                                        {t('home.comparison.traditional')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonData.map((row, index) => (
                                    <tr
                                        key={index}
                                        className={`border-b border-gray-100 transition-colors hover:bg-gray-50/30 ${index === comparisonData.length - 1 ? 'border-b-0' : ''}`}
                                    >
                                        <td className="px-6 py-5 text-sm font-medium text-gray-700">{row.feature}</td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1 text-sm font-semibold text-green-800">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                                {row.readyroad}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center text-sm text-gray-500">{row.traditional}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CTA below comparison table */}
                <div className="mt-10 text-center">
                    {isLoading ? (
                        <div className="mx-auto h-12 w-56 animate-pulse rounded-full bg-gray-200" />
                    ) : isAuthenticated ? (
                        <Link href="/dashboard">
                            <Button size="lg" className="h-12 rounded-full bg-[#DF5830] px-8 text-base font-bold shadow-md transition-all hover:bg-[#c94d2a] hover:shadow-lg">
                                {t('home.hero.cta_auth_primary')}
                            </Button>
                        </Link>
                    ) : (
                        <Link href="/practice">
                            <Button size="lg" className="h-12 rounded-full bg-[#DF5830] px-8 text-base font-bold shadow-md transition-all hover:bg-[#c94d2a] hover:shadow-lg">
                                {t('home.comparison.cta_text')}
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Disclaimer: not affiliated with official authorities */}
                <p className="mx-auto mt-8 max-w-2xl text-center text-xs italic text-gray-400">
                    {t('home.why.disclaimer')}
                </p>
            </div>
        </section>
    );
}
