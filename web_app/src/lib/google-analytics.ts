import type { CookieConsentRecord } from "@/lib/cookie-consent";

export const GOOGLE_ANALYTICS_ID = "G-1P4EJH6D2T";
export const GOOGLE_ANALYTICS_SCRIPT_ID = "rijvia-google-analytics";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  [key: `ga-disable-${string}`]: boolean | undefined;
};

export function synchronizeGoogleAnalytics(
  consent: CookieConsentRecord | null,
): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const analyticsWindow = window as unknown as AnalyticsWindow;
  const disableKey = `ga-disable-${GOOGLE_ANALYTICS_ID}` as const;
  const analyticsEnabled = consent?.analytics === true;
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
