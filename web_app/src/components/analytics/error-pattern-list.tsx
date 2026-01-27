'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';

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

interface ErrorPatternListProps {
  patterns: ErrorPattern[];
}

const severityConfig = {
  HIGH: {
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Critical',
    icon: '🔴',
  },
  MEDIUM: {
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: 'Important',
    icon: '🟠',
  },
  LOW: {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'Minor',
    icon: '🟡',
  },
};

export function ErrorPatternList({ patterns }: ErrorPatternListProps) {
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {patterns.map((pattern, index) => {
        const config = severityConfig[pattern.severity];
        const isExpanded = expandedPattern === pattern.pattern;

        return (
          <Card
            key={pattern.pattern}
            className={cn('transition-all', config.borderColor, 'border-2')}
          >
            <CardHeader className={cn('cursor-pointer', config.bgColor)} onClick={() => setExpandedPattern(isExpanded ? null : pattern.pattern)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-2xl">{config.icon}</span>
                    <Badge variant="outline" className={cn('border-current', config.textColor)}>
                      {config.label}
                    </Badge>
                    <span className="text-sm text-gray-600">#{index + 1}</span>
                  </div>
                  <CardTitle className="text-xl">{pattern.pattern}</CardTitle>
                  <p className="mt-2 text-sm text-gray-600">{pattern.description}</p>
                </div>
                <div className="ml-4 text-right">
                  <div className={cn('text-3xl font-bold', config.textColor)}>
                    {pattern.count}
                  </div>
                  <div className="text-sm text-gray-600">errors</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">Impact on your performance</span>
                  <span className="font-bold">{pattern.percentage.toFixed(1)}%</span>
                </div>
                <Progress value={pattern.percentage} className={`h-2 [&>div]:${config.color}`} />
              </div>

              {isExpanded && (
                <div className="space-y-4 border-t pt-4">
                  {/* Affected Categories */}
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-gray-700">Affected Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {pattern.affectedCategories.map((category) => (
                        <Badge key={category} variant="secondary">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="rounded-lg bg-blue-50 p-4">
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-900">
                      <span>💡</span>
                      Recommendation
                    </h4>
                    <p className="text-sm text-blue-800">{pattern.recommendation}</p>
                  </div>

                  {/* Example Questions */}
                  {pattern.exampleQuestions.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-gray-700">
                        Example Questions ({pattern.exampleQuestions.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {pattern.exampleQuestions.slice(0, 5).map((qId) => (
                          <Badge key={qId} variant="outline">
                            Q#{qId}
                          </Badge>
                        ))}
                        {pattern.exampleQuestions.length > 5 && (
                          <Badge variant="outline">
                            +{pattern.exampleQuestions.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Practice Button */}
                  <div className="flex gap-3">
                    <Button variant="default" size="sm" asChild>
                      <Link href={`/practice/${pattern.affectedCategories[0]}`}>
                        Practice This Pattern
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              )}

              {!isExpanded && (
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setExpandedPattern(pattern.pattern)}>
                  View Details →
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
