import {
  buildLanguageAlternates,
  buildLocalizedUrl,
  getLocaleFromPathname,
  localizeHref,
  localizePathname,
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

  it("builds reciprocal hreflang URLs with English as x-default", () => {
    const alternatives = buildLanguageAlternates(
      "/lessons/les-19/2",
      "https://readyroad.be",
    );

    expect(alternatives).toEqual({
      en: "https://readyroad.be/lessons/les-19/2",
      "nl-BE": "https://readyroad.be/nl/lessons/les-19/2",
      "fr-BE": "https://readyroad.be/fr/lessons/les-19/2",
      ar: "https://readyroad.be/ar/lessons/les-19/2",
      "x-default": "https://readyroad.be/lessons/les-19/2",
    });
    expect(
      buildLocalizedUrl("/traffic-signs/B1", "ar", "https://readyroad.be/"),
    ).toBe("https://readyroad.be/ar/traffic-signs/B1");
  });
});
