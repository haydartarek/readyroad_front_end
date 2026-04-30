'use client';

import Link from 'next/link';
import { MessageCircleMore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

export function ContactCtaSection() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 py-16 lg:py-20">
      <div className="pointer-events-none absolute -top-32 end-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 start-0 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />

      <div className="container relative mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />

          <div className="relative px-6 py-7 md:px-8 md:py-8">
            <div className="space-y-3.5 text-center lg:text-start">
              <h2 className="mx-auto max-w-2xl text-balance text-3xl font-extrabold tracking-tight text-secondary sm:text-4xl lg:mx-0">
                {t('home.contact.title')}
              </h2>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-6">
                <p className="mx-auto max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0">
                  {t('home.contact.subtitle')}
                </p>

                <div className="flex justify-center lg:me-10 lg:justify-end xl:me-14">
                  <Button
                    size="lg"
                    className="h-12 rounded-full px-8 text-sm font-semibold shadow-sm ring-1 ring-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-md"
                    asChild
                  >
                    <Link href="/contact">
                      <MessageCircleMore className="h-4 w-4" aria-hidden />
                      {t('home.contact.cta_primary')}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
