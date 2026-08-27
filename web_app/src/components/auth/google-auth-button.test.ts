import { buildGoogleAuthHref } from "@/components/auth/google-auth-button";

function parseGoogleAuthHref(href: string): URL {
  return new URL(href, "https://rijvia.be");
}

describe("Google authentication locale persistence", () => {
  it.each([
    ["en", "/dashboard"],
    ["ar", "/ar/dashboard"],
    ["nl", "/nl/dashboard"],
    ["fr", "/fr/dashboard"],
  ] as const)("keeps %s after login", (language, expectedReturnTo) => {
    const url = parseGoogleAuthHref(
      buildGoogleAuthHref("login", language),
    );

    expect(url.searchParams.get("mode")).toBe("login");
    expect(url.searchParams.get("returnTo")).toBe(expectedReturnTo);
  });

  it("preserves a localized deep link and its query and fragment", () => {
    const url = parseGoogleAuthHref(
      buildGoogleAuthHref(
        "login",
        "ar",
        "/ar/lessons/les-19/2?category=priority#section3",
      ),
    );

    expect(url.searchParams.get("returnTo")).toBe(
      "/ar/lessons/les-19/2?category=priority#section3",
    );
  });

  it("returns account linking to the localized profile section", () => {
    const url = parseGoogleAuthHref(buildGoogleAuthHref("link", "nl"));

    expect(url.searchParams.get("returnTo")).toBe(
      "/nl/dashboard?section=profile",
    );
  });
});
