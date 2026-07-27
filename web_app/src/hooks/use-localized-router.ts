"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useOptionalLanguage } from "@/contexts/language-context";
import { localizeHref } from "@/lib/i18n-routing";

export function useLocalizedRouter() {
  const router = useRouter();
  const language = useOptionalLanguage();

  return useMemo(
    () => ({
      ...router,
      push: (
        href: string,
        options?: Parameters<typeof router.push>[1],
      ) => router.push(localizeHref(href, language), options),
      replace: (
        href: string,
        options?: Parameters<typeof router.replace>[1],
      ) => router.replace(localizeHref(href, language), options),
    }),
    [language, router],
  );
}
