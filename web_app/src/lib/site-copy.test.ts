import { getHomeMetadataCopy } from "@/lib/site-copy";
import { generateMetadata as generateHomeMetadata } from "@/app/page";
import { generateMetadata as generateVideosMetadata } from "@/app/videos/page";
import { getRequestLocale } from "@/lib/server/request-locale";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";
import nl from "@/messages/nl.json";
import fr from "@/messages/fr.json";

jest.mock("@/lib/server/request-locale", () => ({
  getRequestLocale: jest.fn(),
}));

jest.mock("@/lib/server/youtube", () => ({
  getYouTubeVideoPage: jest.fn(),
}));

jest.mock("@/components/videos/video-gallery", () => ({
  VideoGallery: () => null,
}));

const mockedGetRequestLocale = jest.mocked(getRequestLocale);

describe("home metadata titles", () => {
  it.each([
    [ar, "RijVia | استعد لامتحان السياقة النظري في بلجيكا بثقة"],
    [
      en,
      "RijVia | Prepare for the Belgian driving theory exam with confidence",
    ],
    [
      nl,
      "RijVia | Bereid je voor op het Belgische theorie-examen met vertrouwen",
    ],
    [fr, "RijVia | Préparez l’examen théorique belge en toute confiance"],
  ])(
    "keeps the approved visible Hero hierarchy",
    (messages, headline) => {
      expect(
        `${messages["home.hero.headline"]} ${messages["home.hero.headline_highlight"]}`,
      ).toBe(headline);

      expect(
        messages["home.hero.subtitle"],
      ).toBeTruthy();

      expect(
        messages["home.hero.privacy"],
      ).toBeTruthy();
    },
  );

  it.each([
    ["en", en],
    ["nl", nl],
    ["fr", fr],
    ["ar", ar],
  ] as const)(
    "uses visible Home Hero content as metadata source for %s",
    async (locale, messages) => {
      mockedGetRequestLocale.mockResolvedValue(
        locale,
      );

      const metadata =
        await generateHomeMetadata();

      const headline =
        messages["home.hero.headline"]
          .replace(
            /^RijVia\s*\|\s*/i,
            "",
          )
          .trim();

      const expectedTitle =
        `${headline} ${messages["home.hero.headline_highlight"]} | Rijvia`;

      expect(metadata.title).toEqual({
        absolute: expectedTitle,
      });

      expect(metadata.description).toBe(
        messages["home.hero.subtitle"],
      );

      expect(metadata.openGraph?.title).toBe(
        expectedTitle,
      );

      expect(
        metadata.openGraph?.description,
      ).toBe(
        messages["home.hero.subtitle"],
      );

      expect(metadata.twitter?.title).toBe(
        expectedTitle,
      );

      expect(
        metadata.twitter?.description,
      ).toBe(
        messages["home.hero.subtitle"],
      );

      expect(
        getHomeMetadataCopy(locale).keywords.length,
      ).toBeGreaterThan(0);
    },
  );

  it.each(["en", "nl", "fr", "ar"] as const)(
    "keeps the canonical Rijvia suffix for Videos in %s",
    async (locale) => {
      mockedGetRequestLocale.mockResolvedValue(
        locale,
      );

      const metadata =
        await generateVideosMetadata();

      const absolute =
        String(
          (
            metadata.title as {
              absolute: string;
            }
          ).absolute,
        );

      expect(
        absolute.endsWith("| Rijvia"),
      ).toBe(true);

      expect(
        absolute.endsWith("| RijVia"),
      ).toBe(false);
    },
  );
});
