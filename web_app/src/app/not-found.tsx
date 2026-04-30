import { SearchX } from "lucide-react";
import { cookies } from "next/headers";
import { StatusScreen } from "@/components/ui/status-screen";
import { STORAGE_KEYS } from "@/lib/constants";
import { translateMessage } from "@/lib/messages";
import { resolveSiteLocale } from "@/lib/site-copy";

export default async function NotFound() {
  const cookieStore = await cookies();
  const locale = resolveSiteLocale(cookieStore.get(STORAGE_KEYS.LANGUAGE)?.value);
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
