import { Breadcrumb } from "@/components/ui/breadcrumb";
import { UserSidebar } from "@/components/layout/UserSidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <UserSidebar />
      <main className="flex-1 min-w-0 px-4 py-8 lg:px-8">
        <Breadcrumb />
        {children}
      </main>
    </div>
  );
}
