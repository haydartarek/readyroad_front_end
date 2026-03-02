'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/language-context';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Users, UserCheck, UserX, Search, RefreshCw,
  Lock, Unlock, AlertTriangle, X,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────

type UserRow = {
  id: number; username: string; email: string;
  fullName: string; role: string;
  isActive: boolean; isLocked: boolean; createdAt: string;
};
type UsersResponse = {
  users: UserRow[]; total: number; page: number; size: number;
};

const ROLES = ['USER', 'STUDENT', 'MODERATOR', 'ADMIN'] as const;

// ─── Helpers ────────────────────────────────────────────

const AVATAR_COLOR: Record<string, string> = {
  ADMIN:     'bg-purple-500',
  MODERATOR: 'bg-blue-500',
  STUDENT:   'bg-emerald-500',
  USER:      'bg-slate-400',
};

const ROLE_SELECT: Record<string, string> = {
  ADMIN:     'border-purple-200 bg-purple-500/10 text-purple-700',
  MODERATOR: 'border-blue-200 bg-blue-500/10 text-blue-700',
  STUDENT:   'border-emerald-200 bg-emerald-500/10 text-emerald-700',
  USER:      'border-border bg-muted text-foreground',
};

function StatCard({ label, value, icon, labelClass, valueClass, iconClass }: {
  label: string; value: number;
  icon: React.ReactNode; labelClass: string; valueClass: string; iconClass?: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-4 flex items-center gap-4">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconClass ?? 'bg-muted')}>
        {icon}
      </div>
      <div>
        <p className={cn('text-xs font-semibold uppercase tracking-wide', labelClass)}>{label}</p>
        <p className={cn('text-2xl font-black', valueClass)}>{value}</p>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return dateStr; }
}

// ─── Page ───────────────────────────────────────────────

