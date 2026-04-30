'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Home, LogOut, AlertCircle, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  PageHeroDescription,
  PageHeroSurface,
  PageHeroTitle,
} from '@/components/ui/page-surface';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { logout } = useAuth();

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-muted to-background flex items-center justify-center p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-md w-full space-y-6">

        <PageHeroSurface>
          <div className="space-y-3 text-center">
            <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10">
              <ShieldOff className="h-10 w-10 text-red-600" />
            </div>
            <div className="space-y-1">
              <PageHeroTitle>
                {t('unauthorized.title')}
              </PageHeroTitle>
              <PageHeroDescription>
                {t('unauthorized.subtitle')}
              </PageHeroDescription>
            </div>
          </div>
        </PageHeroSurface>

        {/* Reason card */}
        <Card className="rounded-2xl border-red-500/20 bg-red-500/5 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">{t('unauthorized.reason_heading')}</h3>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li>• {t('unauthorized.reason_1')}</li>
                  <li>• {t('unauthorized.reason_2')}</li>
                  <li>• {t('unauthorized.reason_3')}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-2.5">
          <Button
            variant="secondary"
            className="w-full rounded-xl gap-2"
            onClick={() => router.back()}
          >
            <BackArrow className="w-4 h-4" />
            {t('unauthorized.go_back')}
          </Button>

          <Button variant="outline" className="w-full rounded-xl gap-2" asChild>
            <Link href="/">
              <Home className="w-4 h-4" />
              {t('unauthorized.go_home')}
            </Link>
          </Button>

          <Button
            variant="ghost"
            className="w-full rounded-xl gap-2 text-red-600 hover:text-red-700 hover:bg-red-500/10"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4" />
            {t('unauthorized.logout')}
          </Button>
        </div>

        {/* Help */}
        <p className="text-center text-sm text-muted-foreground">
          {t('unauthorized.need_help')}{' '}
          <Link href="/contact" className="text-primary font-medium hover:underline">
            {t('unauthorized.contact_us')}
          </Link>
        </p>
      </div>
    </div>
  );
}
