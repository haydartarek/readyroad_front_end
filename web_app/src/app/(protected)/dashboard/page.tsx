'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ProgressOverviewCard } from '@/components/dashboard/progress-overview-card';
import { QuickActionsSection } from '@/components/dashboard/quick-actions-section';
import { WeakAreasPreview } from '@/components/dashboard/weak-areas-preview';
import { RecentActivityList } from '@/components/dashboard/recent-activity-list';
import { getOverallProgress, getWeakAreas } from '@/services';
import { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';

// Default values for when API returns no data
const defaultProgressData = {
  totalExamsTaken: 0,
  averageScore: 0,
  passRate: 0,
  currentStreak: 0,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState(defaultProgressData);
  const [weakAreas, setWeakAreas] = useState<{ category: string; accuracy: number; totalQuestions: number }[]>([]);
  const [recentActivities, setRecentActivities] = useState<{ id: string; type: 'exam' | 'practice'; date: string; score: number; passed?: boolean; category?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch overall progress using service
        const progress = await getOverallProgress();

        setProgressData({
          totalExamsTaken: progress.totalAttempts || 0,
          averageScore: progress.overallAccuracy || 0,
          passRate: progress.overallAccuracy >= 82 ? 100 : (progress.overallAccuracy / 82) * 100,
          currentStreak: progress.studyStreak || 0,
        });

        // Fetch weak areas using service
        const weakAreasData = await getWeakAreas();
        const areas = weakAreasData.weakAreas || [];

        setWeakAreas(
          areas.map((area) => ({
            category: area.categoryName,
            accuracy: area.accuracy,
            totalQuestions: area.totalCount,
          }))
        );

        // For recent activities, we'll use the progress data for now
        // In a real implementation, you'd have a separate endpoint for recent activities
        if (progress.lastActivityDate) {
          setRecentActivities([
            {
              id: '1',
              type: 'practice',
              date: progress.lastActivityDate,
              score: Math.round(progress.overallAccuracy),
            },
          ]);
        }
      } catch (error) {
        logApiError('Failed to fetch dashboard data', error);
        if (isServiceUnavailable(error)) {
          setServiceUnavailable(true);
        }
        // Don't show error toast for new users who have no data yet
        // The API might return 404 or empty data for new users
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {user?.firstName || 'User'}!
          </h1>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {serviceUnavailable && <ServiceUnavailableBanner onRetry={() => { setServiceUnavailable(false); setFetchKey(k => k + 1); }} className="mb-4" />}

      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Welcome back, {user?.firstName || 'User'}!
        </h1>
        <p className="text-muted-foreground">
          Ready to continue your journey to mastering the Belgian driving license?
        </p>
      </div>

      {/* Progress Overview */}
      <ProgressOverviewCard data={progressData} />

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <QuickActionsSection />
      </div>

      {/* Weak Areas & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeakAreasPreview weakAreas={weakAreas} />
        <RecentActivityList activities={recentActivities} />
      </div>
    </div>
  );
}
