'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorPattern {
  pattern: string;
  count: number;
  percentage: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface ErrorSummaryProps {
  totalErrors: number;
  patterns: ErrorPattern[];
}

export function ErrorSummary({ totalErrors, patterns }: ErrorSummaryProps) {
  const highSeverity = patterns.filter(p => p.severity === 'HIGH').length;
  const mediumSeverity = patterns.filter(p => p.severity === 'MEDIUM').length;

  const topPattern = patterns[0];

  return (
    <div className="grid gap-6 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">{totalErrors}</div>
          <p className="text-xs text-muted-foreground">Across all exams</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Critical Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">{highSeverity}</div>
          <p className="text-xs text-muted-foreground">Need immediate attention</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Important Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">{mediumSeverity}</div>
          <p className="text-xs text-muted-foreground">Should be addressed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Top Pattern</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{topPattern?.count || 0}</div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {topPattern?.pattern || 'No patterns'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
