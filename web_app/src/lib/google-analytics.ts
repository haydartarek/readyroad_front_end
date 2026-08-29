import type { CookieConsentRecord } from "@/lib/cookie-consent";
import { URL_LOCALES } from "@/lib/i18n-routing";

export const GOOGLE_ANALYTICS_ID = "G-1P4EJH6D2T";
export const GOOGLE_ANALYTICS_SCRIPT_ID = "rijvia-google-analytics";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  [key: `ga-disable-${string}`]: boolean | undefined;
};

const EXCLUDED_PATH_PREFIXES = [
  "/admin",
  ...URL_LOCALES.map((locale) => `/${locale}/admin`),
];

export function isGoogleAnalyticsExcludedPathname(pathname: string): boolean {
  return EXCLUDED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function synchronizeGoogleAnalytics(
  consent: CookieConsentRecord | null,
  pathname = typeof window === "undefined" ? "/" : window.location.pathname,
): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const analyticsWindow = window as unknown as AnalyticsWindow;
  const disableKey = `ga-disable-${GOOGLE_ANALYTICS_ID}` as const;
  const analyticsEnabled =
    consent?.analytics === true &&
    !isGoogleAnalyticsExcludedPathname(pathname);
  analyticsWindow[disableKey] = !analyticsEnabled;

  if (!analyticsEnabled) return;

  analyticsWindow.dataLayer ??= [];
  analyticsWindow.gtag ??= function () {
    // gtag.js expects pre-load commands to be queued as Arguments objects.
    // eslint-disable-next-line prefer-rest-params
    analyticsWindow.dataLayer?.push(arguments);
  };

  if (document.getElementById(GOOGLE_ANALYTICS_SCRIPT_ID)) return;

  analyticsWindow.gtag("js", new Date());
  analyticsWindow.gtag("config", GOOGLE_ANALYTICS_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const script = document.createElement("script");
  script.id = GOOGLE_ANALYTICS_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
  document.head.appendChild(script);
}
