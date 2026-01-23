'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LANGUAGES, DEFAULT_LANGUAGE, STORAGE_KEYS } from '@/lib/constants';

type Language = 'en' | 'ar' | 'nl' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE as Language);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const isRTL = language === 'ar';

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as Language;
    if (savedLanguage && LANGUAGES.find(l => l.code === savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  useEffect(() => {
    // Load translations for current language
    loadTranslations(language);
    
    // Update HTML attributes
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [language, isRTL]);

  const loadTranslations = async (lang: Language) => {
    try {
      const messages = await import(`@/messages/${lang}.json`);
      setTranslations(messages.default);
    } catch (error) {
      console.error(`Failed to load translations for ${lang}:`, error);
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  };

  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isRTL,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
