"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useCookieConsent } from "@/contexts/cookie-consent-context";
import { STORAGE_KEYS } from "@/lib/constants";

export function ConsentThemeController() {
  const { consent, isReady } = useCookieConsent();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    if (!isReady || consent?.preferences) return;

    if (resolvedTheme === "dark") {
      setTheme("light");
    }
    window.requestAnimationFrame(() => {
      try {
        window.localStorage.removeItem(STORAGE_KEYS.THEME);
      } catch {
        // The visual fallback still works when storage is unavailable.
      }
    });
  }, [consent?.preferences, isReady, resolvedTheme, setTheme]);

  return null;
}
