'use client';

import { useLanguage } from '@/contexts/language-context';

/**
 * Comparison table explaining the difference between Practice Mode and Full Exam.
 * Reduces user confusion shown in the feature spec.
 */
export function ModesComparisonSection() {
    const { t } = useLanguage();

    const attributes = [
        { attr: t('home.modes.attr_time'), practice: t('home.modes.practice_time'), exam: t('home.modes.exam_time') },
        { attr: t('home.modes.attr_questions'), practice: t('home.modes.practice_questions'), exam: t('home.modes.exam_questions') },
        { attr: t('home.modes.attr_scoring'), practice: t('home.modes.practice_scoring'), exam: t('home.modes.exam_scoring') },
        { attr: t('home.modes.attr_explanations'), practice: t('home.modes.practice_explanations'), exam: t('home.modes.exam_explanations') },
    ];

    return (
        <section className="bg-white py-14 lg:py-20">
            <div className="container mx-auto px-4">
                <div className="mb-10 text-center">
                    <h2 className="mb-3 text-2xl font-bold tracking-tight text-[#2C3E50] md:text-3xl lg:text-4xl">
                        {t('home.modes.title')}
                    </h2>
                    <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
                        {t('home.modes.subtitle')}
                    </p>
                </div>

                <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/60">
                                    <th className="px-5 py-3.5 text-start font-medium text-gray-500" />
                                    <th className="px-5 py-3.5 text-center font-bold text-[#DF5830]">
                                        {t('home.modes.practice')}
                                    </th>
                                    <th className="px-5 py-3.5 text-center font-bold text-[#2C3E50]">
                                        {t('home.modes.exam')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {attributes.map((row, i) => (
                                    <tr
                                        key={i}
                                        className={`border-b border-gray-100 transition-colors hover:bg-gray-50/40 ${i === attributes.length - 1 ? 'border-b-0' : ''}`}
                                    >
                                        <td className="px-5 py-4 font-medium text-gray-700">{row.attr}</td>
                                        <td className="px-5 py-4 text-center text-gray-600">{row.practice}</td>
                                        <td className="px-5 py-4 text-center text-gray-600">{row.exam}</td>
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
