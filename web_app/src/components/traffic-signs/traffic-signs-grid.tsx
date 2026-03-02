'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/language-context';
import { TrafficSign } from '@/lib/types';
import { SignImage } from './sign-image';

// ─── Types ───────────────────────────────────────────────

type LangCode = 'en' | 'ar' | 'nl' | 'fr';

// ─── Constants ───────────────────────────────────────────

const CATEGORY_COLOR: Record<string, string> = {
  DANGER:      'bg-red-100    text-red-800',
  PROHIBITION: 'bg-red-100    text-red-800',
  MANDATORY:   'bg-blue-100   text-blue-800',
  PRIORITY:    'bg-yellow-100 text-yellow-800',
  INFORMATION: 'bg-green-100  text-green-800',
  PARKING:     'bg-purple-100 text-purple-800',
  BICYCLE:     'bg-cyan-100   text-cyan-800',
};

const DEFAULT_CATEGORY_COLOR = 'bg-muted text-foreground';

// ─── Helpers ─────────────────────────────────────────────

function getSignName(sign: TrafficSign, lang: LangCode): string {
  const map: Record<LangCode, string> = {
    en: sign.nameEn,
    ar: sign.nameAr,
    nl: sign.nameNl,
    fr: sign.nameFr,
  };
  return map[lang] ?? sign.nameEn;
}

function getSignDescription(sign: TrafficSign, lang: LangCode): string {
  const map: Record<LangCode, string> = {
    en: sign.descriptionEn,
    ar: sign.descriptionAr,
    nl: sign.descriptionNl,
    fr: sign.descriptionFr,
  };
  return map[lang] ?? sign.descriptionEn;
}

// ─── Component ───────────────────────────────────────────

export function TrafficSignsGrid({ signs }: { signs: TrafficSign[] }) {
  const { language } = useLanguage();
  const lang = language as LangCode;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {signs.map(sign => {
        const name        = getSignName(sign, lang);
        const description = getSignDescription(sign, lang);
        const categoryClr = CATEGORY_COLOR[sign.category] ?? DEFAULT_CATEGORY_COLOR;

        return (
          <Link
            key={sign.id ?? sign.signCode}
            href={`/traffic-signs/${sign.signCode}`}
            className="group"
          >
            <Card className="h-full transition-all hover:shadow-lg">
              <CardContent className="p-6">

                {/* Sign image */}
                <div className="mb-4 flex justify-center rounded-xl bg-muted p-6">
                  <div className="relative h-32 w-32">
                    <SignImage
                      src={sign.imageUrl}
                      alt={name}
                      className="object-contain transition-transform group-hover:scale-110"
                    />
                  </div>
                </div>

                {/* Category badge */}
                <Badge className={`mb-2 ${categoryClr}`}>
                  {sign.category}
                </Badge>

                {/* Name */}
                <h3 className="mb-2 line-clamp-2 font-black text-foreground">
                  {name}
                </h3>

                {/* Description */}
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {description}
                </p>

                {/* Code */}
                <p className="mt-3 font-mono text-xs text-muted-foreground">
                  {sign.signCode}
                </p>

              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
