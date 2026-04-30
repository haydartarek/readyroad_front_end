"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import type { Language } from "@/lib/constants";
import { getInitialClientLanguage, translateMessage } from "@/lib/messages";
import { StatusScreen } from "@/components/ui/status-screen";

export function LocalizedErrorScreen({
  reset,
  fullscreen = false,
}: {
  reset: () => void;
  fullscreen?: boolean;
}) {
  const [language] = useState<Language>(() => getInitialClientLanguage());

  return (
    <StatusScreen
      badge={translateMessage(language, "common.error_badge")}
      title={translateMessage(language, "common.error_title")}
      description={translateMessage(language, "common.error_desc")}
      icon={<AlertTriangle className="h-9 w-9" />}
      dir={language === "ar" ? "rtl" : "ltr"}
      fullscreen={fullscreen}
      brandCaption={translateMessage(language, "app.tagline")}
      asideNote={translateMessage(language, "common.status_aside")}
      primaryAction={{
        label: translateMessage(language, "common.retry"),
        onClick: reset,
      }}
      secondaryAction={{
        label: translateMessage(language, "common.go_home"),
        href: "/",
      }}
      footer={
        <a className="font-semibold text-primary hover:underline" href="/contact">
          {translateMessage(language, "common.contact_support")}
        </a>
      }
    />
  );
}
