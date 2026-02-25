import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WeakAreasPreviewProps {
  weakAreas: Array<{
    category: string;
    accuracy: number;
    totalQuestions: number;
  }>;
}

export function WeakAreasPreview({ weakAreas }: WeakAreasPreviewProps) {
  const topThree = weakAreas.slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Weak Areas</CardTitle>
        <Link href="/analytics/weak-areas">
          <Button variant="ghost" size="sm">
            View All →
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topThree.map((area) => (
            <div key={area.category}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{area.category}</span>
                <span className="text-sm text-muted-foreground">
                  {area.accuracy.toFixed(1)}% ({area.totalQuestions} questions)
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all ${area.accuracy < 60
                      ? 'bg-red-500'
                      : area.accuracy < 75
                        ? 'bg-orange-500'
                        : 'bg-green-500'
                    }`}
                  style={{ width: `${area.accuracy}%` }}
                />
              </div>
              <Link
                href={`/practice?category=${encodeURIComponent(area.category)}`}
                className="text-sm text-primary hover:underline mt-1 inline-block"
              >
                Practice this category →
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
