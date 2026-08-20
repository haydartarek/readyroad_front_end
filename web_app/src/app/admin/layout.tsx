"use client";

import { useLocalizedRouter } from "@/hooks/use-localized-router";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import { useLanguage } from "@/contexts/language-context";
import { Menu, RefreshCw, X } from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import { cn } from "@/lib/utils";

/**
 * Admin Layout Component
 *
 * Implements Feature: Redirect non-admin users away from admin routes
 * Scenario: Given I am logged in with role USER
 *           When I visit "/admin/dashboard"
 *           Then I should be redirected to "/unauthorized"
 *
 * Feature: Sidebar follows selected language (EN, NL, FR, AR)
 *          RTL direction applied dynamically for Arabic
 *
 * @author RijVia Team
 * @since 2026-02-04
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useLocalizedRouter();
  const { t, isRTL } = useLanguage();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileNavOpen]);

  // Scenario: Redirect non-admin users away from admin routes
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login?redirect=/admin");
      } else if (user.role !== "ADMIN") {
        router.push("/unauthorized");
      }
    }
  }, [user, isLoading, router]);

  // ── Auth loading ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            {t("admin.sidebar.checking_permissions")}
          </p>
        </div>
      </div>
    );
  }

  // Keep a meaningful status visible while the client-side redirect completes.
  if (!user || user.role !== "ADMIN") {
    return <PageLoading message={t("admin.sidebar.checking_permissions")} />;
  }

  // Scenario: Allow admin users to access admin routes
  return (
    <div
      className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/95 px-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label={t("admin.sidebar.open_navigation")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-card text-foreground shadow-sm"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="min-w-0 break-words text-center text-sm font-black text-foreground">
            {t("admin.sidebar.panel_title")}
          </span>
          <span className="h-10 w-10" aria-hidden="true" />
        </div>

        <main className="w-full min-w-0 px-3 pb-8 pt-4 transition-all duration-300 sm:px-5 lg:px-8 lg:pt-8">
          <div className="mx-auto max-w-7xl min-w-0 space-y-4">
            <AdminBreadcrumb />
            {children}
          </div>
        </main>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={() => setMobileNavOpen(false)}
            aria-label={t("admin.sidebar.close_navigation")}
          />
          <div
            className={cn(
              "absolute inset-y-0 w-72 max-w-[calc(100vw-2rem)] bg-background shadow-2xl",
              isRTL ? "right-0" : "left-0",
            )}
          >
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label={t("admin.sidebar.close_navigation")}
              className={cn(
                "absolute top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background text-foreground shadow-sm",
                isRTL ? "left-3" : "right-3",
              )}
            >
              <X className="h-4 w-4" />
            </button>
            <AdminSidebar variant="drawer" onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
