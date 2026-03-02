'use client';

import { useLanguage } from '@/contexts/language-context';
import { ShieldCheck, Clock } from 'lucide-react';

export default function AdminModerationPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">{t('admin.moderation.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('admin.moderation.description')}</p>
      </div>

      {/* Coming Soon Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm px-6 py-16 text-center">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground">
              {t('admin.moderation.coming_soon')}
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mt-2">
              {t('admin.moderation.coming_soon_desc')}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary text-sm font-semibold border border-primary/20">
            <Clock className="w-4 h-4" />
            Coming Soon
          </div>
        </div>
      </div>

    </div>
  );
}
