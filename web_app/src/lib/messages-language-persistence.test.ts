import { STORAGE_KEYS } from "@/lib/constants";
import { getInitialClientLanguage } from "@/lib/messages";

describe("initial language persistence", () => {
  const originalNavigatorLanguage = window.navigator.language;

  beforeEach(() => {
    window.localStorage.clear();
    document.cookie = `${STORAGE_KEYS.LANGUAGE}=; path=/; max-age=0`;
  });

  afterEach(() => {
    document.cookie = `${STORAGE_KEYS.LANGUAGE}=; path=/; max-age=0`;
    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: originalNavigatorLanguage,
    });
  });

  it("restores the cookie before a conflicting local preference", () => {
    window.localStorage.setItem(STORAGE_KEYS.LANGUAGE, "ar");
    document.cookie = `${STORAGE_KEYS.LANGUAGE}=fr; path=/`;

    expect(getInitialClientLanguage()).toBe("fr");
  });

  it("uses local storage when the cookie is absent", () => {
    window.localStorage.setItem(STORAGE_KEYS.LANGUAGE, "nl");

    expect(getInitialClientLanguage()).toBe("nl");
  });

  it("uses a supported browser language when no preference is stored", () => {
    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: "ar-BE",
    });

    expect(getInitialClientLanguage()).toBe("ar");
  });

  it("falls back to English for an unsupported browser language", () => {
    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: "de-BE",
    });

    expect(getInitialClientLanguage()).toBe("en");
  });
});
