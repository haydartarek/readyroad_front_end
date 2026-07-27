import type { Metadata } from "next";
import {
  buildLanguageAlternates,
  buildLocalizedUrl,
} from "@/lib/i18n-routing";
import type { SiteLocale } from "@/lib/site-copy";

export function getLocalizedAlternates(
  pathname: string,
  locale: SiteLocale,
  appUrl: string,
): NonNullable<Metadata["alternates"]> {
  return {
    canonical: buildLocalizedUrl(pathname, locale, appUrl),
    languages: buildLanguageAlternates(pathname, appUrl),
  };
}
