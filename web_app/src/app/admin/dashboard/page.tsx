'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, isServiceUnavailable, logApiError } from '@/lib/api';
import { useLanguage } from '@/contexts/language-context';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';

/**
 * Admin Dashboard Stats Interface
 * Maps to backend AdminController.getDashboard() response
 */
interface DashboardStats {
    totalSigns: number;
    totalUsers: number;
    totalQuizzes: number;
}

/**
 * Admin Dashboard Page - Multilingual (EN, AR, NL, FR)
 */
export default function AdminDashboard() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [data, setData] = useState<DashboardStats | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [serviceUnavailable, setServiceUnavailable] = useState(false);

    const fetchDashboard = useCallback(async () => {
        try {
            setIsLoading(true);
            setServiceUnavailable(false);
            const response = await apiClient.get<DashboardStats>('/admin/dashboard');
            setData(response.data);
        } catch (err) {
            logApiError('Failed to load dashboard', err);
            if (isServiceUnavailable(err)) {
                setServiceUnavailable(true);
            } else {
                setError(err as Error);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-red-800 font-semibold mb-2">{t('admin.error_loading')}</h3>
                <p className="text-red-600">{error.message || t('admin.error_unexpected')}</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-card p-6 rounded-lg shadow-sm border h-32 animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {serviceUnavailable && <ServiceUnavailableBanner onRetry={fetchDashboard} className="mb-4" />}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        {t('admin.dashboard')}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {t('admin.welcome')}, {user?.fullName || t('admin.system_admin')}
                    </p>
                </div>
                <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-semibold border border-amber-200">
                    {user?.role}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title={t('admin.total_users')}
                    value={data?.totalUsers ?? 0}
                    icon="👥"
                    color="blue"
                    description={t('admin.total_users_desc')}
                />
                <StatCard
                    title={t('admin.total_signs')}
                    value={data?.totalSigns ?? 0}
                    icon="🚦"
                    color="green"
                    description={t('admin.total_signs_desc')}
                />
                <StatCard
                    title={t('admin.total_quizzes')}
                    value={data?.totalQuizzes ?? 0}
                    icon="📝"
                    color="purple"
                    description={t('admin.total_quizzes_desc')}
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">{t('admin.quick_actions')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QuickActionButton
                        icon="➕"
                        label={t('admin.add_sign')}
                        href="/admin/signs/new"
                    />
                    <QuickActionButton
                        icon="👥"
                        label={t('admin.manage_users')}
                        href="/admin/users"
                    />
                    <QuickActionButton
                        icon="📊"
                        label={t('admin.statistics')}
                        href="/admin/analytics"
                    />
                    <QuickActionButton
                        icon="⚙️"
                        label={t('admin.settings')}
                        href="/admin/settings"
                    />
                </div>
            </div>
        </div>
    );
}

/**
 * Stat Card Component
 */
function StatCard({
    title,
    value,
    icon,
    color,
    description
}: {
    title: string;
    value: number;
    icon: string;
    color: 'blue' | 'green' | 'purple';
    description: string;
}) {
    const colorClasses = {
        blue: {
            bg: 'bg-blue-50',
            text: 'text-blue-600',
            border: 'border-blue-100'
        },
        green: {
            bg: 'bg-green-50',
            text: 'text-green-600',
            border: 'border-green-100'
        },
        purple: {
            bg: 'bg-purple-50',
            text: 'text-purple-600',
            border: 'border-purple-100'
        },
    };

    const colors = colorClasses[color];

    return (
        <div className={`bg-card p-6 rounded-lg shadow-sm border ${colors.border} hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`text-4xl p-3 rounded-full ${colors.bg}`}>
                    {icon}
                </div>
                <div className="text-right">
                    <p className={`text-3xl font-bold ${colors.text}`}>
                        {value.toLocaleString()}
                    </p>
                </div>
            </div>
            <div>
                <h3 className="text-foreground font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}

/**
 * Quick Action Button Component
 */
function QuickActionButton({
    icon,
    label,
    href
}: {
    icon: string;
    label: string;
    href: string;
}) {
    return (
        <a
            href={href}
            className="flex flex-col items-center justify-center p-4 bg-muted hover:bg-accent rounded-lg border border-border transition-colors group"
        >
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{icon}</span>
            <span className="text-sm font-medium text-foreground">{label}</span>
        </a>
    );
}
