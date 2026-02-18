'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';

export function CTASection() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-12 text-center lg:p-20">
          <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            {t('home.cta.title')}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90 md:text-xl">
            {t('home.cta.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {isLoading ? (
              <div className="h-12 w-48 animate-pulse rounded-full bg-white/20" />
            ) : isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="text-lg">
                  {t('home.hero.cta_auth_primary')}
                </Button>
              </Link>
            ) : (
              <Link href="/register">
                <Button size="lg" variant="secondary" className="text-lg">
                  {t('home.hero.cta_guest_primary')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
