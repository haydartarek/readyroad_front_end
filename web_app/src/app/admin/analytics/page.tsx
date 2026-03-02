'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/language-context';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Users, TrafficCone, ClipboardList, GraduationCap, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type DashboardStats = {
  totalUsers: number; activeUsers: number;
  adminUsers: number; moderatorUsers: number;
  totalSigns: number; totalQuizAttempts: number;
};
type QuizStats = {
  averageScore: number; totalCompleted: number;
  totalPassed: number; passRate: number;
};
type CategoryStat = {
  categoryId: number; categoryCode: string; categoryName: string;
  totalAttempted: number; totalCorrect: number;
  avgAccuracy: number; userCount: number;
};
type RecentExam = {
  examId: number; score: number; totalQuestions: number;
  scorePercentage: number; passed: boolean;
  startedAt: string; completedAt: string;
  userId: number; username: string; fullName: string;
};
type RecentExamsResponse = { exams: RecentExam[]; total: number };

// ─── Sub-components ────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, loading, colorClass }: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; loading: boolean; colorClass: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
          {loading ? (
            <div className="mt-2 h-7 w-20 animate-pulse rounded-lg bg-muted" />
          ) : (
            <p className="text-2xl font-black text-foreground mt-0.5">{value}</p>
          )}
          {sub && !loading && (
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function RoleBar({ label, count, total, colorClass }: {
  label: string; count: number; total: number; colorClass: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-bold text-foreground">{count} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-2 rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-xl font-black', accent ?? 'text-foreground')}>{value}</p>
    </div>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

function SectionCard({ title, children, className }: {
  title: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-4', className)}>
      <h3 className="text-base font-black text-foreground">{title}</h3>
      {children}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [recentExams, setRecentExams] = useState<RecentExamsResponse | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, quizRes, catRes, examRes] = await Promise.allSettled([
        apiClient.get<DashboardStats>('/admin/dashboard'),
        apiClient.get<QuizStats>('/admin/analytics/quiz-stats'),
        apiClient.get<CategoryStat[]>('/admin/analytics/category-stats'),
        apiClient.get<RecentExamsResponse>('/admin/analytics/recent-exams?limit=20'),
      ]);
      if (dashRes.status === 'fulfilled') setStats(dashRes.value.data);
      if (quizRes.status === 'fulfilled') setQuizStats(quizRes.value.data);
      if (catRes.status === 'fulfilled') {
        const data = catRes.value.data;
        setCategoryStats(Array.isArray(data) ? data : []);
      }
      if (examRes.status === 'fulfilled') setRecentExams(examRes.value.data);
      if (dashRes.status === 'rejected') setError(t('admin.analytics.fetch_error'));
    } catch (e: unknown) {
      logApiError('Analytics fetch error', e);
      if (isServiceUnavailable(e)) setServiceUnavailable(true);
      else setError(t('admin.analytics.fetch_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="space-y-6">

      {serviceUnavailable && (
        <ServiceUnavailableBanner onRetry={fetchAll} />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t('admin.analytics.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('admin.analytics.description')}</p>
        </div>
        <Button
          variant="outline"
          onClick={fetchAll}
          disabled={loading}
          className="gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          {loading ? t('common.loading') : t('admin.analytics.refresh')}
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="ml-3 hover:opacity-70 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label={t('admin.analytics.total_users')}
          value={stats?.totalUsers ?? '-'}
          sub={`${stats?.activeUsers ?? 0} ${t('admin.analytics.active')}`}
          loading={loading}
          colorClass="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          icon={<TrafficCone className="w-5 h-5" />}
          label={t('admin.analytics.total_signs')}
          value={stats?.totalSigns ?? '-'}
          loading={loading}
          colorClass="bg-green-500/10 text-green-500"
        />
        <StatCard
          icon={<ClipboardList className="w-5 h-5" />}
          label={t('admin.analytics.total_quiz_attempts')}
          value={stats?.totalQuizAttempts ?? '-'}
          loading={loading}
          colorClass="bg-purple-500/10 text-purple-500"
        />
        <StatCard
          icon={<GraduationCap className="w-5 h-5" />}
          label={t('admin.analytics.total_exams')}
          value={recentExams?.total ?? '-'}
          loading={loading}
          colorClass="bg-amber-500/10 text-amber-500"
        />
      </div>

      {/* Role Distribution */}
      {stats && (
        <SectionCard title={t('admin.analytics.user_roles')}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <RoleBar
              label={t('admin.analytics.role_user')}
              count={stats.totalUsers - stats.adminUsers - stats.moderatorUsers}
              total={stats.totalUsers}
              colorClass="bg-muted-foreground"
            />
            <RoleBar
              label={t('admin.analytics.role_moderator')}
              count={stats.moderatorUsers}
              total={stats.totalUsers}
              colorClass="bg-blue-500"
            />
            <RoleBar
              label={t('admin.analytics.role_admin')}
              count={stats.adminUsers}
              total={stats.totalUsers}
              colorClass="bg-purple-500"
            />
          </div>
        </SectionCard>
      )}

      {/* Quiz & Category Performance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title={t('admin.analytics.quiz_performance')}>
          {loading ? <LoadingPlaceholder /> : quizStats ? (
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label={t('admin.analytics.avg_score')} value={`${quizStats.averageScore}%`} accent="text-blue-500" />
              <MiniStat label={t('admin.analytics.pass_rate')} value={`${quizStats.passRate}%`} accent="text-green-500" />
              <MiniStat label={t('admin.analytics.total_completed')} value={String(quizStats.totalCompleted)} />
              <MiniStat label={t('admin.analytics.total_passed_count')} value={String(quizStats.totalPassed)} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">{t('admin.analytics.no_data')}</p>
          )}
        </SectionCard>

        <SectionCard title={t('admin.analytics.category_performance')}>
          {loading ? <LoadingPlaceholder /> : categoryStats.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {categoryStats.map((cat) => (
                <div
                  key={cat.categoryId}
                  className="flex items-center justify-between rounded-xl bg-muted/30 border border-border/30 px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate block">
                      {cat.categoryName || cat.categoryCode}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {cat.totalCorrect}/{cat.totalAttempted} correct • {cat.userCount} {t('admin.analytics.users_label')}
                    </span>
                  </div>
                  <Badge className={cn(
                    'ml-3 flex-shrink-0 border-0 text-xs font-bold',
                    cat.avgAccuracy >= 70 ? 'bg-green-500/10 text-green-600' :
                    cat.avgAccuracy >= 50 ? 'bg-amber-500/10 text-amber-600' :
                    'bg-destructive/10 text-destructive'
                  )}>
                    {cat.avgAccuracy.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">{t('admin.analytics.no_category_data')}</p>
          )}
        </SectionCard>
      </div>

      {/* Recent Exams Table */}
      <SectionCard title={t('admin.analytics.recent_exams')}>
        {loading ? <LoadingPlaceholder /> : recentExams && recentExams.exams.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border/40">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 border-b border-border/40">
                <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 text-left font-semibold">{t('admin.analytics.exam_user')}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('admin.analytics.exam_score')}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('admin.analytics.exam_result')}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('admin.analytics.exam_date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {recentExams.exams.map((exam, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-foreground">{exam.username || '-'}</span>
                      {exam.fullName && (
                        <span className="text-xs text-muted-foreground ml-1.5">({exam.fullName})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {exam.score}/{exam.totalQuestions}
                      {exam.scorePercentage != null && (
                        <span className="text-xs text-muted-foreground ml-1">({Math.round(exam.scorePercentage)}%)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn(
                        'text-xs font-semibold border-0',
                        exam.passed
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-destructive/10 text-destructive'
                      )}>
                        {exam.passed ? `✅ ${t('exam.passed')}` : `❌ ${t('exam.failed')}`}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {exam.completedAt
                        ? new Date(exam.completedAt).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 space-y-2">
            <div className="text-4xl">📋</div>
            <p className="text-sm text-muted-foreground">{t('admin.analytics.no_exams')}</p>
          </div>
        )}
      </SectionCard>

    </div>
  );
}
