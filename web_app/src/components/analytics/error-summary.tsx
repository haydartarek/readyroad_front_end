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
          <CardTitle className="text-sm font-medium text-gray-600">Total Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{totalErrors}</div>
          <p className="text-xs text-gray-500">Across all exams</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Critical Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">{highSeverity}</div>
          <p className="text-xs text-gray-500">Need immediate attention</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Important Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">{mediumSeverity}</div>
          <p className="text-xs text-gray-500">Should be addressed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Top Pattern</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{topPattern?.count || 0}</div>
          <p className="text-xs text-gray-500 line-clamp-1">
            {topPattern?.pattern || 'No patterns'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
