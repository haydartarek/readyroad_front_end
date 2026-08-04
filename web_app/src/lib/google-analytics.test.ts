import { createConsentRecord } from "@/lib/cookie-consent";
import {
  GOOGLE_ANALYTICS_ID,
  GOOGLE_ANALYTICS_SCRIPT_ID,
  synchronizeGoogleAnalytics,
} from "@/lib/google-analytics";

type AnalyticsTestWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  [key: `ga-disable-${string}`]: boolean | undefined;
};

const analyticsWindow = window as unknown as AnalyticsTestWindow;

describe("Google Analytics consent synchronization", () => {
  beforeEach(() => {
    document.getElementById(GOOGLE_ANALYTICS_SCRIPT_ID)?.remove();
    delete analyticsWindow.dataLayer;
    delete analyticsWindow.gtag;
    delete analyticsWindow[`ga-disable-${GOOGLE_ANALYTICS_ID}`];
  });

  test("does not load Analytics without analytics consent", () => {
    synchronizeGoogleAnalytics(null);
    synchronizeGoogleAnalytics(createConsentRecord({ analytics: false }));

    expect(document.getElementById(GOOGLE_ANALYTICS_SCRIPT_ID)).toBeNull();
    expect(
      analyticsWindow[`ga-disable-${GOOGLE_ANALYTICS_ID}`],
    ).toBe(true);
  });

  test("loads the GA4 property once after analytics consent", () => {
    const granted = createConsentRecord({ analytics: true });
    synchronizeGoogleAnalytics(granted);
    synchronizeGoogleAnalytics(granted);

    expect(
      document.querySelectorAll(`#${GOOGLE_ANALYTICS_SCRIPT_ID}`),
    ).toHaveLength(1);
    expect(document.getElementById(GOOGLE_ANALYTICS_SCRIPT_ID)).toHaveAttribute(
      "src",
      `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`,
    );
    expect(
      analyticsWindow.dataLayer,
    ).toContainEqual([
      "config",
      GOOGLE_ANALYTICS_ID,
      {
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      },
    ]);
  });

  test("disables further collection after consent is withdrawn", () => {
    synchronizeGoogleAnalytics(createConsentRecord({ analytics: true }));
    synchronizeGoogleAnalytics(createConsentRecord({ analytics: false }));

    expect(
      analyticsWindow[`ga-disable-${GOOGLE_ANALYTICS_ID}`],
    ).toBe(true);
  });
});
