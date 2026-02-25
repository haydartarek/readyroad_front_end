'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';

/**
 * Sticky bottom CTA bar that appears once the user scrolls past
 * the hero section. All colors from design tokens only.
 */
export function StickyCTA() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (dismissed || isLoading || !visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 shadow-lg backdrop-blur-md transition-transform duration-300"
      role="complementary"
      aria-label="Quick action"
    >
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <p className="hidden text-sm font-medium text-secondary sm:block">
          {t('home.sticky.tagline')}
        </p>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button
                size="sm"
                className="rounded-full px-6 text-sm font-bold shadow-md transition-all hover:shadow-lg"
              >
                {t('home.hero.cta_auth_primary')}
              </Button>
            </Link>
          ) : (
            <Link href="/practice">
              <Button
                size="sm"
                className="rounded-full px-6 text-sm font-bold shadow-md transition-all hover:shadow-lg"
              >
                {t('home.sticky.cta_text')}
              </Button>
            </Link>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
