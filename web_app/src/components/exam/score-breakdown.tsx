'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CategoryBreakdown {
  categoryCode: string;
  categoryName: string;
  correct: number;
  total: number;
  percentage: number;
}

interface ScoreBreakdownProps {
  categoryBreakdown: CategoryBreakdown[];
}

export function ScoreBreakdown({ categoryBreakdown }: ScoreBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Score by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categoryBreakdown.map((category) => {
            const isWeak = category.percentage < 70;
            const isStrong = category.percentage >= 85;

            return (
              <div key={category.categoryCode} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {category.categoryName}
                    </span>
                    {isWeak && (
                      <Badge variant="destructive" className="text-xs">
                        Needs Practice
                      </Badge>
                    )}
                    {isStrong && (
                      <Badge variant="default" className="bg-green-600 text-xs">
                        Strong
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {category.correct}/{category.total} ({category.percentage.toFixed(0)}%)
                  </span>
                </div>
                <Progress
                  value={category.percentage}
                  className={cn(
                    'h-2',
                    isWeak && '[&>div]:bg-red-500',
                    isStrong && '[&>div]:bg-green-600'
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 rounded-lg bg-muted p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {categoryBreakdown.filter(c => c.percentage >= 85).length}
            </div>
            <div className="text-xs text-muted-foreground">Strong Areas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {categoryBreakdown.filter(c => c.percentage >= 70 && c.percentage < 85).length}
            </div>
            <div className="text-xs text-muted-foreground">Average Areas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {categoryBreakdown.filter(c => c.percentage < 70).length}
            </div>
            <div className="text-xs text-muted-foreground">Weak Areas</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
