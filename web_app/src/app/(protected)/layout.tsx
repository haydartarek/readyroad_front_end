"use client";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { UserSidebar } from "@/components/layout/UserSidebar";
import { cn } from "@/lib/utils";
import { useRoutePathname } from "@/hooks/use-route-pathname";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = useRoutePathname();
  const isFocusedExamRoute =
    pathname === "/practice/random" ||
    pathname.startsWith("/practice/random") ||
    pathname === "/exam" ||
    /^\/exam\/\d+$/.test(pathname);
  const isPracticeHubRoute = /(?:^|\/)practice\/?$/.test(pathname);
  const isExamEntryRoute = pathname === "/exam";
  const isLearningHubRoute = isPracticeHubRoute || isExamEntryRoute;

  return (
    <div
      className={cn(
        "flex",
        isLearningHubRoute
          ? "bg-transparent"
          : "bg-gradient-to-br from-background via-muted/10 to-background",
        !pathname.startsWith("/practice/random") && "min-h-screen",
      )}
    >
      <UserSidebar />
      <main
        className={cn(
          "flex-1 min-w-0",
          isLearningHubRoute ? "p-0" : "px-4 pb-8 lg:px-8",
          isLearningHubRoute ? "" : isFocusedExamRoute ? "pt-1 md:pt-2" : "pt-8",
        )}
      >
        {!isFocusedExamRoute && !isPracticeHubRoute ? <Breadcrumb /> : null}
        {children}
      </main>
    </div>
  );
}
