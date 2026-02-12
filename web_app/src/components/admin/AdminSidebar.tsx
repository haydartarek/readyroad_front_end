'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/language-context';

/**
 * Admin Sidebar Component
 * Fully multilingual navigation for admin panel
 * Supports EN, AR, NL, FR with RTL for Arabic
 *
 * @author ReadyRoad Team
 * @since 2026-02-04
 */
export default function AdminSidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const { t, isRTL } = useLanguage();

    const menuItems = [
        {
            labelKey: 'admin.sidebar.dashboard',
            href: '/admin',
            icon: '📊',
            exact: true
        },
        {
            labelKey: 'admin.sidebar.signs',
            href: '/admin/signs',
            icon: '🚦',
            children: [
                { labelKey: 'admin.sidebar.signs_all', href: '/admin/signs' },
                { labelKey: 'admin.sidebar.signs_add', href: '/admin/signs/new' },
            ]
        },
        {
            labelKey: 'admin.sidebar.users',
            href: '/admin/users',
            icon: '👥'
        },
        {
            labelKey: 'admin.sidebar.quizzes',
            href: '/admin/quizzes',
            icon: '📝'
        },
        {
            labelKey: 'admin.sidebar.analytics',
            href: '/admin/analytics',
            icon: '📈'
        },
        {
            labelKey: 'admin.sidebar.data_import',
            href: '/admin/data-import',
            icon: '📥'
        },
        {
            labelKey: 'admin.sidebar.settings',
            href: '/admin/settings',
            icon: '⚙️'
        }
    ];

    // Add moderation menu for MODERATOR and ADMIN
    if (user?.role === 'MODERATOR' || user?.role === 'ADMIN') {
        menuItems.push({
            labelKey: 'admin.sidebar.moderation',
            href: '/admin/moderation',
            icon: '🛡️'
        });
    }

    return (
        <aside className={`w-64 bg-white min-h-screen sticky top-0 shadow-sm ${isRTL ? 'border-l border-gray-200' : 'border-r border-gray-200'}`}>
            {/* Logo & Brand */}
            <div className="p-6 border-b border-gray-200">
                <Link href="/admin" className="flex items-center gap-3">
                    <div className="text-3xl">🚗</div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">ReadyRoad</h2>
                        <p className="text-xs text-gray-500">{t('admin.sidebar.panel_title')}</p>
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
                            {user?.fullName || t('admin.system_admin')}
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
                            t={t}
                            isRTL={isRTL}
                        />
                    ))}
                </ul>
            </nav>

            {/* Bottom Actions */}
            <div className={`absolute bottom-0 ${isRTL ? 'left-0 right-0' : 'left-0 right-0'} p-4 border-t border-gray-200 bg-white`}>
                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <span>🏠</span>
                    <span className="text-sm font-medium">{t('admin.sidebar.back_to_site')}</span>
                </Link>
                <button
                    onClick={() => {
                        window.location.href = '/auth/logout';
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2"
                >
                    <span>🚪</span>
                    <span className="text-sm font-medium">{t('auth.logout')}</span>
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
    pathname,
    t,
    isRTL
}: {
    item: any;
    pathname: string;
    t: (key: string) => string;
    isRTL: boolean;
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
                <span className="text-sm">{t(item.labelKey)}</span>
            </Link>

            {/* Sub-menu items */}
            {item.children && isActive && (
                <ul className={`mt-2 space-y-1 ${isRTL ? 'mr-8' : 'ml-8'}`}>
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
                                {t(child.labelKey)}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}
