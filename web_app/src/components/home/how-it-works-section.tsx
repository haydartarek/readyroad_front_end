'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, Layers, FilePlus2, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

interface Step {
  number: string;
  href: string;
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
  ctaKey: string;
}

const OBSERVER_THRESHOLD = 0.2;
const STAGGER_MS = 120;
const HEADING_ID = 'how-it-works-heading';

const STEP_BASES = [
  { number: '01', href: '/practice', icon: Clock },
  { number: '02', href: '/traffic-signs', icon: Layers },
  { number: '03', href: '/exam', icon: FilePlus2 },
] as const;

function buildSteps(): Step[] {
  return STEP_BASES.map((s, i) => ({
    ...s,
    titleKey: `home.how.step${i + 1}_title`,
    descKey: `home.how.step${i + 1}_desc`,
    ctaKey: `home.how.step${i + 1}_cta`,
  }));
}

export function HowItWorksSection() {
  const { t, isRTL } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const hasTriggered = useRef(false);
  const [visible, setVisible] = useState(false);

  const steps = buildSteps();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

  return (
    <section
      ref={sectionRef}
      aria-labelledby={HEADING_ID}
      className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 py-16 lg:py-24"
    >
      <div className="pointer-events-none absolute -top-40 start-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="container relative mx-auto px-4">
        <div className="mb-10 text-center lg:mb-14">
          <h2
            id={HEADING_ID}
            className="mb-3 text-balance text-2xl font-extrabold tracking-tight text-secondary md:text-3xl lg:text-4xl"
          >
            {t('home.how.title')}
          </h2>
          <p className="mx-auto max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            {t('home.how.subtitle')}
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {steps.map((step, i) => {
            const Icon = step.icon;

            return (
              <article
                key={step.number}
                className={[
                  'group relative flex flex-col overflow-hidden rounded-3xl border bg-card/80 p-6 shadow-sm backdrop-blur',
                  'transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20',
                  'lg:p-8',
                  visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
                ].join(' ')}
                style={{ transitionDelay: visible ? `${i * STAGGER_MS}ms` : '0ms' }}
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/35 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-border/60" />

                <div className="mb-5 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full border bg-background/60 px-3 py-1 text-[11px] font-semibold tracking-widest text-primary">
                    {step.number}
                  </span>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-background/60 shadow-sm transition-transform duration-200 group-hover:scale-[1.03]">
                    <Icon className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                </div>

                <h3 className="mb-2 text-lg font-extrabold tracking-tight text-secondary">
                  {t(step.titleKey)}
                </h3>

                <p className="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {t(step.descKey)}
                </p>

                <Link
                  href={step.href}
                  className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/60 px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {t(step.ctaKey)}
                  <ArrowRight
                    className={[
                      'h-4 w-4 transition-transform',
                      isRTL ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5',
                    ].join(' ')}
                    aria-hidden
                  />
                </Link>

                <div className="pointer-events-none absolute -bottom-12 -end-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity group-hover:opacity-100" />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}