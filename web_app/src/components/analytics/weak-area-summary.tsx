'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WeakArea {
  categoryCode: string;
  categoryName: string;
  accuracy: number;
}

interface WeakAreaSummaryProps {
  weakAreas: WeakArea[];
  totalCategories: number;
  overallAccuracy: number;
}

export function WeakAreaSummary({ weakAreas, totalCategories, overallAccuracy }: WeakAreaSummaryProps) {
  const criticalAreas = weakAreas.filter(a => a.accuracy < 50).length;
  const improvingAreas = weakAreas.filter(a => a.accuracy >= 50 && a.accuracy < 70).length;
  const strongAreas = totalCategories - weakAreas.length;

  return (
    <div className="grid gap-6 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Overall Accuracy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {overallAccuracy.toFixed(0)}%
          </div>
          <p className="text-xs text-muted-foreground">Across all categories</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Critical Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">{criticalAreas}</div>
          <p className="text-xs text-muted-foreground">Below 50% accuracy</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Needs Practice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">{improvingAreas}</div>
          <p className="text-xs text-muted-foreground">50-70% accuracy</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Strong Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">{strongAreas}</div>
          <p className="text-xs text-muted-foreground">Above 70% accuracy</p>
        </CardContent>
      </Card>
    </div>
  );
}
