'use client';

import { useLanguage } from '@/contexts/language-context';

/**
 * Admin Lessons — Create (Scaffold)
 * Hidden from sidebar via featureFlag: 'admin_lessons'
 */
export default function AdminLessonsNewPage() {
    const { t } = useLanguage();

    return (
        <div className="mx-auto w-full max-w-5xl">
            <div className="rounded-2xl border bg-white p-8 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            {t('admin.lessons.title')}
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            {t('admin.lessons.description')}
                        </p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        {t('admin.lessons.coming_soon')}
                    </span>
                </div>
                <div className="mt-8 text-center py-12 text-gray-400">
                    <div className="text-5xl mb-4">📚</div>
                    <p className="text-lg font-medium text-gray-500">
                        {t('admin.lessons.coming_soon_desc')}
                    </p>
                </div>
            </div>
        </div>
    );
}
