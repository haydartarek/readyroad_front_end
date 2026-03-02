import Link from 'next/link';
import { ArrowRight, Dumbbell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────

interface Recommendation {
  title: string;
  link: string;
}

interface WeakArea {
  category: string;
  accuracy: number;
  totalAttempts: number;
  correctAnswers: number;
  incorrectAnswers: number;
  rank: 'critical' | 'needs-improvement' | 'good';
  relatedTopics: string[];
  practiceRecommendations: Recommendation[];
}

// ─── Constants ───────────────────────────────────────────

const RANK_CONFIG = {
  'critical': {
    badge: 'bg-red-100   text-red-800   border-red-200',
    icon:  '🚨',
    label: 'Critical',
  },
  'needs-improvement': {
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    icon:  '⚠️',
    label: 'Needs Improvement',
  },
  'good': {
    badge: 'bg-green-100  text-green-800  border-green-200',
    icon:  '✅',
    label: 'Good',
  },
} as const;

const STAT_CELLS = [
  { key: 'totalAttempts',  label: 'Total',     bg: 'bg-muted',     value: (a: WeakArea) => a.totalAttempts,  color: 'text-foreground' },
  { key: 'correctAnswers', label: 'Correct',   bg: 'bg-green-50 dark:bg-green-950/20', value: (a: WeakArea) => a.correctAnswers,  color: 'text-green-600' },
  { key: 'incorrectAnswers',label: 'Incorrect', bg: 'bg-red-50   dark:bg-red-950/20',  value: (a: WeakArea) => a.incorrectAnswers, color: 'text-red-600'   },
] as const;

// ─── Component ───────────────────────────────────────────

export function WeakAreaCard({ area }: { area: WeakArea }) {
  const cfg         = RANK_CONFIG[area.rank];
  const practiceHref = `/practice/${area.category.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <span>{cfg.icon}</span>
              {area.category}
            </CardTitle>
            <p className="text-3xl font-black text-foreground">
              {area.accuracy.toFixed(1)}%
            </p>
          </div>
          <Badge className={cn('border flex-shrink-0', cfg.badge)}>
            {cfg.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {STAT_CELLS.map(({ key, label, bg, value, color }) => (
            <div key={key} className={cn('text-center p-3 rounded-xl', bg)}>
              <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
              <p className={cn('text-xl font-black', color)}>{value(area)}</p>
            </div>
          ))}
        </div>

        {/* Related topics */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
            Related Topics
          </p>
          <div className="flex flex-wrap gap-2">
            {area.relatedTopics.map(topic => (
              <Badge
                key={topic}
                variant="secondary"
                className="rounded-full text-xs"
              >
                {topic}
              </Badge>
            ))}
          </div>
        </div>

        {/* Practice resources */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
            Practice Resources
          </p>
          <div className="space-y-2">
            {area.practiceRecommendations.map(rec => (
              <Link key={rec.link} href={rec.link}>
                <div className="flex items-center justify-between p-3 bg-muted/60 rounded-xl hover:bg-muted transition-colors group">
                  <span className="text-sm text-foreground">{rec.title}</span>
                  <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Button asChild size="lg" className="w-full rounded-xl gap-2 shadow-sm shadow-primary/20">
          <Link href={practiceHref}>
            <Dumbbell className="w-4 h-4" />
            Practice Now
          </Link>
        </Button>

      </CardContent>
    </Card>
  );
}
