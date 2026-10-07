"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api";
import type { HomeLessonOverviewItem } from "@/lib/home-lessons-overview";
import { useLanguage } from "@/contexts/language-context";

export function useLessonTheoryOverview(initial: HomeLessonOverviewItem[] = []) {
  const { language } = useLanguage();
  const [overview, setOverview] = useState(initial);
  useEffect(() => {
    const abort = new AbortController();
    let revision = 0;
    const refresh = async () => {
      const current = ++revision;
      try {
        const { data } = await apiClient.get<HomeLessonOverviewItem[]>("/lessons/home-overview",
          { lang: language }, { signal: abort.signal, skipAuthRedirect: true });
        if (!abort.signal.aborted && current === revision) setOverview(data);
      } catch {
        // Keep the last confirmed catalogue when refresh is unavailable.
      }
    };
    void refresh();
    window.addEventListener("focus", refresh);
    return () => { abort.abort(); window.removeEventListener("focus", refresh); };
  }, [language]);
  return overview;
}
