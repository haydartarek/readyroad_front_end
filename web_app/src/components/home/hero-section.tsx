'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50/50 to-white py-12 lg:py-20">
      <div className="container mx-auto px-4">
        {/* Hero Container - Main rounded card matching reference */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50/40 via-white to-blue-50/30 p-8 shadow-sm ring-1 ring-gray-200/50 lg:p-12 xl:p-16">
          {/* Background decorative blobs for depth */}
          <div className="pointer-events-none absolute end-0 top-0 h-96 w-96 ltr:translate-x-32 rtl:-translate-x-32 -translate-y-32 rounded-full bg-gradient-to-br from-[#DF5830]/5 to-transparent blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 start-0 h-80 w-80 ltr:-translate-x-20 rtl:translate-x-20 translate-y-20 rounded-full bg-gradient-to-tr from-[#2C3E50]/5 to-transparent blur-3xl" />

          <div className="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left content column */}
            <div className="space-y-6 lg:space-y-8">
              {/* Pill label */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#DF5830]/20 bg-white/80 px-4 py-2 text-sm font-medium text-[#DF5830] shadow-sm backdrop-blur-sm">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#DF5830]"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                {t('home.hero.badge')}
              </div>

              {/* Headline */}
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-[#2C3E50] md:text-5xl lg:text-6xl xl:text-7xl">
                {t('home.hero.headline')}{' '}
                <span className="relative inline-block">
                  <span className="relative z-10">{t('home.hero.headline_highlight')}</span>
                  <span className="absolute inset-x-0 bottom-2 h-3 bg-[#DF5830]/20" />
                </span>
              </h1>

              {/* Supporting text */}
              <p className="text-lg leading-relaxed text-gray-600 lg:text-xl">
                {t('home.hero.subtitle')}
              </p>

              {/* CTA row */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/practice">
                  <Button
                    size="lg"
                    className="h-12 rounded-full px-8 text-base font-semibold shadow-md transition-all hover:shadow-lg"
                  >
                    {t('home.hero.cta_primary')}
                  </Button>
                </Link>
                <Link href="/exam">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-full border-2 border-gray-200 px-8 text-base font-semibold transition-all hover:border-gray-300 hover:bg-gray-50"
                  >
                    {t('home.hero.cta_secondary')}
                  </Button>
                </Link>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-6 border-t border-gray-200/60 pt-6 lg:gap-8 lg:pt-8">
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-[#DF5830]">50</div>
                  <div className="text-sm text-gray-600">{t('home.hero.stat_questions')}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-[#DF5830]">200+</div>
                  <div className="text-sm text-gray-600">{t('home.hero.stat_signs')}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-[#DF5830]">31</div>
                  <div className="text-sm text-gray-600">{t('home.hero.stat_lessons')}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-[#DF5830]">4</div>
                  <div className="text-sm text-gray-600">{t('home.hero.stat_languages')}</div>
                </div>
              </div>
            </div>

            {/* Right visual column - with flowing ribbon/wave */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-md">
                {/* Main image container with rounded soft bg */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-gray-50/50 p-8 ring-1 ring-gray-100 lg:p-10">
                  {/* Central logo */}
                  <div className="relative z-10 mx-auto aspect-square w-56">
                    <Image
                      src="/images/logo.png"
                      alt="ReadyRoad"
                      fill
                      sizes="(max-width: 768px) 224px, 224px"
                      className="object-contain"
                      priority
                    />
                  </div>

                  {/* Flowing ribbon/wave with text - matching reference */}
                  <div className="absolute end-0 top-1/2 -translate-y-1/2 ltr:translate-x-6 rtl:-translate-x-6">
                    <div className="relative rotate-12">
                      {/* Ribbon background - curved path */}
                      <svg
                        width="280"
                        height="80"
                        viewBox="0 0 280 80"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="drop-shadow-lg"
                      >
                        <path
                          d="M0 20 Q70 0, 140 10 T280 20 L280 60 Q210 70, 140 60 T0 60 Z"
                          fill="#2C3E50"
                          opacity="0.95"
                        />
                      </svg>
                      {/* Ribbon text */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex items-center gap-2 px-4 text-white">
                          <span className="text-xs font-medium tracking-wider">
                            {t('home.hero.ribbon')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative gradient blobs for depth */}
                  <div className="pointer-events-none absolute -bottom-8 -start-8 h-40 w-40 rounded-full bg-gradient-to-tr from-[#DF5830]/10 to-transparent blur-2xl" />
                  <div className="pointer-events-none absolute -end-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-bl from-[#2C3E50]/10 to-transparent blur-2xl" />
                </div>

                {/* Status badge below */}
                <div className="mt-6 rounded-2xl border border-gray-200/60 bg-white/90 px-6 py-3 text-center shadow-sm backdrop-blur-sm">
                  <p className="text-xl font-bold text-[#2C3E50]">{t('home.hero.badge_bottom')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
