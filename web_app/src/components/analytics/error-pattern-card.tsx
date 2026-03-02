'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, ClipboardList, XCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────

interface ExampleQuestion {
  id: string;
  text: string;
  yourAnswer: string;
  correctAnswer: string;
}

interface ErrorPattern {
  id: string;
  patternType: string;
  description: string;
  frequency: number;
  severity: 'high' | 'medium' | 'low';
  affectedCategories: string[];
  recommendations: string[];
  exampleQuestions: ExampleQuestion[];
}

// ─── Helpers ─────────────────────────────────────────────

const PATTERN_MAP: Record<string, { category: string; filter?: string }> = {
  SIGN_CONFUSION:           { category: 'traffic-signs',  filter: 'confusion'    },
  PRIORITY_MISUNDERSTANDING:{ category: 'priority-rules', filter: 'priority'     },
  SPEED_LIMIT_ERRORS:       { category: 'speed-limits',   filter: 'speed'        },
  PARKING_VIOLATIONS:       { category: 'parking',        filter: 'parking'      },
  RIGHT_OF_WAY:             { category: 'priority-rules', filter: 'right-of-way' },
};

function getPracticeUrl(patternType: string, affectedCategories: string[]): string {
  const key     = patternType.toUpperCase().replace(/\s+/g, '_');
  const mapping = PATTERN_MAP[key];

  if (mapping) {
    const base = `/practice/${mapping.category}`;
    return mapping.filter ? `${base}?filter=${mapping.filter}` : base;
  }

  const fallback = affectedCategories[0]?.toLowerCase().replace(/\s+/g, '-') ?? 'traffic-signs';
  return `/practice/${fallback}`;
}

const SEVERITY_STYLES: Record<ErrorPattern['severity'], string> = {
  high:   'bg-red-100    text-red-800    border-red-200',
  medium: 'bg-orange-100 text-orange-800 border-orange-200',
  low:    'bg-yellow-100 text-yellow-800 border-yellow-200',
};

// ─── Component ───────────────────────────────────────────

export function ErrorPatternCard({ pattern }: { pattern: ErrorPattern }) {
  const [showExamples, setShowExamples] = useState(false);

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg font-black">{pattern.patternType}</CardTitle>
            <p className="text-sm text-muted-foreground">{pattern.description}</p>
          </div>
          <Badge className={cn('border flex-shrink-0', SEVERITY_STYLES[pattern.severity])}>
            {pattern.severity.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">

        {/* Frequency */}
        <p className="text-sm text-muted-foreground">
          Frequency:{' '}
          <span className="font-bold text-foreground">{pattern.frequency} times</span>
        </p>

        {/* Affected categories */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-2">Affected Categories</p>
          <div className="flex flex-wrap gap-2">
            {pattern.affectedCategories.map(cat => (
              <Badge key={cat} variant="secondary" className="rounded-full text-xs">
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-2">Recommendations</p>
          <ul className="space-y-1.5">
            {pattern.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Practice CTA */}
        <Button asChild className="w-full rounded-xl gap-2 shadow-sm shadow-primary/20">
          <Link href={getPracticeUrl(pattern.patternType, pattern.affectedCategories)}>
            <ClipboardList className="w-4 h-4" />
            Practice This Area
          </Link>
        </Button>

        {/* Example questions toggle */}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExamples(v => !v)}
            className="w-full rounded-xl gap-2"
          >
            {showExamples
              ? <><ChevronDown  className="w-4 h-4" /> Hide Example Questions</>
              : <><ChevronRight className="w-4 h-4" /> Show Example Questions</>
            }
          </Button>

          {showExamples && (
            <div className="mt-4 space-y-3">
              {pattern.exampleQuestions.map(q => (
                <div key={q.id} className="rounded-xl border border-border/50 bg-muted/50 p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">{q.text}</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <XCircle      className="w-4 h-4 text-red-500   flex-shrink-0" />
                      <span className="text-red-600">{q.yourAnswer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-green-600">{q.correctAnswer}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
