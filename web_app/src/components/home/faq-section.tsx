'use client';

import { useLanguage } from '@/contexts/language-context';
import { useState } from 'react';

export function FAQSection() {
    const { t } = useLanguage();
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
        {
            question: t('home.faq.q1'),
            answer: t('home.faq.a1'),
        },
        {
            question: t('home.faq.q2'),
            answer: t('home.faq.a2'),
        },
        {
            question: t('home.faq.q3'),
            answer: t('home.faq.a3'),
        },
        {
            question: t('home.faq.q4'),
            answer: t('home.faq.a4'),
        },
        {
            question: t('home.faq.q5'),
            answer: t('home.faq.a5'),
        },
        {
            question: t('home.faq.q6'),
            answer: t('home.faq.a6'),
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
                        {t('home.faq.title')}
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
                        {t('home.faq.subtitle')}
                    </p>
                </div>

                {/* FAQ List */}
                <div className="mx-auto max-w-3xl space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="flex w-full items-center justify-between px-6 py-5 text-start"
                            >
                                <span className="text-base font-semibold text-[#2C3E50] md:text-lg">
                                    {faq.question}
                                </span>
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#DF5830"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={`shrink-0 transition-transform ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                            {openIndex === index && (
                                <div className="border-t border-gray-100 px-6 pb-5 pt-4">
                                    <p className="text-base leading-relaxed text-gray-600">{faq.answer}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
