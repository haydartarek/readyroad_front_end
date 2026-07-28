"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { DEFAULT_LANGUAGE, STORAGE_KEYS } from "@/lib/constants";
import {
  ALL_MESSAGES,
  getInitialClientLanguage,
  isValidLanguage,
  readLanguageFromCookieString,
} from "@/lib/messages";
import {
  getLocaleFromPathname,
  localizePathname,
  resolveRouteLocale,
} from "@/lib/i18n-routing";

// ─── Types ───────────────────────────────────────────────

type Language = "en" | "ar" | "nl" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  applyAccountLanguage: (
    lang: Language | null | undefined,
    navigate?: boolean,
  ) => boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}

// ─── Constants ───────────────────────────────────────────

const STORAGE_KEY = STORAGE_KEYS.LANGUAGE;
const LEGACY_STORAGE_KEY = "readyroad_language";
const STORAGE_EVENT = "readyroad-language-change";
const SESSION_EXPLICIT_LANGUAGE_KEY = "readyroad_explicit_session_language";
const RTL_LANGS = new Set<Language>(["ar"]);

// ─── Helpers ─────────────────────────────────────────────

function readLanguageFromCookie(): Language | null {
  if (typeof document === "undefined") {
    return null;
  }

  return readLanguageFromCookieString(document.cookie);
}

function readStoredLanguage(): Language | null {
  if (typeof window === "undefined") {
    return null;
  }

  const route = getLocaleFromPathname(window.location.pathname);
  if (
    (route.hasLocalePrefix || route.hasEnglishPrefix) &&
    isValidLanguage(route.locale)
  ) {
    return route.locale;
  }

  try {
    const cookieLanguage = readLanguageFromCookie();
    if (cookieLanguage) {
      return resolveRouteLocale(
        window.location.pathname,
        cookieLanguage,
      ) as Language;
    }

    const stored =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem(LEGACY_STORAGE_KEY);
    if (stored && isValidLanguage(stored)) {
      return resolveRouteLocale(window.location.pathname, stored) as Language;
    }

    return null;
  } catch {
    return readLanguageFromCookie(); // SSR / private browsing guard
  }
}

function subscribeToLanguage(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => callback();
  window.addEventListener("storage", handleChange);
  window.addEventListener(STORAGE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(STORAGE_EVENT, handleChange);
  };
}

function getLanguageSnapshot(): Language {
  return readStoredLanguage() ?? getInitialClientLanguage();
}

function persistLanguageLocally(lang: Language, explicit: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    document.cookie = `${STORAGE_KEY}=${lang}; path=/; max-age=31536000; samesite=lax`;
    if (explicit) {
      sessionStorage.setItem(SESSION_EXPLICIT_LANGUAGE_KEY, lang);
    }
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

function persistLanguageForSignedInUser(lang: Language): void {
  if (typeof document === "undefined") return;

  const csrfToken = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("csrf_token="))
    ?.slice("csrf_token=".length);

  if (!csrfToken) return;

  void fetch("/api/proxy/users/me/preferred-language", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify({ preferredLanguage: lang }),
    keepalive: true,
  }).catch(() => {
    // The local choice remains valid if the account request is temporarily unavailable.
  });
}

// ─── Context ─────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

// ─── Provider ────────────────────────────────────────────

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage?: Language;
}) {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    () => initialLanguage ?? (DEFAULT_LANGUAGE as Language),
  );

  const translations = ALL_MESSAGES[language];
  const isRTL = RTL_LANGS.has(language);

  // Sync HTML attributes on language change
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";

    persistLanguageLocally(language, false);
  }, [language, isRTL]);

  const setLanguage = useCallback(
    (lang: Language) => {
      persistLanguageLocally(lang, true);
      persistLanguageForSignedInUser(lang);

      if (typeof window !== "undefined") {
        const targetPathname = localizePathname(
          window.location.pathname,
          lang,
        );
        const target = `${targetPathname}${window.location.search}${window.location.hash}`;
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

        if (target !== current) {
          window.location.assign(target);
          return;
        }

        window.dispatchEvent(new Event(STORAGE_EVENT));
      }
    },
    [],
  );

  const applyAccountLanguage = useCallback(
    (
      preferredLanguage: Language | null | undefined,
      navigate = true,
    ): boolean => {
      if (
        typeof window === "undefined" ||
        !preferredLanguage ||
        !isValidLanguage(preferredLanguage)
      ) {
        return false;
      }

      const routeLocale = getLocaleFromPathname(window.location.pathname);
      if (routeLocale.hasLocalePrefix || routeLocale.hasEnglishPrefix) {
        return false;
      }

      try {
        const explicitSessionLanguage = sessionStorage.getItem(
          SESSION_EXPLICIT_LANGUAGE_KEY,
        );
        if (
          explicitSessionLanguage &&
          isValidLanguage(explicitSessionLanguage)
        ) {
          return false;
        }
      } catch {
        // Continue with the account preference when session storage is unavailable.
      }

      persistLanguageLocally(preferredLanguage, false);
      window.dispatchEvent(new Event(STORAGE_EVENT));

      if (navigate) {
        const targetPathname = localizePathname(
          window.location.pathname,
          preferredLanguage,
        );
        const target = `${targetPathname}${window.location.search}${window.location.hash}`;
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (target !== current) {
          window.location.replace(target);
        }
      }

      return true;
    },
    [],
  );

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let str = translations[key] ?? key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          str = str.replaceAll(`{${k}}`, String(v));
        });
      }
      return str;
    },
    [translations],
  );

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, applyAccountLanguage, t, isRTL }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
}

export function useOptionalLanguage(): Language {
  return (
    useContext(LanguageContext)?.language ?? (DEFAULT_LANGUAGE as Language)
  );
}
