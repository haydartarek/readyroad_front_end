'use client';

import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-muted-foreground">
          Ready to continue your journey to mastering the Belgian driving license?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📝</span>
              {t('exam.start')}
            </CardTitle>
            <CardDescription>
              Take a full 50-question exam (45 minutes)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={ROUTES.EXAM}>{t('exam.start')}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              {t('practice.start')}
            </CardTitle>
            <CardDescription>
              Practice specific categories and difficulties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href={ROUTES.PRACTICE}>{t('practice.start')}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              {t('analytics.weak_areas')}
            </CardTitle>
            <CardDescription>
              View your performance analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href={ROUTES.ANALYTICS_WEAK_AREAS}>View Analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>{t('progress.overview')}</CardTitle>
          <CardDescription>Your learning statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="text-3xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">{t('progress.exams_taken')}</div>
            </div>
            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="text-3xl font-bold text-primary">0%</div>
              <div className="text-sm text-muted-foreground">{t('progress.average_score')}</div>
            </div>
            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="text-3xl font-bold text-primary">0%</div>
              <div className="text-sm text-muted-foreground">{t('progress.pass_rate')}</div>
            </div>
            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="text-3xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">{t('progress.current_streak')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🚦</span>
              {t('nav.traffic_signs')}
            </CardTitle>
            <CardDescription>
              Learn 200+ Belgian traffic signs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href={ROUTES.TRAFFIC_SIGNS}>Browse Signs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📚</span>
              {t('nav.lessons')}
            </CardTitle>
            <CardDescription>
              31 comprehensive theory lessons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href={ROUTES.LESSONS}>View Lessons</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
