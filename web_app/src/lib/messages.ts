import { DEFAULT_LANGUAGE, LANGUAGES, STORAGE_KEYS, type Language } from "@/lib/constants";
import arMessages from "@/messages/ar.json";
import enMessages from "@/messages/en.json";
import frMessages from "@/messages/fr.json";
import nlMessages from "@/messages/nl.json";

export type MessageDictionary = Record<string, string>;

export const ALL_MESSAGES: Record<Language, MessageDictionary> = {
  en: enMessages as unknown as MessageDictionary,
  ar: arMessages as unknown as MessageDictionary,
  fr: frMessages as unknown as MessageDictionary,
  nl: nlMessages as unknown as MessageDictionary,
};

const LEGACY_LANGUAGE_STORAGE_KEY = "readyroad_language";

export function isValidLanguage(language: string | null | undefined): language is Language {
  return !!language && LANGUAGES.some((entry) => entry.code === language);
}

export function resolveMessageLanguage(language?: string | null): Language {
  return isValidLanguage(language) ? language : (DEFAULT_LANGUAGE as Language);
}

export function readLanguageFromCookieString(cookieValue?: string | null): Language | null {
  if (!cookieValue) {
    return null;
  }

  const match = cookieValue.match(
    new RegExp(`(?:^|;\\s*)${STORAGE_KEYS.LANGUAGE}=([^;]+)`),
  );
  const language = match?.[1];
  return isValidLanguage(language) ? language : null;
}

export function getInitialClientLanguage(): Language {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE as Language;
  }

  try {
    const stored =
      window.localStorage.getItem(STORAGE_KEYS.LANGUAGE) ??
      window.localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);

    if (isValidLanguage(stored)) {
      return stored;
    }
  } catch {
    // Ignore storage failures and continue to document fallbacks.
  }

  const documentLanguage =
    typeof document !== "undefined"
      ? resolveMessageLanguage(document.documentElement.lang || null)
      : null;

  if (documentLanguage && isValidLanguage(documentLanguage)) {
    return documentLanguage;
  }

  if (typeof document !== "undefined") {
    const cookieLanguage = readLanguageFromCookieString(document.cookie);
    if (cookieLanguage) {
      return cookieLanguage;
    }
  }

  return DEFAULT_LANGUAGE as Language;
}

export function translateMessage(
  language: Language,
  key: string,
  params?: Record<string, string | number>,
): string {
  const dictionary = ALL_MESSAGES[language] ?? ALL_MESSAGES.en;
  const fallback = ALL_MESSAGES.en[key];
  let message = dictionary[key] ?? fallback ?? key;

  if (params) {
    for (const [param, value] of Object.entries(params)) {
      message = message.replaceAll(`{${param}}`, String(value));
    }
  }

  return message;
}
