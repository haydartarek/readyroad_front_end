'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Props = {
  title: string;
  description?: string;
};

export default function AdminPlaceholder({ title, description }: Props) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-foreground">{title}</h1>
              <p className="text-sm text-muted-foreground">
                {description ?? t('admin.lessons.coming_soon_desc')}
              </p>
            </div>

            <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 flex-shrink-0">
              {t('admin.lessons.coming_soon')}
            </Badge>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="secondary" asChild>
              <Link href="/admin/dashboard">
                {t('admin.sidebar.dashboard')}
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href="/">
                {t('admin.sidebar.back_to_site')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
