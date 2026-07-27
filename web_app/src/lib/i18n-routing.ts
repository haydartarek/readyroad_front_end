import type { SiteLocale } from "@/lib/site-copy";

export const URL_LOCALES = ["nl", "fr", "ar"] as const;
export const SITE_LOCALES = ["en", ...URL_LOCALES] as const;

const HREFLANG_BY_LOCALE: Record<SiteLocale, string> = {
  en: "en",
  nl: "nl-BE",
  fr: "fr-BE",
  ar: "ar",
};

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withLeadingSlash.replace(/\/{2,}/g, "/").replace(/\/+$/, "") || "/";
}

export function getLocaleFromPathname(pathname: string): {
  locale: SiteLocale;
  pathname: string;
  hasLocalePrefix: boolean;
  hasEnglishPrefix: boolean;
} {
  const normalized = normalizePathname(pathname);
  const segments = normalized.split("/");
  const firstSegment = segments[1];
  const hasEnglishPrefix = firstSegment === "en";
  const hasLocalePrefix = URL_LOCALES.includes(
    firstSegment as (typeof URL_LOCALES)[number],
  );

  if (!hasLocalePrefix && !hasEnglishPrefix) {
    return {
      locale: "en",
      pathname: normalized,
      hasLocalePrefix: false,
      hasEnglishPrefix: false,
    };
  }

  return {
    locale: hasEnglishPrefix ? "en" : (firstSegment as SiteLocale),
    pathname: normalizePathname(`/${segments.slice(2).join("/")}`),
    hasLocalePrefix,
    hasEnglishPrefix,
  };
}

export function localizePathname(
  pathname: string,
  locale: SiteLocale,
): string {
  const { pathname: unprefixedPathname } = getLocaleFromPathname(pathname);
  if (locale === "en") return unprefixedPathname;
  return unprefixedPathname === "/"
    ? `/${locale}`
    : `/${locale}${unprefixedPathname}`;
}

export function localizeHref(href: string, locale: SiteLocale): string {
  if (
    !href.startsWith("/") ||
    href.startsWith("//") ||
    href.startsWith("/api/") ||
    href.startsWith("/_next/")
  ) {
    return href;
  }

  const hashIndex = href.indexOf("#");
  const queryIndex = href.indexOf("?");
  const suffixIndex =
    hashIndex === -1
      ? queryIndex
      : queryIndex === -1
        ? hashIndex
        : Math.min(hashIndex, queryIndex);
  const pathname = suffixIndex === -1 ? href : href.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : href.slice(suffixIndex);

  return `${localizePathname(pathname, locale)}${suffix}`;
}

export function buildLocalizedUrl(
  pathname: string,
  locale: SiteLocale,
  appUrl: string,
): string {
  const base = appUrl.replace(/\/+$/, "");
  return `${base}${localizePathname(pathname, locale) === "/" ? "" : localizePathname(pathname, locale)}`;
}

export function buildLanguageAlternates(
  pathname: string,
  appUrl: string,
): Record<string, string> {
  const alternatives = Object.fromEntries(
    SITE_LOCALES.map((locale) => [
      HREFLANG_BY_LOCALE[locale],
      buildLocalizedUrl(pathname, locale, appUrl),
    ]),
  );

  return {
    ...alternatives,
    "x-default": buildLocalizedUrl(pathname, "en", appUrl),
  };
}
