'use client';

import useSWR from 'swr';
import { useAuth } from '@/hooks/useAuth';

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
 * Admin Dashboard Page
 * 
 * Implements Features:
 * - Scenario: Allow admin users to access admin routes
 * - Scenario: Admin dashboard loads stats from backend
 * - Then I should see "Admin Dashboard"
 * - And I should see "totalUsers", "totalSigns", "totalQuizzes"
 * 
 * @author ReadyRoad Team
 * @since 2026-02-04
 */
export default function AdminDashboard() {
    const { user } = useAuth();

    // Scenario: Admin dashboard loads stats from backend
    // GET /api/admin/dashboard
    const { data, error, isLoading } = useSWR<DashboardStats>(
        '/api/admin/dashboard'
    );

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-red-800 font-semibold mb-2">خطأ في تحميل البيانات</h3>
                <p className="text-red-600">{error.message || 'حدث خطأ غير متوقع'}</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-6 rounded-lg shadow-sm border h-32 animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        لوحة التحكم
                    </h1>
                    <p className="text-gray-600 mt-2">
                        مرحباً {user?.fullName || 'مدير النظام'}
                    </p>
                </div>
                <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold">
                    👑 {user?.role}
                </div>
            </div>

            {/* Stats Cards - Scenario: UI should render stats cards using returned values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="عدد المستخدمين"
                    value={data?.totalUsers ?? 0}
                    icon="👥"
                    color="blue"
                    description="إجمالي المستخدمين المسجلين"
                />
                <StatCard
                    title="عدد اللافتات المرورية"
                    value={data?.totalSigns ?? 0}
                    icon="🚦"
                    color="green"
                    description="لافتات متاحة في النظام"
                />
                <StatCard
                    title="عدد الاختبارات"
                    value={data?.totalQuizzes ?? 0}
                    icon="📝"
                    color="purple"
                    description="اختبارات تم إنشاؤها"
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">إجراءات سريعة</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QuickActionButton
                        icon="➕"
                        label="إضافة لافتة"
                        href="/admin/signs/new"
                    />
                    <QuickActionButton
                        icon="👥"
                        label="إدارة المستخدمين"
                        href="/admin/users"
                    />
                    <QuickActionButton
                        icon="📊"
                        label="الإحصائيات"
                        href="/admin/analytics"
                    />
                    <QuickActionButton
                        icon="⚙️"
                        label="الإعدادات"
                        href="/admin/settings"
                    />
                </div>
            </div>
        </div>
    );
}

/**
 * Stat Card Component
 * Displays a single statistic with icon and color theme
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
        <div className={`bg-white p-6 rounded-lg shadow-sm border ${colors.border} hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`text-4xl p-3 rounded-full ${colors.bg}`}>
                    {icon}
                </div>
                <div className="text-left">
                    <p className={`text-3xl font-bold ${colors.text}`}>
                        {value.toLocaleString('ar-SA')}
                    </p>
                </div>
            </div>
            <div>
                <h3 className="text-gray-900 font-semibold mb-1">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
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
            className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
        >
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{icon}</span>
            <span className="text-sm font-medium text-gray-700">{label}</span>
        </a>
    );
}
