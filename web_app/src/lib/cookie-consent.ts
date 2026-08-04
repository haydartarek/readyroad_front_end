export const COOKIE_CONSENT_STORAGE_KEY = "readyroad_cookie_consent";
export const COOKIE_CONSENT_VERSION = 2;
export const COOKIE_CONSENT_CHANGED_EVENT = "readyroad:consent-changed";
export const MARKETING_SERVICES_AVAILABLE = false;

export type ConsentSelection = {
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
};

export type CookieConsentRecord = ConsentSelection & {
  version: number;
  timestamp: string;
  necessary: true;
};

export type GoogleConsentState = {
  analytics_storage: "granted" | "denied";
  ad_storage: "granted" | "denied";
  ad_user_data: "granted" | "denied";
  ad_personalization: "granted" | "denied";
};

type ConsentWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

const OPTIONAL_STORAGE_KEYS = ["readyroad_theme"] as const;
const GOOGLE_ANALYTICS_COOKIE_PATTERN = /^_(?:ga(?:_.+)?|gid|gat(?:_.+)?)$/;

export function createConsentRecord(
  selection: Partial<ConsentSelection> = {},
  timestamp = new Date().toISOString(),
): CookieConsentRecord {
  return {
    version: COOKIE_CONSENT_VERSION,
    timestamp,
    necessary: true,
    preferences: selection.preferences === true,
    analytics: selection.analytics === true,
    marketing:
      MARKETING_SERVICES_AVAILABLE && selection.marketing === true,
  };
}
export function parseConsentRecord(value: string | null): CookieConsentRecord | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<CookieConsentRecord>;
    if (
      parsed.version !== COOKIE_CONSENT_VERSION ||
      parsed.necessary !== true ||
      typeof parsed.preferences !== "boolean" ||
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.marketing !== "boolean" ||
      typeof parsed.timestamp !== "string" ||
      Number.isNaN(Date.parse(parsed.timestamp))
    ) {
      return null;
    }

    return createConsentRecord(parsed, parsed.timestamp);
  } catch {
    return null;
  }
}

export function readStoredConsent(storage: Storage): CookieConsentRecord | null {
  try {
    return parseConsentRecord(storage.getItem(COOKIE_CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function persistConsent(
  record: CookieConsentRecord,
  storage: Storage,
): void {
  storage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(record));
}

export function getGoogleConsentState(
  consent: CookieConsentRecord | null,
): GoogleConsentState {
  return {
    analytics_storage: consent?.analytics ? "granted" : "denied",
    ad_storage: consent?.marketing ? "granted" : "denied",
    ad_user_data: consent?.marketing ? "granted" : "denied",
    ad_personalization: consent?.marketing ? "granted" : "denied",
  };
}

export function applyGoogleConsentMode(
  consent: CookieConsentRecord | null,
  mode: "default" | "update" = "update",
): void {
  if (typeof window === "undefined") return;

  const consentWindow = window as ConsentWindow;
  consentWindow.dataLayer ??= [];
  consentWindow.gtag ??= (...args: unknown[]) => {
    consentWindow.dataLayer?.push(args);
  };
  consentWindow.gtag("consent", mode, getGoogleConsentState(consent));
}

export function clearDisallowedOptionalStorage(
  consent: CookieConsentRecord | null,
  storage: Storage,
): void {
  if (consent?.preferences) return;

  for (const key of OPTIONAL_STORAGE_KEYS) {
    storage.removeItem(key);
  }
}

export function clearDisallowedAnalyticsCookies(
  consent: CookieConsentRecord | null,
): void {
  if (
    consent?.analytics ||
    typeof document === "undefined" ||
    typeof window === "undefined"
  ) {
    return;
  }

  const cookieNames = document.cookie
    .split(";")
    .map((cookie) => cookie.split("=", 1)[0]?.trim())
    .filter(
      (name): name is string =>
        Boolean(name) && GOOGLE_ANALYTICS_COOKIE_PATTERN.test(name),
    );

  const hostname = window.location.hostname;
  const domainCandidates = new Set<string>();
  if (hostname && hostname !== "localhost" && !/^\d+(?:\.\d+){3}$/.test(hostname)) {
    domainCandidates.add(hostname);
    const labels = hostname.split(".");
    if (labels.length >= 2) {
      domainCandidates.add(`.${labels.slice(-2).join(".")}`);
    }
  }

  for (const name of cookieNames) {
    const expired = `${name}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax`;
    document.cookie = expired;
    for (const domain of domainCandidates) {
      document.cookie = `${expired}; Domain=${domain}; Secure`;
    }
  }
}
