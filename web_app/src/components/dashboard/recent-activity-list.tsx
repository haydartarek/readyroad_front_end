import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface RecentActivityListProps {
  activities: Array<{
    id: string;
    type: 'exam' | 'practice';
    date: string;
    score?: number;
    category?: string;
    passed?: boolean;
  }>;
}

export function RecentActivityList({ activities }: RecentActivityListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between rounded-[12px] border border-border p-4 hover:bg-muted transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {activity.type === 'exam' ? '📝' : '🎯'}
                </div>
                <div>
                  <p className="font-medium">
                    {activity.type === 'exam'
                      ? 'Official Exam'
                      : `Practice: ${activity.category}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(activity.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              {activity.score !== undefined && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="font-bold text-lg">{activity.score}%</p>
                    {activity.passed !== undefined && (
                      <p
                        className={`text-sm ${activity.passed ? 'text-green-600' : 'text-red-600'
                          }`}
                      >
                        {activity.passed ? '✅ Passed' : '❌ Failed'}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/${activity.type}/${activity.id}`}
                    className="text-primary hover:underline text-sm"
                  >
                    View →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
