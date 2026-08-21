"use client";

import { useEffect, useState } from "react";
import Link from "@/components/localized-link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";

// ─── Constants ─────────────────────────────────────────────────────

const SCROLL_THRESHOLD = 600;

// ─── Component ─────────────────────────────────────────────────────

export function StickyCTA() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    const cta = document.querySelector<HTMLElement>("#exam-cta");
    const footer = document.querySelector<HTMLElement>("footer");
    if (!cta || !footer) return;

    const ctaTop = cta.offsetTop;
    const footerTop = footer.offsetTop;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;

      // Show after threshold
      const shouldBeVisible = scrollY > SCROLL_THRESHOLD;

      // Hide when CTA or footer is in view
      const ctaInView = scrollY + viewportHeight >= ctaTop + 100;
      const footerInView = scrollY + viewportHeight >= footerTop + 100;

      setShouldHide(ctaInView || footerInView);
      setVisible(shouldBeVisible);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Restore session dismissal
  useEffect(() => {
    const key = "readyroad_sticky_cta_dismissed";
    const saved = sessionStorage.getItem(key);
    if (saved === "1") setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("readyroad_sticky_cta_dismissed", "1");
  };

  if (dismissed || isLoading || !visible || shouldHide || isAuthenticated) {
    return null;
  }

  return (
    <div
      role="complementary"
      aria-label={t("home.sticky.quick_action_label")}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 shadow-lg backdrop-blur-md"
    >
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <p className="hidden text-sm font-medium text-secondary sm:block">
          {t("home.sticky.tagline")}
        </p>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="rounded-full px-6 text-sm font-black shadow-md transition-all hover:shadow-lg"
            asChild
          >
            <Link href="/practice">{t("home.sticky.cta_text")}</Link>
          </Button>

          <button
            onClick={handleDismiss}
            aria-label={t("home.sticky.dismiss_label")}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
