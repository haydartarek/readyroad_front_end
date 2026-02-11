import Link from "next/link";

type Props = {
    title: string;
    description?: string;
};

export default function AdminPlaceholder({ title, description }: Props) {
    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-10">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">{title}</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {description ?? "هذه الصفحة قيد التطوير حالياً. تم إنشاء Placeholder لإزالة 404."}
                        </p>
                    </div>

                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        Coming soon
                    </span>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                        href="/admin"
                        className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                        العودة للوحة التحكم
                    </Link>

                    <Link
                        href="/"
                        className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted/30"
                    >
                        العودة للموقع
                    </Link>
                </div>
            </div>
        </div>
    );
}
