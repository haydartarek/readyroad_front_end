import { getRequestLocale } from "@/lib/server/request-locale";
import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import { StatusScreen } from "@/components/ui/status-screen";
import { translateMessage } from "@/lib/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return {
    title: translateMessage(locale, "common.not_found_title"),
  };
}

export default async function NotFound() {
  const locale = await getRequestLocale();
  const isRTL = locale === "ar";

  return (
    <StatusScreen
      badge={translateMessage(locale, "common.not_found_badge")}
      title={translateMessage(locale, "common.not_found_title")}
      description={translateMessage(locale, "common.not_found_desc")}
      icon={<SearchX className="h-9 w-9" />}
      dir={isRTL ? "rtl" : "ltr"}
      fullscreen={false}
      brandCaption={translateMessage(locale, "app.tagline")}
      asideNote={translateMessage(locale, "common.status_aside")}
      primaryAction={{
        label: translateMessage(locale, "common.go_home"),
        href: "/",
      }}
      secondaryAction={{
        label: translateMessage(locale, "common.contact_support"),
        href: "/contact",
      }}
    />
  );
}
