'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Interactive MCQ preview — visitors can answer one sample question
 * without any authentication. Correct answer is option B (index 1).
 */
const CORRECT_INDEX = 1;

export function QuizPreviewSection() {
    const { t } = useLanguage();
    const [selected, setSelected] = useState<number | null>(null);
    const answered = selected !== null;
    const isCorrect = selected === CORRECT_INDEX;

    const options = [
        { key: 'a', text: t('home.quiz_preview.option_a') },
        { key: 'b', text: t('home.quiz_preview.option_b') },
        { key: 'c', text: t('home.quiz_preview.option_c') },
        { key: 'd', text: t('home.quiz_preview.option_d') },
    ];

    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-gray-50/50 to-white py-16 lg:py-24">
            <div className="container mx-auto px-4">
                {/* Section header */}
                <div className="mb-10 text-center">
                    <h2 className="mb-3 text-3xl font-bold tracking-tight text-[#2C3E50] md:text-4xl lg:text-5xl">
                        {t('home.quiz_preview.title')}
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
                        {t('home.quiz_preview.subtitle')}
                    </p>
                </div>

                {/* Question card */}
                <div className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-lg sm:p-8">
                    {/* Yield-sign visual (SVG inline to avoid external image) */}
                    <div className="mb-5 flex justify-center">
                        <svg width="80" height="80" viewBox="0 0 100 100" aria-hidden="true">
                            <polygon points="50,10 90,80 10,80" fill="none" stroke="#E74C3C" strokeWidth="6" />
                        </svg>
                    </div>

                    <p className="mb-6 text-center text-lg font-semibold text-[#2C3E50]">
                        {t('home.quiz_preview.question')}
                    </p>

                    {/* Options */}
                    <div className="space-y-3" role="radiogroup" aria-label="Quiz options">
                        {options.map((opt, i) => {
                            let border = 'border-gray-200 hover:border-[#DF5830]/40';
                            let bg = 'bg-white';
                            if (answered && i === CORRECT_INDEX) {
                                border = 'border-green-500';
                                bg = 'bg-green-50';
                            } else if (answered && i === selected && !isCorrect) {
                                border = 'border-red-400';
                                bg = 'bg-red-50';
                            }

                            return (
                                <button
                                    key={opt.key}
                                    role="radio"
                                    aria-checked={selected === i}
                                    disabled={answered}
                                    onClick={() => setSelected(i)}
                                    className={`flex w-full items-center gap-3 rounded-xl border-2 px-5 py-4 text-start text-sm font-medium transition-all ${border} ${bg} ${answered ? 'cursor-default' : 'cursor-pointer'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DF5830] focus-visible:ring-offset-2`}
                                >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold uppercase text-gray-600">
                                        {opt.key}
                                    </span>
                                    <span className="text-gray-700">{opt.text}</span>

                                    {/* Checkmark / Cross indicator */}
                                    {answered && i === CORRECT_INDEX && (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ms-auto shrink-0" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                                    )}
                                    {answered && i === selected && !isCorrect && (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ms-auto shrink-0" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Feedback */}
                    {answered && (
                        <div
                            className={`mt-5 rounded-xl p-4 text-sm leading-relaxed ${isCorrect ? 'border border-green-200 bg-green-50 text-green-800' : 'border border-red-200 bg-red-50 text-red-800'}`}
                            role="status"
                            aria-live="polite"
                        >
                            <p className="mb-1 font-semibold">
                                {isCorrect ? t('home.quiz_preview.correct') : t('home.quiz_preview.incorrect')}
                            </p>
                            <p>{t('home.quiz_preview.explanation')}</p>
                        </div>
                    )}

                    {/* Post-answer CTA */}
                    {answered && (
                        <div className="mt-6 text-center">
                            <Link href="/practice">
                                <Button size="lg" className="rounded-full px-8 text-sm font-semibold">
                                    {t('home.quiz_preview.try_more')}
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
