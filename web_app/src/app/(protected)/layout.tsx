import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/10 to-background">
      <main className="flex-1 container mx-auto px-4 py-8">
        <Breadcrumb />
        {children}
      </main>
    </div>
  );
}
