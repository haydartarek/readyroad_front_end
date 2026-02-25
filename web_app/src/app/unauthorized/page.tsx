'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * Unauthorized Access Page
 * 
 * Implements Feature: Redirect non-admin users away from admin routes
 * Scenario: Given I am logged in with role USER
 *           When I visit "/admin/dashboard"
 *           Then I should be redirected to "/unauthorized"
 * 
 * @author ReadyRoad Team
 * @since 2026-02-04
 */
export default function UnauthorizedPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-muted flex items-center justify-center p-4" dir="rtl">
            <div className="max-w-md w-full">
                {/* Icon */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-4">
                        <span className="text-5xl">🚫</span>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        الوصول غير مصرح به
                    </h1>
                    <p className="text-muted-foreground">
                        عذراً، ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة
                    </p>
                </div>

                {/* Error Details */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 text-sm">!</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground mb-1">
                                لماذا حدث هذا؟
                            </h3>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li>• قد لا تملك الدور المطلوب (ADMIN أو MODERATOR)</li>
                                <li>• قد تكون محاولاً الوصول إلى صفحة محظورة</li>
                                <li>• قد تحتاج إلى تسجيل الدخول بحساب مختلف</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={() => router.back()}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium"
                    >
                        <span>←</span>
                        <span>العودة للصفحة السابقة</span>
                    </button>

                    <Link
                        href="/"
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-card text-foreground rounded-lg hover:bg-muted transition-colors font-medium border border-border"
                    >
                        <span>🏠</span>
                        <span>الذهاب للصفحة الرئيسية</span>
                    </Link>

                    <Link
                        href="/auth/logout"
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                    >
                        <span>🚪</span>
                        <span>تسجيل الخروج</span>
                    </Link>
                </div>

                {/* Help Link */}
                <div className="text-center mt-6">
                    <p className="text-sm text-muted-foreground">
                        تحتاج مساعدة؟{' '}
                        <Link href="/contact" className="text-blue-600 hover:underline">
                            تواصل معنا
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
