'use client';

import { useLanguage } from '@/contexts/language-context';

export function HowItWorksSection() {
    const { t } = useLanguage();

    const steps = [
        {
            number: '1',
            title: t('home.how.step1_title'),
            description: t('home.how.step1_desc'),
            icon: (
                <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#DF5830]"
                >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            ),
        },
        {
            number: '2',
            title: t('home.how.step2_title'),
            description: t('home.how.step2_desc'),
            icon: (
                <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#DF5830]"
                >
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                </svg>
            ),
        },
        {
            number: '3',
            title: t('home.how.step3_title'),
            description: t('home.how.step3_desc'),
            icon: (
                <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#DF5830]"
                >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
            ),
        },
    ];

    return (
        <section className="relative overflow-hidden bg-white py-16 lg:py-24">
            {/* Background gradient accents */}
            <div className="pointer-events-none absolute end-0 top-0 h-96 w-96 ltr:translate-x-32 rtl:-translate-x-32 -translate-y-32 rounded-full bg-gradient-to-br from-purple-100/30 to-transparent blur-3xl" />

            <div className="container relative mx-auto px-4">
                {/* Section header */}
                <div className="mb-12 text-center lg:mb-16">
                    <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#2C3E50] md:text-4xl lg:text-5xl">
                        {t('home.how.title')}
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
                        {t('home.how.subtitle')}
                    </p>
                </div>

                {/* Steps grid */}
                <div className="grid gap-8 md:grid-cols-3 lg:gap-12">
                    {steps.map((step, index) => (
                        <div key={index} className="relative flex flex-col items-center text-center">
                            {/* Step number badge */}
                            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#DF5830]/10 text-2xl font-bold text-[#DF5830]">
                                {step.number}
                            </div>

                            {/* Icon */}
                            <div className="mb-4">{step.icon}</div>

                            {/* Title */}
                            <h3 className="mb-3 text-xl font-semibold text-[#2C3E50] md:text-2xl">
                                {step.title}
                            </h3>

                            {/* Description */}
                            <p className="text-base leading-relaxed text-gray-600">{step.description}</p>

                            {/* Connector line (except for last item) */}
                            {index < steps.length - 1 && (
                                <div className="absolute -end-6 top-8 hidden h-0.5 w-12 ltr:bg-gradient-to-r rtl:bg-gradient-to-l from-[#DF5830]/20 to-transparent md:block" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
