'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/language-context';
import apiClient from '@/lib/api';

type UserRow = {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
    isActive: boolean;
    isLocked: boolean;
    createdAt: string;
};

type UsersResponse = {
    users: UserRow[];
    total: number;
    page: number;
    size: number;
};

const ROLES = ['USER', 'STUDENT', 'MODERATOR', 'ADMIN'] as const;

export default function AdminUsersPage() {
    const { t } = useLanguage();

    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination
    const [page, setPage] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const pageSize = 20;

    // Action loading states
    const [actionLoading, setActionLoading] = useState<Record<number, string>>({});

    const fetchUsers = useCallback(async (pageNum: number = 0) => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get<UsersResponse>('/admin/users', {
                params: { page: pageNum, size: pageSize }
            });
            const data = res.data;
            const userList = Array.isArray(data) ? data : (data.users ?? []);
            setUsers(userList);
            setTotalUsers(data.total ?? userList.length);
            setPage(pageNum);
        } catch (e: any) {
            console.error('Failed to fetch users:', e);
            setError(t('admin.users.fetch_error'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchUsers(0);
    }, [fetchUsers]);

    // Lock / Unlock user
    const toggleLock = async (user: UserRow) => {
        const nextLocked = !user.isLocked;
        setActionLoading(prev => ({ ...prev, [user.id]: 'lock' }));

        // Optimistic update
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isLocked: nextLocked } : u));

        try {
            await apiClient.put(`/admin/users/${user.id}/lock`, { isLocked: nextLocked });
        } catch (e: any) {
            // Rollback
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isLocked: user.isLocked } : u));
            setError(t('admin.users.lock_error'));
        } finally {
            setActionLoading(prev => {
                const next = { ...prev };
                delete next[user.id];
                return next;
            });
        }
    };

    // Change role
    const changeRole = async (user: UserRow, newRole: string) => {
        const prevRole = user.role;
        setActionLoading(prev => ({ ...prev, [user.id]: 'role' }));

        // Optimistic update
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));

        try {
            await apiClient.put(`/admin/users/${user.id}/role`, { role: newRole });
        } catch (e: any) {
            // Rollback
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: prevRole } : u));
            setError(t('admin.users.role_error'));
        } finally {
            setActionLoading(prev => {
                const next = { ...prev };
                delete next[user.id];
                return next;
            });
        }
    };

    // Filtered users (client-side search within current page)
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

    // Stats
    const activeCount = useMemo(() => users.filter(u => u.isActive && !u.isLocked).length, [users]);
    const lockedCount = useMemo(() => users.filter(u => u.isLocked).length, [users]);

    const totalPages = Math.ceil(totalUsers / pageSize);

    // Format date
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('admin.users.title')}</h1>
                    <p className="text-gray-600 mt-1">{t('admin.users.description')}</p>
                </div>
                <button
                    onClick={() => fetchUsers(page)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={loading}
                >
                    {loading ? t('common.loading') : t('admin.users.refresh')}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('admin.users.total_users')}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{totalUsers}</p>
                </div>
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-green-600 uppercase tracking-wide">{t('admin.users.active_users')}</p>
                    <p className="mt-1 text-2xl font-bold text-green-700">{activeCount}</p>
                </div>
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-red-600 uppercase tracking-wide">{t('admin.users.locked_users')}</p>
                    <p className="mt-1 text-2xl font-bold text-red-700">{lockedCount}</p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-3 text-red-500 hover:text-red-700 font-bold">&times;</button>
                </div>
            )}

            {/* Search */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder={t('admin.users.search_placeholder')}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                </div>
                <span className="text-sm text-gray-500">
                    {t('admin.signs.showing')} {filteredUsers.length} / {totalUsers}
                </span>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr className="text-xs uppercase tracking-wide text-gray-600">
                                <th className="px-4 py-3 font-semibold">{t('admin.users.col_user')}</th>
                                <th className="px-4 py-3 font-semibold">{t('admin.users.col_email')}</th>
                                <th className="px-4 py-3 font-semibold">{t('admin.users.col_role')}</th>
                                <th className="px-4 py-3 font-semibold">{t('admin.users.col_status')}</th>
                                <th className="px-4 py-3 font-semibold">{t('admin.users.col_joined')}</th>
                                <th className="px-4 py-3 font-semibold text-right">{t('admin.signs.col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            {t('common.loading')}
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                        {t('admin.users.no_users')}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => {
                                    const isLocked = user.isLocked;
                                    const isLoading = !!actionLoading[user.id];
                                    const displayName = user.fullName || user.username;

                                    return (
                                        <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${isLocked ? 'bg-red-50/30' : ''}`}>
                                            {/* User */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${
                                                        user.role === 'ADMIN' ? 'bg-purple-500' :
                                                        user.role === 'MODERATOR' ? 'bg-blue-500' : 'bg-gray-400'
                                                    }`}>
                                                        {(displayName || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{displayName}</div>
                                                        <div className="text-xs text-gray-400">@{user.username}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Email */}
                                            <td className="px-4 py-3 text-gray-600">{user.email || '-'}</td>

                                            {/* Role */}
                                            <td className="px-4 py-3">
                                                <select
                                                    value={user.role}
                                                    onChange={e => changeRole(user, e.target.value)}
                                                    disabled={isLoading}
                                                    className={`rounded-md border px-2 py-1 text-xs font-medium outline-none focus:ring-1 focus:ring-blue-500 ${
                                                        user.role === 'ADMIN' ? 'border-purple-200 bg-purple-50 text-purple-700' :
                                                        user.role === 'MODERATOR' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                                                        'border-gray-200 bg-gray-50 text-gray-700'
                                                    }`}
                                                >
                                                    {ROLES.map(r => (
                                                        <option key={r} value={r}>{r}</option>
                                                    ))}
                                                </select>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        user.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        {user.isActive ? t('admin.users.status_active') : t('admin.users.status_inactive')}
                                                    </span>
                                                    {isLocked && (
                                                        <span className="inline-flex w-fit items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                                                            {t('admin.users.status_locked')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Joined */}
                                            <td className="px-4 py-3 text-gray-500 text-xs">
                                                {formatDate(user.createdAt)}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => toggleLock(user)}
                                                    disabled={isLoading}
                                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                                                        isLocked
                                                            ? 'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                                                            : 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                                                    }`}
                                                >
                                                    {isLoading && actionLoading[user.id] === 'lock'
                                                        ? '...'
                                                        : isLocked
                                                            ? t('admin.users.unlock')
                                                            : t('admin.users.lock')
                                                    }
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
                        <span className="text-xs text-gray-500">
                            {t('admin.users.page_info')
                                .replace('{current}', String(page + 1))
                                .replace('{total}', String(totalPages))}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchUsers(page - 1)}
                                disabled={page === 0 || loading}
                                className="rounded-md border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                            >
                                {t('exam.previous')}
                            </button>
                            <button
                                onClick={() => fetchUsers(page + 1)}
                                disabled={page >= totalPages - 1 || loading}
                                className="rounded-md border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                            >
                                {t('exam.next')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
