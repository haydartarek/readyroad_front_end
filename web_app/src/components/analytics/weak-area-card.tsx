import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WeakAreaCardProps {
  area: {
    category: string;
    accuracy: number;
    totalAttempts: number;
    correctAnswers: number;
    incorrectAnswers: number;
    rank: 'critical' | 'needs-improvement' | 'good';
    relatedTopics: string[];
    practiceRecommendations: Array<{
      title: string;
      link: string;
    }>;
  };
}

export function WeakAreaCard({ area }: WeakAreaCardProps) {
  const rankConfig = {
    critical: {
      color: 'bg-red-100 border-red-300 text-red-800',
      icon: '🚨',
      label: 'Critical',
    },
    'needs-improvement': {
      color: 'bg-orange-100 border-orange-300 text-orange-800',
      icon: '⚠️',
      label: 'Needs Improvement',
    },
    good: {
      color: 'bg-green-100 border-green-300 text-green-800',
      icon: '✅',
      label: 'Good',
    },
  };

  const config = rankConfig[area.rank];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {config.icon} {area.category}
            </CardTitle>
            <p className="text-3xl font-bold mt-2">{area.accuracy.toFixed(1)}%</p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${config.color}`}
          >
            {config.label}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-[12px]">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-xl font-bold">{area.totalAttempts}</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-[12px]">
            <p className="text-sm text-gray-600">Correct</p>
            <p className="text-xl font-bold text-green-600">{area.correctAnswers}</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-[12px]">
            <p className="text-sm text-gray-600">Incorrect</p>
            <p className="text-xl font-bold text-red-600">{area.incorrectAnswers}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Related Topics:</p>
          <div className="flex flex-wrap gap-2">
            {area.relatedTopics.map((topic) => (
              <span
                key={topic}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Practice Resources:</p>
          <div className="space-y-2">
            {area.practiceRecommendations.map((rec) => (
              <Link key={rec.link} href={rec.link}>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-[12px] hover:bg-gray-100 transition-colors">
                  <span className="text-sm">{rec.title}</span>
                  <span className="text-primary">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Direct practice button for category */}
        <div>
          <Button asChild className="w-full" size="lg">
            <Link href={`/practice/${area.category.toLowerCase().replace(/\s+/g, '-')}`}>
              <span className="mr-2">💪</span>
              Practice Now
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
