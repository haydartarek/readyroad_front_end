'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';

const OBSERVER_THRESHOLD = 0.2;

interface Step {
  number: string;
  titleKey: string;
  descKey: string;
  ctaKey: string;
  href: string;
  icon: React.ReactNode;
}

const STEPS: Omit<Step, 'titleKey' | 'descKey' | 'ctaKey'>[] = [
  {
    number: '01',
    href: '/practice',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    number: '02',
    href: '/traffic-signs',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    number: '03',
    href: '/exam',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  },
];

export function HowItWorksSection() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const hasTriggered = useRef(false);

  const steps: Step[] = STEPS.map((s, i) => ({
    ...s,
    titleKey: `home.how.step${i + 1}_title`,
    descKey: `home.how.step${i + 1}_desc`,
    ctaKey: `home.how.step${i + 1}_cta`,
  }));

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true;
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: OBSERVER_THRESHOLD },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const headingId = 'how-it-works-heading';

  return (
    <section
      ref={sectionRef}
      aria-labelledby={headingId}
      className="relative overflow-hidden bg-background py-16 lg:py-24"
    >
      <div className="container relative mx-auto px-4">
        {/* Header */}
        <div className="mb-10 text-center lg:mb-14">
          <h2
            id={headingId}
            className="mb-3 text-2xl font-bold tracking-tight text-secondary md:text-3xl lg:text-4xl"
          >
            {t('home.how.title')}
          </h2>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {t('home.how.subtitle')}
          </p>
        </div>

        {/* Cards grid */}
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {steps.map((step, i) => (
            <article
              key={step.number}
              className={`group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all duration-500 ease-out hover:border-primary/30 hover:shadow-lg lg:p-8 ${visible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-6 opacity-0'
                }`}
              style={{
                transitionDelay: visible ? `${i * 120}ms` : '0ms',
              }}
            >
              {/* Top row: step number + icon */}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest text-primary/60">
                  {step.number}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/[0.06] text-primary">
                  {step.icon}
                </div>
              </div>

              {/* Title */}
              <h3 className="mb-2 text-lg font-semibold text-secondary">
                {t(step.titleKey)}
              </h3>

              {/* Description */}
              <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                {t(step.descKey)}
              </p>

              {/* Micro CTA */}
              <Link
                href={step.href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {t(step.ctaKey)}
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5 transition-transform group-hover:ltr:translate-x-0.5 group-hover:rtl:-translate-x-0.5"
                  aria-hidden="true"
                >
                  <path d="M6 3l5 5-5 5" />
                </svg>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
