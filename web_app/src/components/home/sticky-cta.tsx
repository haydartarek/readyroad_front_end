'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';

// ─── Constants ───────────────────────────────────────────

const SCROLL_THRESHOLD = 600;

// ─── Component ───────────────────────────────────────────

export function StickyCTA() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();
  const [visible,   setVisible]   = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (dismissed || isLoading || !visible) return null;

  const ctaHref  = isAuthenticated ? '/dashboard' : '/practice';
  const ctaLabel = isAuthenticated
    ? t('home.hero.cta_auth_primary')
    : t('home.sticky.cta_text');

  return (
    <div
      role="complementary"
      aria-label="Quick action"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 shadow-lg backdrop-blur-md"
    >
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <p className="hidden text-sm font-medium text-secondary sm:block">
          {t('home.sticky.tagline')}
        </p>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="rounded-full px-6 text-sm font-black shadow-md transition-all hover:shadow-lg"
            asChild
          >
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>

          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
