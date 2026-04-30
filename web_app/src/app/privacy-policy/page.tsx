'use client';

import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
import { getPrivacyContent } from '@/lib/legal-copy';

export default function PrivacyPolicyPage() {
  const { language, isRTL } = useLanguage();
  const current = getPrivacyContent(language);

  return (
    <div className="container max-w-4xl px-4 py-10" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="overflow-hidden rounded-2xl border-border/50 shadow-sm">
        <CardHeader className="space-y-2 border-b border-border/40 bg-muted/50 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight md:text-3xl">
                {current.title}
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">{current.lastUpdated}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 px-6 py-8">
          <p className="border-s-4 border-primary/30 ps-4 text-base leading-relaxed text-muted-foreground">
            {current.intro}
          </p>

          {current.sections.map((section, index) => (
            <div key={section.title} className="space-y-2">
              <h2 className="text-base font-black text-foreground">{section.title}</h2>
              <div className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {section.content}
              </div>
              {index < current.sections.length - 1 ? (
                <hr className="mt-4 border-border/40" />
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
