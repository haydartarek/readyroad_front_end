'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

/**
 * Admin Layout Component
 * 
 * Implements Feature: Redirect non-admin users away from admin routes
 * Scenario: Given I am logged in with role USER
 *           When I visit "/admin/dashboard"
 *           Then I should be redirected to "/unauthorized"
 * 
 * @author ReadyRoad Team
 * @since 2026-02-04
 */
export default function AdminLayout({
    children
}: {
    children: React.ReactNode
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    // Scenario: Redirect non-admin users away from admin routes
    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                // Not logged in - redirect to login
                router.push('/auth/login?redirect=/admin');
            } else if (user.role !== 'ADMIN') {
                // Logged in but not admin - redirect to unauthorized
                router.push('/unauthorized');
            }
        }
    }, [user, isLoading, router]);

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
                </div>
            </div>
        );
    }

    // Don't render anything if user is not admin (will be redirected)
    if (!user || user.role !== 'ADMIN') {
        return null;
    }

    // Scenario: Allow admin users to access admin routes
    return (
        <div className="flex min-h-screen bg-gray-50" dir="rtl">
            <AdminSidebar />
            <main className="flex-1 p-8 transition-all duration-300">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
