import type { SiteLocale } from "@/lib/site-copy";

const DATE_LOCALES: Record<SiteLocale, string> = {
  en: "en-BE-u-ca-gregory",
  nl: "nl-BE-u-ca-gregory",
  fr: "fr-BE-u-ca-gregory",
  ar: "ar-BE-u-ca-gregory",
};

export function formatArticleDate(value: string, locale: SiteLocale): string {
  return new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    calendar: "gregory",
  }).format(new Date(value));
}

export function articleParagraphs(body: string): string[] {
  return body
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
