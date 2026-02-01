'use client';

import { useLanguage } from '@/contexts/language-context';

export function ComparisonSection() {
    const { t } = useLanguage();

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

    return (
        <section className="relative overflow-hidden bg-white py-16 lg:py-24">
            {/* Background gradient */}
            <div className="pointer-events-none absolute start-0 top-0 h-96 w-96 ltr:-translate-x-32 rtl:translate-x-32 -translate-y-32 rounded-full bg-gradient-to-br from-blue-100/30 to-transparent blur-3xl" />

            <div className="container relative mx-auto px-4">
                {/* Section header */}
                <div className="mb-12 text-center lg:mb-16">
                    <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#2C3E50] md:text-4xl lg:text-5xl">
                        {t('home.comparison.title')}
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
                        {t('home.comparison.subtitle')}
                    </p>
                </div>

                {/* Comparison table */}
                <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/50">
                                    <th className="px-6 py-4 text-start text-sm font-semibold text-gray-600"></th>
                                    <th className="px-6 py-4 text-center text-sm font-bold text-[#DF5830]">
                                        {t('home.comparison.readyroad')}
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
                                        className={`border-b border-gray-100 transition-colors hover:bg-gray-50/30 ${index === comparisonData.length - 1 ? 'border-b-0' : ''
                                            }`}
                                    >
                                        <td className="px-6 py-5 text-sm font-medium text-gray-700">
                                            {row.feature}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="#27AE60"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                                {row.readyroad}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center text-sm text-gray-500">
                                            {row.traditional}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}
