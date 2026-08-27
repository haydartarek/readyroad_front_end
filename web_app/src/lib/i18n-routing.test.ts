import {
  buildLanguageAlternates,
  buildLocalizedUrl,
  getLocaleFromPathname,
  localizeHref,
  localizePathname,
  resolveRouteLocale,
} from "@/lib/i18n-routing";

describe("multilingual routing", () => {
  it.each([
    ["/lessons/les-19/2", "en", "/lessons/les-19/2"],
    ["/lessons/les-19/2", "nl", "/nl/lessons/les-19/2"],
    ["/fr/lessons/les-19/2", "ar", "/ar/lessons/les-19/2"],
    ["/ar", "en", "/"],
  ] as const)("localizes %s for %s", (pathname, locale, expected) => {
    expect(localizePathname(pathname, locale)).toBe(expected);
  });

  it("extracts the route locale and preserves the unprefixed route", () => {
    expect(getLocaleFromPathname("/fr/traffic-signs/B1")).toEqual({
      locale: "fr",
      pathname: "/traffic-signs/B1",
      hasLocalePrefix: true,
      hasEnglishPrefix: false,
    });
    expect(getLocaleFromPathname("/traffic-signs/B1").locale).toBe("en");
  });

  it("preserves query strings and fragments while switching language", () => {
    expect(localizeHref("/lessons/les-19/2?from=lesson#rule", "nl")).toBe(
      "/nl/lessons/les-19/2?from=lesson#rule",
    );
  });

  it("uses an explicit URL locale before a persisted preference", () => {
    expect(resolveRouteLocale("/fr/lessons/les-19/2", "ar")).toBe("fr");
    expect(resolveRouteLocale("/en/dashboard", "nl")).toBe("en");
  });

  it("restores a persisted locale for an unprefixed route", () => {
    expect(resolveRouteLocale("/dashboard", "ar")).toBe("ar");
    expect(resolveRouteLocale("/lessons/les-19/2", "nl")).toBe("nl");
    expect(resolveRouteLocale("/login", "unsupported")).toBe("en");
  });

  it("builds reciprocal hreflang URLs with English as x-default", () => {
    const alternatives = buildLanguageAlternates(
      "/lessons/les-19/2",
      "https://rijvia.be",
    );

    expect(alternatives).toEqual({
      en: "https://rijvia.be/lessons/les-19/2",
      "nl-BE": "https://rijvia.be/nl/lessons/les-19/2",
      "fr-BE": "https://rijvia.be/fr/lessons/les-19/2",
      ar: "https://rijvia.be/ar/lessons/les-19/2",
      "x-default": "https://rijvia.be/lessons/les-19/2",
    });
    expect(
      buildLocalizedUrl("/traffic-signs/B1", "ar", "https://rijvia.be/"),
    ).toBe("https://rijvia.be/ar/traffic-signs/B1");
  });
});
