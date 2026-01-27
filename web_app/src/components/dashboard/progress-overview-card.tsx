import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProgressOverviewCardProps {
  data: {
    totalExamsTaken: number;
    averageScore: number;
    passRate: number;
    currentStreak: number;
  };
}

export function ProgressOverviewCard({ data }: ProgressOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Exams Taken"
            value={data.totalExamsTaken}
            icon="📝"
          />
          <MetricCard
            label="Average Score"
            value={`${data.averageScore.toFixed(1)}%`}
            icon="📊"
            trend={data.averageScore >= 82 ? 'up' : 'neutral'}
          />
          <MetricCard
            label="Pass Rate"
            value={`${data.passRate.toFixed(1)}%`}
            icon="✅"
            trend={data.passRate >= 70 ? 'up' : 'down'}
          />
          <MetricCard
            label="Current Streak"
            value={`${data.currentStreak} days`}
            icon="🔥"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string | number;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="flex items-start space-x-3 rounded-[24px] border-2 border-gray-200 p-4">
      <div className="text-3xl">{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {trend && (
          <div className="mt-1 flex items-center text-sm">
            {trend === 'up' && (
              <span className="text-green-600">↑ Good progress</span>
            )}
            {trend === 'down' && (
              <span className="text-red-600">↓ Needs improvement</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
