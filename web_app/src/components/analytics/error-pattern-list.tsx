'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────

interface ErrorPattern {
  pattern: string;
  count: number;
  percentage: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  affectedCategories: string[];
  recommendation: string;
  exampleQuestions: number[];
}

// ─── Constants ───────────────────────────────────────────

const SEVERITY_CONFIG = {
  HIGH: {
    bar:        'bg-red-500',
    text:       'text-red-600',
    bg:         'bg-red-50   dark:bg-red-950/20',
    border:     'border-red-200',
    badgeBg:    'bg-red-100  text-red-800  border-red-200',
    label:      'Critical',
    icon:       '🔴',
  },
  MEDIUM: {
    bar:        'bg-orange-500',
    text:       'text-orange-600',
    bg:         'bg-orange-50   dark:bg-orange-950/20',
    border:     'border-orange-200',
    badgeBg:    'bg-orange-100  text-orange-800  border-orange-200',
    label:      'Important',
    icon:       '🟠',
  },
  LOW: {
    bar:        'bg-yellow-500',
    text:       'text-yellow-600',
    bg:         'bg-yellow-50   dark:bg-yellow-950/20',
    border:     'border-yellow-200',
    badgeBg:    'bg-yellow-100  text-yellow-800  border-yellow-200',
    label:      'Minor',
    icon:       '🟡',
  },
} as const;

const MAX_VISIBLE_QUESTIONS = 5;

// ─── Component ───────────────────────────────────────────

export function ErrorPatternList({ patterns }: { patterns: ErrorPattern[] }) {
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  const toggle = (key: string) =>
    setExpandedPattern(prev => (prev === key ? null : key));

  return (
    <div className="space-y-4">
      {patterns.map((pattern, index) => {
        const cfg        = SEVERITY_CONFIG[pattern.severity];
        const isExpanded = expandedPattern === pattern.pattern;
        const practiceHref = `/practice/${pattern.affectedCategories[0]
          ?.toLowerCase().replace(/\s+/g, '-') ?? 'traffic-signs'}`;

        return (
          <Card
            key={pattern.pattern}
            className={cn('rounded-2xl border-2 transition-all shadow-sm', cfg.border)}
          >
            {/* ── Header (clickable) ── */}
            <CardHeader
              className={cn('cursor-pointer rounded-t-2xl', cfg.bg)}
              onClick={() => toggle(pattern.pattern)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cfg.icon}</span>
                    <Badge className={cn('border text-xs', cfg.badgeBg)}>
                      {cfg.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  </div>
                  <CardTitle className="text-lg font-black">{pattern.pattern}</CardTitle>
                  <p className="text-sm text-muted-foreground">{pattern.description}</p>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={cn('text-3xl font-black', cfg.text)}>{pattern.count}</span>
                  <span className="text-xs text-muted-foreground">errors</span>
                  {isExpanded
                    ? <ChevronUp   className="w-4 h-4 text-muted-foreground mt-1" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground mt-1" />
                  }
                </div>
              </div>
            </CardHeader>

            {/* ── Content ── */}
            <CardContent className="pt-5 space-y-4">

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">Impact on performance</span>
                  <span className={cn('font-bold', cfg.text)}>
                    {pattern.percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={pattern.percentage}
                  className={cn('h-2 [&>div]:', cfg.bar)}
                />
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="space-y-4 border-t border-border/50 pt-4">

                  {/* Affected categories */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                      Affected Categories
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {pattern.affectedCategories.map(cat => (
                        <Badge key={cat} variant="secondary" className="rounded-full text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-primary mb-2">
                      <Lightbulb className="w-4 h-4 flex-shrink-0" />
                      Recommendation
                    </h4>
                    <p className="text-sm text-foreground/80">{pattern.recommendation}</p>
                  </div>

                  {/* Example questions */}
                  {pattern.exampleQuestions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                        Example Questions ({pattern.exampleQuestions.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {pattern.exampleQuestions.slice(0, MAX_VISIBLE_QUESTIONS).map(qId => (
                          <Badge key={qId} variant="outline" className="font-mono text-xs">
                            Q#{qId}
                          </Badge>
                        ))}
                        {pattern.exampleQuestions.length > MAX_VISIBLE_QUESTIONS && (
                          <Badge variant="outline" className="text-xs">
                            +{pattern.exampleQuestions.length - MAX_VISIBLE_QUESTIONS} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="rounded-xl gap-2 shadow-sm shadow-primary/20" asChild>
                      <Link href={practiceHref}>Practice This Pattern</Link>
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl">
                      View Details
                    </Button>
                  </div>
                </div>
              )}

              {/* Collapsed CTA */}
              {!isExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-muted-foreground"
                  onClick={() => toggle(pattern.pattern)}
                >
                  View Details
                  <ChevronDown className="w-4 h-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
