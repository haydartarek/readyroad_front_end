"use client";

import { usePathname } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { UserSidebar } from "@/components/layout/UserSidebar";
import { cn } from "@/lib/utils";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFocusedExamRoute =
    pathname === "/practice/random" ||
    pathname.startsWith("/practice/random") ||
    pathname === "/exam" ||
    /^\/exam\/\d+$/.test(pathname);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <UserSidebar />
      <main
        className={cn(
          "flex-1 min-w-0 px-4 pb-8 lg:px-8",
          isFocusedExamRoute ? "pt-1 md:pt-2" : "pt-8",
        )}
      >
        {!isFocusedExamRoute ? <Breadcrumb /> : null}
        {children}
      </main>
    </div>
  );
}
