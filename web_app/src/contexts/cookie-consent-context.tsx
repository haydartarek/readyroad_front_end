"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLanguage } from "@/contexts/language-context";
import { synchronizeGoogleAnalytics } from "@/lib/google-analytics";
import {
  applyGoogleConsentMode,
  clearDisallowedAnalyticsCookies,
  clearDisallowedOptionalStorage,
  COOKIE_CONSENT_CHANGED_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
  createConsentRecord,
  persistConsent,
  readStoredConsent,
  type ConsentSelection,
  type CookieConsentRecord,
} from "@/lib/cookie-consent";

type ConsentDraft = Pick<ConsentSelection, "preferences" | "analytics">;

type CookieConsentContextValue = {
  consent: CookieConsentRecord | null;
  isReady: boolean;
  isSettingsOpen: boolean;
  draft: ConsentDraft;
  announcement: string;
  openSettings: () => void;
  closeSettings: () => void;
  setDraftCategory: (category: keyof ConsentDraft, enabled: boolean) => void;
  acceptAll: () => void;
  rejectOptional: () => void;
  saveDraft: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null,
);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [consent, setConsent] = useState<CookieConsentRecord | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [draft, setDraft] = useState<ConsentDraft>({
    preferences: false,
    analytics: false,
  });

  const synchronizeConsent = useCallback((next: CookieConsentRecord | null) => {
    setConsent(next);
    applyGoogleConsentMode(next);
    synchronizeGoogleAnalytics(next);
    clearDisallowedAnalyticsCookies(next);
    try {
      clearDisallowedOptionalStorage(next, window.localStorage);
    } catch {
      // The consent UI remains usable when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    let stored: CookieConsentRecord | null = null;
    try {
      const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
      stored = readStoredConsent(window.localStorage);
      if (raw && !stored) {
        window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
      }
    } catch {
      stored = null;
    }

    const initializationFrame = window.requestAnimationFrame(() => {
      synchronizeConsent(stored);
      setIsReady(true);
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== COOKIE_CONSENT_STORAGE_KEY) return;
      synchronizeConsent(readStoredConsent(window.localStorage));
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.cancelAnimationFrame(initializationFrame);
      window.removeEventListener("storage", handleStorage);
    };
  }, [synchronizeConsent]);

  const persist = useCallback(
    (selection: Partial<ConsentSelection>) => {
      const next = createConsentRecord(selection);
      try {
        persistConsent(next, window.localStorage);
      } catch {
        // Keep the in-memory decision for privacy-restricted browsers.
      }
      synchronizeConsent(next);
      window.dispatchEvent(
        new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: next }),
      );
      setAnnouncement(t("consent.saved"));
      setIsSettingsOpen(false);
    },
    [synchronizeConsent, t],
  );

  const openSettings = useCallback(() => {
    setDraft({
      preferences: consent?.preferences ?? false,
      analytics: consent?.analytics ?? false,
    });
    setAnnouncement("");
    setIsSettingsOpen(true);
  }, [consent]);

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      isReady,
      isSettingsOpen,
      draft,
      announcement,
      openSettings,
      closeSettings: () => setIsSettingsOpen(false),
      setDraftCategory: (category, enabled) =>
        setDraft((current) => ({ ...current, [category]: enabled })),
      acceptAll: () => persist({ preferences: true, analytics: true }),
      rejectOptional: () => persist({ preferences: false, analytics: false }),
      saveDraft: () => persist(draft),
    }),
    [announcement, consent, draft, isReady, isSettingsOpen, openSettings, persist],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used inside CookieConsentProvider");
  }
  return context;
}
