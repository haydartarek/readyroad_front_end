'use client';

import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function PricingSection() {
    const { t } = useLanguage();

    const features = [
        t('home.pricing.feature1'),
        t('home.pricing.feature2'),
        t('home.pricing.feature3'),
        t('home.pricing.feature4'),
        t('home.pricing.feature5'),
        t('home.pricing.feature6'),
    ];

    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-gray-50/50 to-white py-16 lg:py-24">
            {/* Background gradient */}
            <div className="pointer-events-none absolute end-0 top-0 h-96 w-96 ltr:translate-x-32 rtl:-translate-x-32 -translate-y-32 rounded-full bg-gradient-to-br from-purple-100/30 to-transparent blur-3xl" />

            <div className="container relative mx-auto px-4">
                {/* Section header */}
                <div className="mb-12 text-center lg:mb-16">
                    <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#2C3E50] md:text-4xl lg:text-5xl">
                        {t('home.pricing.title')}
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
                        {t('home.pricing.subtitle')}
                    </p>
                </div>

                {/* Pricing card */}
                <div className="mx-auto max-w-md">
                    <div className="relative overflow-hidden rounded-3xl border-2 border-[#DF5830]/20 bg-gradient-to-br from-white to-gray-50/30 p-8 shadow-xl ring-2 ring-[#DF5830]/10 lg:p-10">
                        {/* Badge */}
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#DF5830]/20 bg-[#DF5830]/10 px-4 py-2 text-sm font-semibold text-[#DF5830]">
                            {t('home.pricing.free_badge')}
                        </div>

                        {/* Title */}
                        <h3 className="mb-4 text-2xl font-bold text-[#2C3E50] lg:text-3xl">
                            {t('home.pricing.free_title')}
                        </h3>

                        {/* Price */}
                        <div className="mb-6 flex items-baseline gap-2">
                            <span className="text-5xl font-bold text-[#DF5830]">
                                {t('home.pricing.free_price')}
                            </span>
                            <span className="text-lg text-gray-600">{t('home.pricing.free_period')}</span>
                        </div>

                        {/* Features list */}
                        <ul className="mb-8 space-y-3">
                            {features.map((feature, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#27AE60"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="mt-0.5 shrink-0"
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    <span className="text-gray-700">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        {/* CTA button */}
                        <Link href="/register">
                            <Button
                                size="lg"
                                className="h-12 w-full rounded-full text-base font-semibold shadow-md transition-all hover:shadow-lg"
                            >
                                {t('home.pricing.cta')}
                            </Button>
                        </Link>

                        {/* Note */}
                        <p className="mt-6 text-center text-sm text-gray-500">{t('home.pricing.note')}</p>

                        {/* Decorative gradient */}
                        <div className="pointer-events-none absolute -bottom-8 -end-8 h-40 w-40 rounded-full bg-gradient-to-tl from-[#DF5830]/10 to-transparent blur-2xl" />
                    </div>
                </div>
            </div>
        </section>
    );
}
