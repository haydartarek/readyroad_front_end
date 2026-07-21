"use client";

import "./globals.css";
import { useState } from "react";
import { LocalizedErrorScreen } from "@/components/ui/localized-error-screen";
import type { Language } from "@/lib/constants";
import { getInitialClientLanguage, translateMessage } from "@/lib/messages";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [language] = useState<Language>(() => getInitialClientLanguage());

  return (
    <html
      lang={language}
      dir={language === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <head>
        <title>{`${translateMessage(language, "common.error_title")} | ReadyRoad`}</title>
        <meta name="robots" content="noindex,nofollow" />
      </head>
      <body>
        <LocalizedErrorScreen reset={reset} fullscreen />
      </body>
    </html>
  );
}
