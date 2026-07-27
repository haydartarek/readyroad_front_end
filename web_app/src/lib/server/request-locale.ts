import "server-only";

import { cookies, headers } from "next/headers";
import { STORAGE_KEYS } from "@/lib/constants";
import { resolveSiteLocale, type SiteLocale } from "@/lib/site-copy";

export async function getRequestLocale(): Promise<SiteLocale> {
  if (typeof headers === "function") {
    const headerStore = await headers();
    const routedLocale = headerStore.get("x-readyroad-locale");
    if (routedLocale) {
      return resolveSiteLocale(routedLocale);
    }
  }

  const cookieStore = await cookies();
  return resolveSiteLocale(
    cookieStore.get(STORAGE_KEYS.LANGUAGE)?.value,
  );
}
