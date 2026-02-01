'use client';

import { useLanguage } from '@/contexts/language-context';

export function StatsSection() {
  const { t } = useLanguage();

  const stats = [
    { value: '50', label: t('home.stats.questions') },
    { value: '200+', label: t('home.stats.signs') },
    { value: '31', label: t('home.stats.lessons') },
    { value: '4', label: t('home.stats.languages') },
  ];

  return (
    <section className="bg-primary py-20">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="mb-2 text-4xl font-bold text-white md:text-5xl">
                {stat.value}
              </div>
              <div className="text-lg text-white/90">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
