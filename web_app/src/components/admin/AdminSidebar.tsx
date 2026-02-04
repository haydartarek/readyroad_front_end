'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/**
 * Admin Sidebar Component
 * Navigation for admin panel
 * 
 * @author ReadyRoad Team
 * @since 2026-02-04
 */
export default function AdminSidebar() {
    const pathname = usePathname();
    const { user } = useAuth();

    const menuItems = [
        {
            label: 'لوحة التحكم',
            href: '/admin',
            icon: '📊',
            exact: true
        },
        {
            label: 'اللافتات المرورية',
            href: '/admin/signs',
            icon: '🚦',
            children: [
                { label: 'جميع اللافتات', href: '/admin/signs' },
                { label: 'إضافة لافتة', href: '/admin/signs/new' },
            ]
        },
        {
            label: 'المستخدمون',
            href: '/admin/users',
            icon: '👥'
        },
        {
            label: 'الاختبارات',
            href: '/admin/quizzes',
            icon: '📝'
        },
        {
            label: 'الإحصائيات',
            href: '/admin/analytics',
            icon: '📈'
        },
        {
            label: 'استيراد البيانات',
            href: '/admin/data-import',
            icon: '📥'
        },
        {
            label: 'الإعدادات',
            href: '/admin/settings',
            icon: '⚙️'
        }
    ];

    // Add moderation menu for MODERATOR and ADMIN
    if (user?.role === 'MODERATOR' || user?.role === 'ADMIN') {
        menuItems.push({
            label: 'الإشراف',
            href: '/admin/moderation',
            icon: '🛡️'
        });
    }

    return (
        <aside className="w-64 bg-white border-l border-gray-200 min-h-screen sticky top-0 shadow-sm">
            {/* Logo & Brand */}
            <div className="p-6 border-b border-gray-200">
                <Link href="/admin" className="flex items-center gap-3">
                    <div className="text-3xl">🚗</div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">ReadyRoad</h2>
                        <p className="text-xs text-gray-500">لوحة الإدارة</p>
                    </div>
                </Link>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        {user?.fullName?.[0] || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                            {user?.fullName || 'مدير النظام'}
                        </p>
                        <p className="text-xs text-gray-600">{user?.role}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="p-4">
                <ul className="space-y-2">
                    {menuItems.map((item) => (
                        <MenuItem
                            key={item.href}
                            item={item}
                            pathname={pathname}
                        />
                    ))}
                </ul>
            </nav>

            {/* Bottom Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <span>🏠</span>
                    <span className="text-sm font-medium">العودة للموقع</span>
                </Link>
                <button
                    onClick={() => {
                        // TODO: Implement logout
                        window.location.href = '/auth/logout';
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2"
                >
                    <span>🚪</span>
                    <span className="text-sm font-medium">تسجيل الخروج</span>
                </button>
            </div>
        </aside>
    );
}

/**
 * Menu Item Component
 */
function MenuItem({
    item,
    pathname
}: {
    item: any;
    pathname: string;
}) {
    const isActive = item.exact
        ? pathname === item.href
        : pathname.startsWith(item.href);

    return (
        <li>
            <Link
                href={item.href}
                className={`
          flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
          ${isActive
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
        `}
            >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
            </Link>

            {/* Sub-menu items */}
            {item.children && isActive && (
                <ul className="mr-8 mt-2 space-y-1">
                    {item.children.map((child: any) => (
                        <li key={child.href}>
                            <Link
                                href={child.href}
                                className={`
                  block px-4 py-2 text-sm rounded-lg transition-colors
                  ${pathname === child.href
                                        ? 'text-blue-600 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }
                `}
                            >
                                {child.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}