export default function AdminUsersPage() {
  const { t } = useLanguage();

  const [users, setUsers]       = useState<UserRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [page, setPage]         = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [actionLoading, setActionLoading] = useState<Record<number, string>>({});

  const pageSize   = 20;
  const totalPages = Math.ceil(totalUsers / pageSize);

  const clearAction = (id: number) =>
    setActionLoading(prev => { const n = { ...prev }; delete n[id]; return n; });

  const fetchUsers = useCallback(async (pageNum = 0) => {
    setLoading(true); setError(null);
    try {
      const res  = await apiClient.get<UsersResponse>('/admin/users', { page: pageNum, size: pageSize });
      const data = res.data;
      const list = Array.isArray(data) ? data : (data.users ?? []);
      setUsers(list);
      setTotalUsers(data.total ?? list.length);
      setPage(pageNum);
    } catch (e: unknown) {
      logApiError('Failed to fetch users', e);
      if (isServiceUnavailable(e)) setServiceUnavailable(true);
      else setError(t('admin.users.fetch_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchUsers(0); }, [fetchUsers]);

  const toggleLock = async (user: UserRow) => {
    const next = !user.isLocked;
    setActionLoading(prev => ({ ...prev, [user.id]: 'lock' }));
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isLocked: next } : u));
    try {
      await apiClient.put(`/admin/users/${user.id}/lock`, { isLocked: next });
    } catch (e: unknown) {
      logApiError('Failed to toggle lock', e);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isLocked: user.isLocked } : u));
      if (isServiceUnavailable(e)) setServiceUnavailable(true);
      else setError(t('admin.users.lock_error'));
    } finally { clearAction(user.id); }
  };

  const changeRole = async (user: UserRow, newRole: string) => {
    const prev = user.role;
    setActionLoading(p => ({ ...p, [user.id]: 'role' }));
    setUsers(p => p.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    try {
      await apiClient.put(`/admin/users/${user.id}/role`, { role: newRole });
    } catch (e: unknown) {
      logApiError('Failed to change role', e);
      setUsers(p => p.map(u => u.id === user.id ? { ...u, role: prev } : u));
      if (isServiceUnavailable(e)) setServiceUnavailable(true);
      else setError(t('admin.users.role_error'));
    } finally { clearAction(user.id); }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(u =>
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.fullName?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const activeCount = useMemo(() => users.filter(u => u.isActive && !u.isLocked).length, [users]);
  const lockedCount = useMemo(() => users.filter(u => u.isLocked).length, [users]);

  return (
    <div className="space-y-5">
      {serviceUnavailable && <ServiceUnavailableBanner onRetry={() => fetchUsers(page)} />}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t('admin.users.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('admin.users.description')}</p>
        </div>
        <Button variant="outline" onClick={() => fetchUsers(page)} disabled={loading} className="gap-2">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          {loading ? t('common.loading') : t('admin.users.refresh')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={t('admin.users.total_users')} value={totalUsers}
          icon={<Users className="w-5 h-5 text-primary" />}
          labelClass="text-muted-foreground" valueClass="text-foreground"
          iconClass="bg-primary/10"
        />
        <StatCard
          label={t('admin.users.active_users')} value={activeCount}
          icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
          labelClass="text-emerald-600" valueClass="text-emerald-700"
          iconClass="bg-emerald-500/10"
        />
        <StatCard
          label={t('admin.users.locked_users')} value={lockedCount}
          icon={<UserX className="w-5 h-5 text-destructive" />}
          labelClass="text-destructive" valueClass="text-destructive"
          iconClass="bg-destructive/10"
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

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('admin.users.search_placeholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredUsers.length}</span> / {totalUsers}
        </span>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 border-b border-border/40">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 text-left font-semibold">{t('admin.users.col_user')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('admin.users.col_email')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('admin.users.col_role')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('admin.users.col_status')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('admin.users.col_joined')}</th>
                <th className="px-4 py-3 text-right font-semibold">{t('admin.signs.col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                      <span>{t('common.loading')}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="space-y-2">
                      <div className="text-4xl">👤</div>
                      <p className="text-muted-foreground">{t('admin.users.no_users')}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.map(user => {
                const isLoading  = !!actionLoading[user.id];
                const displayName = user.fullName || user.username;
                const avatarColor = AVATAR_COLOR[user.role] || 'bg-slate-400';

                return (
                  <tr
                    key={user.id}
                    className={cn(
                      'hover:bg-muted/30 transition-colors',
                      user.isLocked && 'bg-destructive/5'
                    )}
                  >
                    {/* User */}
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

                    {/* Email */}
                    <td className="px-4 py-3 text-muted-foreground text-sm">{user.email || '—'}</td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={e => changeRole(user, e.target.value)}
                        disabled={isLoading}
                        className={cn(
                          'rounded-lg border px-2 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 transition-all cursor-pointer',
                          ROLE_SELECT[user.role] || ROLE_SELECT.USER
                        )}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>

                    {/* Status */}
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

                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleLock(user)}
                        disabled={isLoading}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all disabled:opacity-50',
                          user.isLocked
                            ? 'border-emerald-200 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20'
                            : 'border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20'
                        )}
                      >
                        {isLoading && actionLoading[user.id] === 'lock' ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : user.isLocked ? (
                          <><Unlock className="w-3 h-3" /> {t('admin.users.unlock')}</>
                        ) : (
                          <><Lock className="w-3 h-3" /> {t('admin.users.lock')}</>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/40 bg-muted/30 px-4 py-3">
            <span className="text-xs text-muted-foreground font-medium">
              {t('admin.users.page_info')
                .replace('{current}', String(page + 1))
                .replace('{total}', String(totalPages))}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchUsers(page - 1)}
                disabled={page === 0 || loading}
                className="w-8 h-8 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-2">{page + 1} / {totalPages}</span>
              <button
                onClick={() => fetchUsers(page + 1)}
                disabled={page >= totalPages - 1 || loading}
                className="w-8 h-8 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
