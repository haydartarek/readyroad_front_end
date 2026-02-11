'use client';

import { useLanguage } from '@/contexts/language-context';

export default function AdminModerationPage() {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('admin.moderation.title')}</h1>
                <p className="text-gray-600 mt-1">{t('admin.moderation.description')}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="text-5xl mb-4">🛡️</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('admin.moderation.coming_soon')}</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">{t('admin.moderation.coming_soon_desc')}</p>
            </div>
        </div>
    );
}
