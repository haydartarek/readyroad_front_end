'use client';

import { useLanguage } from '@/contexts/language-context';
import Image from 'next/image';

export function ProductPreviewSection() {
    const { t } = useLanguage();

    const features = [
        t('home.preview.feature1'),
        t('home.preview.feature2'),
        t('home.preview.feature3'),
    ];

    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-gray-50/50 to-white py-16 lg:py-24">
            <div className="container mx-auto px-4">
                {/* Section header */}
                <div className="mb-12 text-center lg:mb-16">
                    <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#2C3E50] md:text-4xl lg:text-5xl">
                        {t('home.preview.title')}
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
                        {t('home.preview.subtitle')}
                    </p>
                </div>

                <div className="grid items-center gap-12 lg:grid-cols-2">
                    {/* Left: Features list */}
                    <div className="space-y-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DF5830]/10">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#DF5830"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <p className="text-base leading-relaxed text-gray-700">{feature}</p>
                            </div>
                        ))}
                    </div>

                    {/* Right: Preview placeholder */}
                    <div className="relative">
                        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 shadow-xl ring-1 ring-gray-100">
                            <div className="aspect-[4/3] w-full rounded-2xl bg-gradient-to-br from-[#DF5830]/10 to-[#2C3E50]/10">
                                {/* Placeholder for screenshot - using logo for now */}
                                <div className="flex h-full items-center justify-center">
                                    <div className="relative h-40 w-40">
                                        <Image
                                            src="/images/logo.png"
                                            alt="ReadyRoad Platform Preview"
                                            fill
                                            sizes="(max-width: 768px) 160px, 160px"
                                            className="object-contain"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div className="pointer-events-none absolute -bottom-8 -start-8 h-40 w-40 rounded-full bg-gradient-to-tr from-[#DF5830]/10 to-transparent blur-2xl" />
                            <div className="pointer-events-none absolute -end-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-bl from-[#2C3E50]/10 to-transparent blur-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
