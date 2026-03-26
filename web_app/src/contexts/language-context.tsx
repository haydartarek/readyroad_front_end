"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/constants";
import enMessages from "@/messages/en.json";
import arMessages from "@/messages/ar.json";
import frMessages from "@/messages/fr.json";
import nlMessages from "@/messages/nl.json";

// ─── Types ───────────────────────────────────────────────

type Language = "en" | "ar" | "nl" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}

// ─── Constants ───────────────────────────────────────────

const STORAGE_KEY = "readyroad_locale";
const STORAGE_EVENT = "readyroad-language-change";
const RTL_LANGS = new Set<Language>(["ar"]);

const ALL_MESSAGES: Record<Language, Record<string, string>> = {
  en: enMessages as unknown as Record<string, string>,
  ar: arMessages as unknown as Record<string, string>,
  fr: frMessages as unknown as Record<string, string>,
  nl: nlMessages as unknown as Record<string, string>,
};

// ─── Helpers ─────────────────────────────────────────────

function isValidLanguage(lang: string): lang is Language {
  return LANGUAGES.some((l) => l.code === lang);
}

function readStoredLanguage(): Language | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && isValidLanguage(stored) ? stored : null;
  } catch {
    return null; // SSR / private browsing guard
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
  return readStoredLanguage() ?? (DEFAULT_LANGUAGE as Language);
}

// ─── Context ─────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

// ─── Provider ────────────────────────────────────────────

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    () => DEFAULT_LANGUAGE as Language,
  );

  const translations = ALL_MESSAGES[language];
  const isRTL = RTL_LANGS.has(language);

  // Sync HTML attributes on language change
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
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
