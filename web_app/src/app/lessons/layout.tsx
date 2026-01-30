import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function LessonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <div className="container mx-auto px-4 pt-4">
          <Breadcrumb />
        </div>
        {children}
      </main>
    </div>
  );
}
