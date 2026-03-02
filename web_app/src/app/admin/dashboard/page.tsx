'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, isServiceUnavailable, logApiError } from '@/lib/api';
import { useLanguage } from '@/contexts/language-context';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import Link from 'next/link';
import { Users, TrafficCone, ClipboardList, PlusCircle, BarChart2, Settings, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  totalSigns: number;
  totalUsers: number;
  totalQuizzes: number;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ title, value, icon, colorClass, bgClass, description, loading }: {
  title: string; value: number; icon: React.ReactNode;
  colorClass: string; bgClass: string; description: string; loading?: boolean;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bgClass} ${colorClass}`}>
          {icon}
        </div>
        {loading ? (
          <div className="h-9 w-20 animate-pulse rounded-xl bg-muted" />
        ) : (
          <p className={`text-3xl font-black ${colorClass}`}>
            {value.toLocaleString()}
          </p>
        )}
      </div>
      <h3 className="font-bold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
    </div>
  );
}

function QuickActionButton({ icon, label, href }: {
  icon: React.ReactNode; label: string; href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/50 bg-muted/30 hover:bg-primary/5 hover:border-primary/30 p-4 transition-all duration-200"
    >
      <div className="w-10 h-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors duration-200 group-hover:scale-110">
        {icon}
      </div>
      <span className="text-sm font-semibold text-foreground text-center leading-tight">{label}</span>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-muted rounded-xl w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 h-36" />
        ))}
      </div>
      <div className="bg-card rounded-2xl border border-border/50 h-40" />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

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
      if (isServiceUnavailable(err)) setServiceUnavailable(true);
      else setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-3">
        <h3 className="font-black text-destructive">⚠️ {t('admin.error_loading')}</h3>
        <p className="text-sm text-destructive/80">{error.message || t('admin.error_unexpected')}</p>
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 text-sm font-semibold text-destructive hover:underline"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {serviceUnavailable && (
        <ServiceUnavailableBanner onRetry={fetchDashboard} />
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/15 px-6 py-7 shadow-sm">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black tracking-tight">{t('admin.dashboard')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('admin.welcome')},{' '}
              <span className="font-semibold text-foreground">
                {user?.fullName || t('admin.system_admin')}
              </span>
            </p>
          </div>
          {user?.role && (
            <Badge className="bg-amber-500/15 text-amber-600 border-0 font-bold px-3 py-1 text-sm">
              {user.role}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          title={t('admin.total_users')}
          value={data?.totalUsers ?? 0}
          icon={<Users className="w-6 h-6" />}
          colorClass="text-blue-500"
          bgClass="bg-blue-500/10"
          description={t('admin.total_users_desc')}
        />
        <StatCard
          title={t('admin.total_signs')}
          value={data?.totalSigns ?? 0}
          icon={<TrafficCone className="w-6 h-6" />}
          colorClass="text-green-500"
          bgClass="bg-green-500/10"
          description={t('admin.total_signs_desc')}
        />
        <StatCard
          title={t('admin.total_quizzes')}
          value={data?.totalQuizzes ?? 0}
          icon={<ClipboardList className="w-6 h-6" />}
          colorClass="text-purple-500"
          bgClass="bg-purple-500/10"
          description={t('admin.total_quizzes_desc')}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
        <h2 className="text-base font-black text-foreground">{t('admin.quick_actions')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickActionButton
            icon={<PlusCircle className="w-5 h-5" />}
            label={t('admin.add_sign')}
            href="/admin/signs/new"
          />
          <QuickActionButton
            icon={<Users className="w-5 h-5" />}
            label={t('admin.manage_users')}
            href="/admin/users"
          />
          <QuickActionButton
            icon={<BarChart2 className="w-5 h-5" />}
            label={t('admin.statistics')}
            href="/admin/analytics"
          />
          <QuickActionButton
            icon={<Settings className="w-5 h-5" />}
            label={t('admin.settings')}
            href="/admin/settings"
          />
        </div>
      </div>

    </div>
  );
}
