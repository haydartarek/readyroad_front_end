'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/language-context';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';

type DashboardStats = {
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    moderatorUsers: number;
    totalSigns: number;
    totalQuizAttempts: number;
};

type QuizStats = {
    averageScore: number;
    totalCompleted: number;
    totalPassed: number;
    passRate: number;
};

type CategoryStat = {
    categoryId: number;
    categoryCode: string;
    categoryName: string;
    totalAttempted: number;
    totalCorrect: number;
    avgAccuracy: number;
    userCount: number;
};

type RecentExam = {
    examId: number;
    score: number;
    totalQuestions: number;
    scorePercentage: number;
    passed: boolean;
    startedAt: string;
    completedAt: string;
    userId: number;
    username: string;
    fullName: string;
};

type RecentExamsResponse = {
    exams: RecentExam[];
    total: number;
};

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

            if (dashRes.status === 'rejected') {
                setError(t('admin.analytics.fetch_error'));
            }
        } catch (e: any) {
            logApiError('Analytics fetch error', e);
            if (isServiceUnavailable(e)) {
                setServiceUnavailable(true);
            } else {
                setError(t('admin.analytics.fetch_error'));
            }
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    return (
        <div className="space-y-6">
            {serviceUnavailable && <ServiceUnavailableBanner onRetry={fetchAll} className="mb-4" />}

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('admin.analytics.title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('admin.analytics.description')}</p>
                </div>
                <button
                    onClick={fetchAll}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    disabled={loading}
                >
                    {loading ? t('common.loading') : t('admin.analytics.refresh')}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-3 text-red-500 hover:text-red-700 font-bold">&times;</button>
                </div>
            )}

            {/* Overview Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon="👥"
                    label={t('admin.analytics.total_users')}
                    value={stats?.totalUsers ?? '-'}
                    sub={`${stats?.activeUsers ?? 0} ${t('admin.analytics.active')}`}
                    loading={loading}
                    color="blue"
                />
                <StatCard
                    icon="🚦"
                    label={t('admin.analytics.total_signs')}
                    value={stats?.totalSigns ?? '-'}
                    loading={loading}
                    color="green"
                />
                <StatCard
                    icon="📝"
                    label={t('admin.analytics.total_quiz_attempts')}
                    value={stats?.totalQuizAttempts ?? '-'}
                    loading={loading}
                    color="purple"
                />
                <StatCard
                    icon="🎓"
                    label={t('admin.analytics.total_exams')}
                    value={recentExams?.total ?? '-'}
                    loading={loading}
                    color="amber"
                />
            </div>

            {/* Role Distribution */}
            {stats && (
                <div className="bg-card rounded-lg shadow-sm border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-4">{t('admin.analytics.user_roles')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <RoleBar label={t('admin.analytics.role_user')} count={stats.totalUsers - stats.adminUsers - stats.moderatorUsers} total={stats.totalUsers} color="bg-muted-foreground" />
                        <RoleBar label={t('admin.analytics.role_moderator')} count={stats.moderatorUsers} total={stats.totalUsers} color="bg-blue-500" />
                        <RoleBar label={t('admin.analytics.role_admin')} count={stats.adminUsers} total={stats.totalUsers} color="bg-purple-500" />
                    </div>
                </div>
            )}

            {/* Global Quiz Performance & Category Performance */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Quiz Performance */}
                <div className="bg-card rounded-lg shadow-sm border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-4">{t('admin.analytics.quiz_performance')}</h3>
                    {loading ? (
                        <LoadingPlaceholder />
                    ) : quizStats ? (
                        <div className="grid grid-cols-2 gap-3">
                            <MiniStat label={t('admin.analytics.avg_score')} value={`${quizStats.averageScore}%`} />
                            <MiniStat label={t('admin.analytics.pass_rate')} value={`${quizStats.passRate}%`} />
                            <MiniStat label={t('admin.analytics.total_completed')} value={String(quizStats.totalCompleted)} />
                            <MiniStat label={t('admin.analytics.total_passed_count')} value={String(quizStats.totalPassed)} />
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">{t('admin.analytics.no_data')}</p>
                    )}
                </div>

                {/* Category Performance */}
                <div className="bg-card rounded-lg shadow-sm border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-4">{t('admin.analytics.category_performance')}</h3>
                    {loading ? (
                        <LoadingPlaceholder />
                    ) : categoryStats.length > 0 ? (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {categoryStats.map((cat) => (
                                <div key={cat.categoryId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                    <div>
                                        <span className="text-sm font-medium text-foreground">{cat.categoryName || cat.categoryCode}</span>
                                        <span className="text-xs text-muted-foreground ml-2">({cat.userCount} {t('admin.analytics.users_label')})</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground">{cat.totalCorrect}/{cat.totalAttempted}</span>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cat.avgAccuracy >= 70 ? 'bg-green-50 text-green-700' :
                                            cat.avgAccuracy >= 50 ? 'bg-amber-50 text-amber-700' :
                                                'bg-red-50 text-red-700'
                                            }`}>
                                            {cat.avgAccuracy.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">{t('admin.analytics.no_category_data')}</p>
                    )}
                </div>
            </div>

            {/* Recent Exams (all users) */}
            <div className="bg-card rounded-lg shadow-sm border p-5">
                <h3 className="text-base font-semibold text-foreground mb-4">{t('admin.analytics.recent_exams')}</h3>
                {loading ? (
                    <LoadingPlaceholder />
                ) : recentExams && recentExams.exams.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-muted border-b">
                                <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-2 font-semibold">{t('admin.analytics.exam_user')}</th>
                                    <th className="px-4 py-2 font-semibold">{t('admin.analytics.exam_score')}</th>
                                    <th className="px-4 py-2 font-semibold">{t('admin.analytics.exam_result')}</th>
                                    <th className="px-4 py-2 font-semibold">{t('admin.analytics.exam_date')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentExams.exams.map((exam, i) => (
                                    <tr key={i} className="hover:bg-muted">
                                        <td className="px-4 py-2">
                                            <div>
                                                <span className="text-foreground font-medium">{exam.username || '-'}</span>
                                                {exam.fullName && (
                                                    <span className="text-xs text-muted-foreground ml-1">({exam.fullName})</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-foreground">
                                            {exam.score}/{exam.totalQuestions}
                                            {exam.scorePercentage != null && (
                                                <span className="text-xs text-muted-foreground ml-1">({Math.round(exam.scorePercentage)}%)</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${exam.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                                }`}>
                                                {exam.passed ? t('exam.passed') : t('exam.failed')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-muted-foreground text-xs">
                                            {exam.completedAt ? new Date(exam.completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">{t('admin.analytics.no_exams')}</p>
                )}
            </div>
        </div>
    );
}

// ─── Sub-components ─────────────────────

function StatCard({ icon, label, value, sub, loading, color }: {
    icon: string; label: string; value: string | number; sub?: string; loading: boolean; color: string;
}) {
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-700',
        green: 'bg-green-50 text-green-700',
        purple: 'bg-purple-50 text-purple-700',
        amber: 'bg-amber-50 text-amber-700',
    };
    return (
        <div className="bg-card rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${colorMap[color] || 'bg-muted text-foreground'}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                    {loading ? (
                        <div className="mt-1 h-6 w-16 animate-pulse rounded bg-muted" />
                    ) : (
                        <p className="text-xl font-bold text-foreground">{value}</p>
                    )}
                    {sub && !loading && <p className="text-xs text-muted-foreground">{sub}</p>}
                </div>
            </div>
        </div>
    );
}

function RoleBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-foreground">{label}</span>
                <span className="text-sm font-medium text-foreground">{count}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded bg-muted">
                <div className={`h-2 rounded ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
    );
}

function LoadingPlaceholder() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
            ))}
        </div>
    );
}
