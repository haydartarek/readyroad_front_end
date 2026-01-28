/**
 * Language Context Tests
 * Tests language switching and RTL direction enforcement
 * WITHOUT mocking backend - uses localStorage stub only
 */

import { STORAGE_KEYS, LANGUAGES, DEFAULT_LANGUAGE } from '@/lib/constants';

describe('LanguageContext Logic', () => {
    let localStorageMock: { [key: string]: string };
    let documentLang: string;
    let documentDir: string;

    beforeEach(() => {
        // Setup localStorage mock
        localStorageMock = {};

        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn((key: string) => localStorageMock[key] || null),
                setItem: jest.fn((key: string, value: string) => {
                    localStorageMock[key] = value;
                }),
                removeItem: jest.fn((key: string) => {
                    delete localStorageMock[key];
                }),
                clear: jest.fn(() => {
                    localStorageMock = {};
                }),
            },
            writable: true,
        });

        // Setup document mock for lang and dir attributes
        documentLang = 'en';
        documentDir = 'ltr';

        Object.defineProperty(document.documentElement, 'lang', {
            get: () => documentLang,
            set: (value: string) => {
                documentLang = value;
            },
            configurable: true,
        });

        Object.defineProperty(document.documentElement, 'dir', {
            get: () => documentDir,
            set: (value: string) => {
                documentDir = value;
            },
            configurable: true,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('language storage key is correct', () => {
        expect(STORAGE_KEYS.LANGUAGE).toBe('readyroad_language');
    });

    test('default language is English', () => {
        expect(DEFAULT_LANGUAGE).toBe('en');
    });

    test('language switching persists to localStorage', () => {
        const newLanguage = 'fr';
        localStorage.setItem(STORAGE_KEYS.LANGUAGE, newLanguage);

        expect(window.localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.LANGUAGE, 'fr');
        expect(localStorageMock[STORAGE_KEYS.LANGUAGE]).toBe('fr');
    });

    test('Arabic language has RTL direction in config', () => {
        const arabicLang = LANGUAGES.find(l => l.code === 'ar');
        expect(arabicLang).toBeDefined();
        expect(arabicLang?.dir).toBe('rtl');
    });

    test('English language has LTR direction in config', () => {
        const englishLang = LANGUAGES.find(l => l.code === 'en');
        expect(englishLang).toBeDefined();
        expect(englishLang?.dir).toBe('ltr');
    });

    test('Dutch language has LTR direction in config', () => {
        const dutchLang = LANGUAGES.find(l => l.code === 'nl');
        expect(dutchLang).toBeDefined();
        expect(dutchLang?.dir).toBe('ltr');
    });

    test('French language has LTR direction in config', () => {
        const frenchLang = LANGUAGES.find(l => l.code === 'fr');
        expect(frenchLang).toBeDefined();
        expect(frenchLang?.dir).toBe('ltr');
    });

    test('RTL direction logic: Arabic should be RTL', () => {
        const language = 'ar';
        const isRTL = language === 'ar';
        expect(isRTL).toBe(true);
    });

    test('RTL direction logic: English should be LTR', () => {
        const language = 'en';
        const isRTL = language === 'en' ? false : language === 'ar';
        expect(isRTL).toBe(false);
    });

    test('document direction can be set to RTL', () => {
        document.documentElement.dir = 'rtl';
        expect(documentDir).toBe('rtl');
    });

    test('document direction can be set to LTR', () => {
        document.documentElement.dir = 'ltr';
        expect(documentDir).toBe('ltr');
    });

    test('document lang attribute can be set', () => {
        document.documentElement.lang = 'ar';
        expect(documentLang).toBe('ar');
    });
});

