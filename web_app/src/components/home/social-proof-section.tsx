'use client';

import { useLanguage } from '@/contexts/language-context';

export function SocialProofSection() {
    const { t } = useLanguage();

    const stats = [
        {
            value: t('home.social.stat1_value'),
            label: t('home.social.stat1_label'),
        },
        {
            value: t('home.social.stat2_value'),
            label: t('home.social.stat2_label'),
        },
        {
            value: t('home.social.stat3_value'),
            label: t('home.social.stat3_label'),
        },
    ];

    return (
        <section className="relative overflow-hidden bg-gray-50/50 py-12 lg:py-16">
            <div className="container mx-auto px-4">
                {/* Section header */}
                <div className="mb-8 text-center lg:mb-12">
                    <h2 className="mb-3 text-2xl font-bold tracking-tight text-[#2C3E50] md:text-3xl lg:text-4xl">
                        {t('home.social.title')}
                    </h2>
                    <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
                        {t('home.social.subtitle')}
                    </p>
                </div>

                {/* Stats grid - minimal, credible indicators */}
                <div className="grid gap-6 sm:grid-cols-3 lg:gap-8">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition-all hover:shadow-md lg:p-8"
                        >
                            <div className="mb-3 text-4xl font-bold text-[#DF5830] md:text-5xl">
                                {stat.value}
                            </div>
                            <div className="text-sm leading-relaxed text-gray-600 md:text-base">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
