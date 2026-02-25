'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrafficSign } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { SignImage } from './sign-image';

interface TrafficSignsGridProps {
  signs: TrafficSign[];
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'DANGER': 'bg-red-100 text-red-800',
    'PROHIBITION': 'bg-red-100 text-red-800',
    'MANDATORY': 'bg-blue-100 text-blue-800',
    'PRIORITY': 'bg-yellow-100 text-yellow-800',
    'INFORMATION': 'bg-green-100 text-green-800',
    'PARKING': 'bg-purple-100 text-purple-800',
    'BICYCLE': 'bg-cyan-100 text-cyan-800',
  };
  return colors[category] || 'bg-muted text-foreground';
}

export function TrafficSignsGrid({ signs }: TrafficSignsGridProps) {
  const { language } = useLanguage();

  const getSignName = (sign: TrafficSign) => {
    switch (language) {
      case 'ar': return sign.nameAr;
      case 'nl': return sign.nameNl;
      case 'fr': return sign.nameFr;
      default: return sign.nameEn;
    }
  };

  const getSignDescription = (sign: TrafficSign) => {
    switch (language) {
      case 'ar': return sign.descriptionAr;
      case 'nl': return sign.descriptionNl;
      case 'fr': return sign.descriptionFr;
      default: return sign.descriptionEn;
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {signs.map((sign) => (
        <Link
          key={sign.id || sign.signCode}
          href={`/traffic-signs/${sign.signCode}`}
          className="group"
        >
          <Card className="h-full transition-all hover:shadow-lg">
            <CardContent className="p-6">
              {/* Sign image */}
              <div className="mb-4 flex justify-center rounded-lg bg-muted p-6">
                <div className="relative h-32 w-32">
                  <SignImage
                    src={sign.imageUrl}
                    alt={getSignName(sign)}
                    className="object-contain transition-transform group-hover:scale-110"
                  />
                </div>
              </div>

              {/* Category badge */}
              <Badge className={`mb-2 ${getCategoryColor(sign.category)}`}>
                {sign.category}
              </Badge>

              {/* Sign name */}
              <h3 className="mb-2 font-semibold text-foreground line-clamp-2">
                {getSignName(sign)}
              </h3>

              {/* Sign description */}
              <p className="text-sm text-muted-foreground line-clamp-2">
                {getSignDescription(sign)}
              </p>

              {/* Sign code */}
              <p className="mt-3 font-mono text-xs text-muted-foreground">
                {sign.signCode}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
