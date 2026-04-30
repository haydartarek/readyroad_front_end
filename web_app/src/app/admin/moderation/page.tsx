'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ShieldCheck, Lock, Unlock, Users, UserX, UserPlus,
  RefreshCw, AlertTriangle, X,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────

type UserRow = {
  id: number; username: string; email: string;
  fullName: string; role: string;
  isActive: boolean; isLocked: boolean; createdAt: string;
};
type UsersResponse = { users: UserRow[]; total: number };

// ─── Helpers ────────────────────────────────────────────

const ROLE_COLOR: Record<string, string> = {
  ADMIN:     'bg-purple-500',
  MODERATOR: 'bg-blue-500',
  STUDENT:   'bg-emerald-500',
  USER:      'bg-slate-400',
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return dateStr; }
}

function isNewThisWeek(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
}

// ─── Stat Card ──────────────────────────────────────────

function StatCard({ label, value, icon, colorClass, bgClass }: {
  label: string; value: number;
  icon: React.ReactNode; colorClass: string; bgClass: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-4 flex items-center gap-4">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', bgClass)}>
        <span className={colorClass}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn('text-2xl font-black', colorClass)}>{value}</p>
      </div>
    </div>
  );
}

// ─── User Table ─────────────────────────────────────────

function UserTable({
  rows, emptyMsg, unlocking, onUnlock, showUnlock = false,
}: {
  rows: UserRow[];
  emptyMsg: string;
  unlocking: Record<number, boolean>;
  onUnlock?: (user: UserRow) => void;
  showUnlock?: boolean;
}) {
  const { t } = useLanguage();

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-muted-foreground">
        <ShieldCheck className="w-8 h-8 text-emerald-500" />
        <p className="text-sm">{emptyMsg}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50 border-b border-border/40">
          <tr className="text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 text-left font-semibold">{t('admin.moderation.col_user')}</th>
            <th className="px-4 py-3 text-left font-semibold">{t('admin.moderation.col_role')}</th>
            <th className="px-4 py-3 text-left font-semibold">{t('admin.moderation.col_status')}</th>
            <th className="px-4 py-3 text-left font-semibold">{t('admin.moderation.col_joined')}</th>
            {showUnlock && (
              <th className="px-4 py-3 text-right font-semibold">{t('admin.moderation.col_actions')}</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {rows.map(user => {
            const displayName = user.fullName || user.username;
            const avatarColor = ROLE_COLOR[user.role] || 'bg-slate-400';
            const isUnlocking = !!unlocking[user.id];

            return (
              <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0',
                      avatarColor
                    )}>
                      {(displayName || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{displayName}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white',
                    avatarColor
                  )}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className={cn(
                      'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                      user.isActive
                        ? 'bg-emerald-500/10 text-emerald-700'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {user.isActive ? t('admin.users.status_active') : t('admin.users.status_inactive')}
                    </span>
                    {user.isLocked && (
                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                        <Lock className="w-2.5 h-2.5" />
                        {t('admin.users.status_locked')}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDate(user.createdAt)}
                </td>
                {showUnlock && (
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onUnlock?.(user)}
                      disabled={isUnlocking}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border border-emerald-200 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 disabled:opacity-50 transition-all"
                    >
                      {isUnlocking
                        ? <RefreshCw className="w-3 h-3 animate-spin" />
                        : <Unlock className="w-3 h-3" />}
                      {t('admin.moderation.unlock')}
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tab Button ─────────────────────────────────────────

function TabBtn({ active, onClick, icon, label, count }: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string; count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all',
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
          : 'bg-card border-border/50 text-muted-foreground hover:bg-muted/50'
      )}
    >
      {icon}
      {label}
      <span className={cn(
        'ml-1 rounded-full px-1.5 py-0.5 text-xs font-black',
        active ? 'bg-white/20' : 'bg-muted text-foreground'
      )}>
        {count}
      </span>
    </button>
  );
}

// ─── Page ───────────────────────────────────────────────

type Tab = 'locked' | 'new' | 'inactive';

export default function AdminModerationPage() {
  const { t } = useLanguage();

  const [users, setUsers]                   = useState<UserRow[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [serviceUnavailable, setSvcUnavail] = useState(false);
  const [activeTab, setActiveTab]           = useState<Tab>('locked');
  const [unlocking, setUnlocking]           = useState<Record<number, boolean>>({});

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await apiClient.get<UsersResponse>('/admin/users', { page: 0, size: 200 });
      const data = res.data;
      const list = Array.isArray(data) ? data : (data.users ?? []);
      setUsers(list);
    } catch (e: unknown) {
      logApiError('Moderation: failed to fetch users', e);
      if (isServiceUnavailable(e)) setSvcUnavail(true);
      else setError(t('admin.moderation.fetch_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const lockedUsers   = useMemo(() => users.filter(u => u.isLocked), [users]);
  const inactiveUsers = useMemo(() => users.filter(u => !u.isActive && !u.isLocked), [users]);
  const newUsers      = useMemo(() => {
    return [...users]
      .filter(u => isNewThisWeek(u.createdAt))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [users]);

  const handleUnlock = async (user: UserRow) => {
    setUnlocking(p => ({ ...p, [user.id]: true }));
    setUsers(p => p.map(u => u.id === user.id ? { ...u, isLocked: false } : u));
    try {
      await apiClient.put(`/admin/users/${user.id}/lock`, { isLocked: false });
    } catch (e: unknown) {
      logApiError('Failed to unlock user', e);
      setUsers(p => p.map(u => u.id === user.id ? { ...u, isLocked: true } : u));
      setError(t('admin.moderation.unlock_error'));
    } finally {
      setUnlocking(p => { const n = { ...p }; delete n[user.id]; return n; });
    }
  };

  const tabRows: Record<Tab, UserRow[]> = {
    locked:   lockedUsers,
    new:      newUsers,
    inactive: inactiveUsers,
  };

  const emptyMessages: Record<Tab, string> = {
    locked:   t('admin.moderation.no_locked'),
    new:      t('admin.moderation.no_new'),
    inactive: t('admin.moderation.no_inactive'),
  };

  return (
    <div className="space-y-5">
      {serviceUnavailable && <ServiceUnavailableBanner onRetry={fetchUsers} />}

      <AdminPageHeader
        icon={<ShieldCheck className="h-6 w-6" />}
        title={t('admin.moderation.title')}
        description={t('admin.moderation.description')}
        actions={
          <Button variant="outline" onClick={fetchUsers} disabled={loading} className="gap-2">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            {loading ? t('common.loading') : t('admin.moderation.refresh')}
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={t('admin.moderation.stats_locked')}
          value={loading ? 0 : lockedUsers.length}
          icon={<Lock className="w-5 h-5" />}
          colorClass="text-destructive"
          bgClass="bg-destructive/10"
        />
        <StatCard
          label={t('admin.moderation.stats_inactive')}
          value={loading ? 0 : inactiveUsers.length}
          icon={<UserX className="w-5 h-5" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-500/10"
        />
        <StatCard
          label={t('admin.moderation.stats_new')}
          value={loading ? 0 : newUsers.length}
          icon={<UserPlus className="w-5 h-5" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-500/10"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="flex-shrink-0 hover:opacity-70 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabBtn
          active={activeTab === 'locked'}
          onClick={() => setActiveTab('locked')}
          icon={<Lock className="w-4 h-4" />}
          label={t('admin.moderation.tab_locked')}
          count={lockedUsers.length}
        />
        <TabBtn
          active={activeTab === 'new'}
          onClick={() => setActiveTab('new')}
          icon={<UserPlus className="w-4 h-4" />}
          label={t('admin.moderation.tab_new')}
          count={newUsers.length}
        />
        <TabBtn
          active={activeTab === 'inactive'}
          onClick={() => setActiveTab('inactive')}
          icon={<Users className="w-4 h-4" />}
          label={t('admin.moderation.tab_inactive')}
          count={inactiveUsers.length}
        />
      </div>

      {/* Table Card */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-sm">{t('common.loading')}</span>
          </div>
        ) : (
          <UserTable
            rows={tabRows[activeTab]}
            emptyMsg={emptyMessages[activeTab]}
            unlocking={unlocking}
            onUnlock={activeTab === 'locked' ? handleUnlock : undefined}
            showUnlock={activeTab === 'locked'}
          />
        )}
      </div>
    </div>
  );
}
