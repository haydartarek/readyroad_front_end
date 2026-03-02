'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { LANGUAGES, DEFAULT_LANGUAGE } from '@/lib/constants';

// ─── Types ───────────────────────────────────────────────

type Language = 'en' | 'ar' | 'nl' | 'fr';

interface LanguageContextType {
  language:    Language;
  setLanguage: (lang: Language) => void;
  t:           (key: string) => string;
  isRTL:       boolean;
}

// ─── Constants ───────────────────────────────────────────

const STORAGE_KEY = 'readyroad_locale';
const RTL_LANGS   = new Set<Language>(['ar']);

// ─── Helpers ─────────────────────────────────────────────

function isValidLanguage(lang: string): lang is Language {
  return LANGUAGES.some(l => l.code === lang);
}

function readStoredLanguage(): Language | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && isValidLanguage(stored) ? stored : null;
  } catch {
    return null; // SSR / private browsing guard
  }
}

// ─── Context ─────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language,     setLanguageState] = useState<Language>(DEFAULT_LANGUAGE as Language);
  const [translations, setTranslations]  = useState<Record<string, string>>({});

  const isRTL = RTL_LANGS.has(language);

  // On mount: restore persisted language
  useEffect(() => {
    const stored = readStoredLanguage();
    if (stored) setLanguageState(stored);
  }, []);

  const loadTranslations = useCallback(async (lang: Language) => {
    try {
      const messages = await import(`@/messages/${lang}.json`);
      setTranslations(messages.default);
    } catch (error) {
      console.error(`[LanguageProvider] Failed to load translations for "${lang}":`, error);
    }
  }, []);

  // Sync translations + HTML attributes on language change
  useEffect(() => {
    loadTranslations(language);
    document.documentElement.lang = language;
    document.documentElement.dir  = isRTL ? 'rtl' : 'ltr';
  }, [language, isRTL, loadTranslations]);

  const setLanguage = useCallback((lang: Language) => {
    if (lang === language) return;
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Private browsing / storage quota — silently ignore
    }
  }, [language]);

  const t = useCallback((key: string): string => {
    return translations[key] ?? key;
  }, [translations]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}
