/**
 * Test Component for Services
 * Location: src/app/test-services/page.tsx
 * 
 * Usage: Navigate to http://localhost:3000/test-services
 * 
 * This component tests:
 * ✅ userService.getCurrentUser()
 * ✅ userService.getUnreadNotificationCount()
 * ✅ Role checking utilities (isAdmin, isModerator, hasRole)
 */

'use client';

import { useState, useEffect } from 'react';
import {
    getCurrentUser,
    getUnreadNotificationCount,
    isAdmin,
    isModerator,
    hasRole,
    type UserProfile
} from '@/services';

export default function TestServicesPage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [notificationCount, setNotificationCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔄 Loading user data...');

            // ✅ Test userService.getCurrentUser()
            const userData = await getCurrentUser();
            console.log('✅ User loaded:', userData);
            setUser(userData);

            // ✅ Test userService.getUnreadNotificationCount()
            const count = await getUnreadNotificationCount();
            console.log('✅ Notification count:', count);
            setNotificationCount(count);

            // ✅ Test role utilities
            console.log('✅ Is Admin?', isAdmin(userData));
            console.log('✅ Is Moderator?', isModerator(userData));
            console.log('✅ Has USER role?', hasRole(userData, 'USER'));

        } catch (err) {
            console.error('❌ Error loading user data:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading user data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
                    <h2 className="text-xl font-bold text-red-700 mb-2">❌ Error</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={loadUserData}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🧪 Services Test Page
                    </h1>
                    <p className="text-gray-600">
                        Testing userService and authService functionality
                    </p>
                </div>

                {/* User Profile Card */}
                {user && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            👤 User Profile
                            {isAdmin(user) && (
                                <span className="ml-3 text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full">
                                    👑 ADMIN
                                </span>
                            )}
                            {isModerator(user) && !isAdmin(user) && (
                                <span className="ml-3 text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                    🛡️ MODERATOR
                                </span>
                            )}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-500">User ID</label>
                                <p className="text-lg text-gray-900">{user.userId}</p>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-500">Username</label>
                                <p className="text-lg text-gray-900">{user.username}</p>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-500">Full Name</label>
                                <p className="text-lg text-gray-900">{user.fullName}</p>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-500">Email</label>
                                <p className="text-lg text-gray-900">{user.email}</p>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-500">Role</label>
                                <p className="text-lg text-gray-900">{user.role}</p>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-500">Account Status</label>
                                <p className="text-lg">
                                    {user.isActive ? (
                                        <span className="text-green-600 font-semibold">✅ Active</span>
                                    ) : (
                                        <span className="text-red-600 font-semibold">❌ Inactive</span>
                                    )}
                                </p>
                            </div>

                            {user.createdAt && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-500">Created At</label>
                                    <p className="text-lg text-gray-900">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            )}

                            {user.lastLogin && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-500">Last Login</label>
                                    <p className="text-lg text-gray-900">
                                        {new Date(user.lastLogin).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Notifications Card */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        🔔 Notifications
                    </h2>
                    <div className="flex items-center">
                        <div className="text-4xl font-bold text-blue-600 mr-4">
                            {notificationCount}
                        </div>
                        <div>
                            <p className="text-lg text-gray-700">Unread Notifications</p>
                            <p className="text-sm text-gray-500">
                                {notificationCount === 0
                                    ? "You're all caught up!"
                                    : `You have ${notificationCount} unread notification${notificationCount > 1 ? 's' : ''}`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Role Permissions Card */}
                {user && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            🔐 Role Permissions
                        </h2>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <span className="font-semibold">Has USER role</span>
                                <span className={hasRole(user, 'USER') ? 'text-green-600' : 'text-red-600'}>
                                    {hasRole(user, 'USER') ? '✅ Yes' : '❌ No'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <span className="font-semibold">Has MODERATOR role</span>
                                <span className={hasRole(user, 'MODERATOR') ? 'text-green-600' : 'text-red-600'}>
                                    {hasRole(user, 'MODERATOR') ? '✅ Yes' : '❌ No'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <span className="font-semibold">Has ADMIN role</span>
                                <span className={hasRole(user, 'ADMIN') ? 'text-green-600' : 'text-red-600'}>
                                    {hasRole(user, 'ADMIN') ? '✅ Yes' : '❌ No'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <span className="font-semibold">Is Admin (exact match)</span>
                                <span className={isAdmin(user) ? 'text-green-600' : 'text-red-600'}>
                                    {isAdmin(user) ? '✅ Yes' : '❌ No'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <span className="font-semibold">Is Moderator or higher</span>
                                <span className={isModerator(user) ? 'text-green-600' : 'text-red-600'}>
                                    {isModerator(user) ? '✅ Yes' : '❌ No'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* API Endpoints Status */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        📡 API Endpoints Status
                    </h2>

                    <div className="space-y-2">
                        <div className="flex items-center">
                            <span className="text-green-600 mr-2">✅</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                GET /api/users/me
                            </code>
                            <span className="ml-auto text-gray-600">Working</span>
                        </div>

                        <div className="flex items-center">
                            <span className="text-green-600 mr-2">✅</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                GET /api/users/me/notifications/unread-count
                            </code>
                            <span className="ml-auto text-gray-600">Working</span>
                        </div>

                        <div className="flex items-center">
                            <span className="text-yellow-600 mr-2">⚠️</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                GET /api/users/me/stats
                            </code>
                            <span className="ml-auto text-gray-600">Not Implemented</span>
                        </div>

                        <div className="flex items-center">
                            <span className="text-yellow-600 mr-2">⚠️</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                PUT /api/users/me
                            </code>
                            <span className="ml-auto text-gray-600">Not Implemented</span>
                        </div>
                    </div>
                </div>

                {/* Reload Button */}
                <div className="mt-6 text-center">
                    <button
                        onClick={loadUserData}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold shadow-md"
                    >
                        🔄 Reload Data
                    </button>
                </div>
            </div>
        </div>
    );
}
