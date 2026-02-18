'use client';

import { useLanguage } from '@/contexts/language-context';

/**
 * "What's New" section — shows up to 3 recent content improvements.
 * Uses fallback wording ("Recently improved content") since there is no
 * real-time update feed from the backend yet. No fabricated numbers.
 */
export function WhatsNewSection() {
    const { t } = useLanguage();

    const items = [
        { title: t('home.whats_new.item1_title'), type: t('home.whats_new.type_signs'), date: '2026-02' },
        { title: t('home.whats_new.item2_title'), type: t('home.whats_new.type_questions'), date: '2026-02' },
        { title: t('home.whats_new.item3_title'), type: t('home.whats_new.type_lessons'), date: '2026-01' },
    ];

    return (
        <section className="bg-white py-12 lg:py-16">
            <div className="container mx-auto px-4">
                <div className="mb-8 text-center">
                    <h2 className="mb-2 text-2xl font-bold tracking-tight text-[#2C3E50] md:text-3xl">
                        {t('home.whats_new.fallback_title')}
                    </h2>
                </div>

                <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
                    {items.map((item, i) => (
                        <div
                            key={i}
                            className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-gray-50/50 p-5 transition-shadow hover:shadow-md"
                        >
                            <span className="inline-block w-fit rounded-full bg-[#DF5830]/10 px-3 py-0.5 text-xs font-semibold text-[#DF5830]">
                                {item.type}
                            </span>
                            <p className="text-sm font-medium text-[#2C3E50]">{item.title}</p>
                            <time className="text-xs text-gray-400">{item.date}</time>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
