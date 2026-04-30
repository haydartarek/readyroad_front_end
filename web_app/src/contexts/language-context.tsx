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

// ─── Types ───────────────────────────────────────────────

type Language = "en" | "ar" | "nl" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}

// ─── Constants ───────────────────────────────────────────

const STORAGE_KEY = STORAGE_KEYS.LANGUAGE;
const LEGACY_STORAGE_KEY = "readyroad_language";
const STORAGE_EVENT = "readyroad-language-change";
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
  try {
    const stored =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem(LEGACY_STORAGE_KEY);
    if (stored && isValidLanguage(stored)) {
      return stored;
    }

    return readLanguageFromCookie();
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

    try {
      localStorage.setItem(STORAGE_KEY, language);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      document.cookie = `${STORAGE_KEY}=${language}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // Ignore storage failures in restricted browser contexts.
    }
  }, [language, isRTL]);

  const setLanguage = useCallback(
    (lang: Language) => {
      if (lang === language) return;
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        // Private browsing / storage quota — silently ignore
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(STORAGE_EVENT));
      }
    },
    [language],
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
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
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
