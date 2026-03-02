'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import { useLanguage } from '@/contexts/language-context';
import { RefreshCw } from 'lucide-react';

/**
 * Admin Layout Component
 *
 * Implements Feature: Redirect non-admin users away from admin routes
 * Scenario: Given I am logged in with role USER
 *           When I visit "/admin/dashboard"
 *           Then I should be redirected to "/unauthorized"
 *
 * Feature: Sidebar follows selected language (EN, NL, FR, AR)
 *          RTL direction applied dynamically for Arabic
 *
 * @author ReadyRoad Team
 * @since 2026-02-04
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router              = useRouter();
  const { t, isRTL }        = useLanguage();

  // Scenario: Redirect non-admin users away from admin routes
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/login?redirect=/admin');
      } else if (user.role !== 'ADMIN') {
        router.push('/unauthorized');
      }
    }
  }, [user, isLoading, router]);

  // ── Auth loading ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            {t('admin.sidebar.checking_permissions')}
          </p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not admin (will be redirected)
  if (!user || user.role !== 'ADMIN') return null;

  // Scenario: Allow admin users to access admin routes
  return (
    <div
      className="flex min-h-screen bg-muted"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-8 transition-all duration-300 min-w-0">
        <div className="max-w-7xl mx-auto space-y-4">
          <AdminBreadcrumb />
          {children}
        </div>
      </main>
    </div>
  );
}
