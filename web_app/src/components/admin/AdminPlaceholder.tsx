'use client';

import Link from "next/link";
import { useLanguage } from '@/contexts/language-context';

type Props = {
    title: string;
    description?: string;
};

export default function AdminPlaceholder({ title, description }: Props) {
    const { t } = useLanguage();

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-10">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">{title}</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {description ?? t('admin.lessons.coming_soon_desc')}
                        </p>
                    </div>

                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        {t('admin.lessons.coming_soon')}
                    </span>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                        href="/admin/dashboard"
                        className="inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
                    >
                        {t('admin.sidebar.dashboard')}
                    </Link>

                    <Link
                        href="/"
                        className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted/30"
                    >
                        {t('admin.sidebar.back_to_site')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
