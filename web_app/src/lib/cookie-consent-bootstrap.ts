import {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_VERSION,
} from "@/lib/cookie-consent";

export const COOKIE_CONSENT_BOOTSTRAP_SCRIPT = `
(function () {
  var state = {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  };

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(Array.prototype.slice.call(arguments));
  };

  try {
    var raw = window.localStorage.getItem(${JSON.stringify(COOKIE_CONSENT_STORAGE_KEY)});
    var consent = raw ? JSON.parse(raw) : null;
    var valid = consent &&
      consent.version === ${COOKIE_CONSENT_VERSION} &&
      consent.necessary === true &&
      typeof consent.preferences === "boolean" &&
      typeof consent.analytics === "boolean" &&
      typeof consent.marketing === "boolean" &&
      typeof consent.timestamp === "string" &&
      !Number.isNaN(Date.parse(consent.timestamp));

    if (valid) {
      document.documentElement.dataset.readyroadConsent = "stored";
      state.analytics_storage = consent.analytics ? "granted" : "denied";
      state.ad_storage = "denied";
      state.ad_user_data = "denied";
      state.ad_personalization = "denied";
      if (!consent.preferences) window.localStorage.removeItem("readyroad_theme");
    } else {
      document.documentElement.dataset.readyroadConsent = "missing";
      if (raw) window.localStorage.removeItem(${JSON.stringify(COOKIE_CONSENT_STORAGE_KEY)});
      window.localStorage.removeItem("readyroad_theme");
    }
  } catch (_) {
    document.documentElement.dataset.readyroadConsent = "missing";
    try { window.localStorage.removeItem("readyroad_theme"); } catch (_) {}
  }

  window.gtag("consent", "default", state);
})();
`.trim();
