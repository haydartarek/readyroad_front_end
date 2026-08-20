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
    "keeps the approved educational and privacy hierarchy",
    (messages, headline) => {
      expect(
        `${messages["home.hero.headline"]} ${messages["home.hero.headline_highlight"]}`,
      ).toBe(headline);
      expect(messages["home.hero.subtitle"]).toBeTruthy();
      expect(messages["home.hero.privacy"]).toBeTruthy();
    },
  );

  it.each([
    ["en", "RijVia | Belgian Driving Theory Test Practice"],
    ["ar", "RijVia | امتحان السياقة النظري في بلجيكا"],
    ["nl", "RijVia | Theorie-examen rijbewijs B oefenen België"],
    ["fr", "RijVia | Examen théorique permis B Belgique"],
  ] as const)(
    "uses one pipe-separated RijVia title for %s",
    (locale, title) => {
      const copy = getHomeMetadataCopy(locale);

      expect(copy.title).toBe(title);
      expect(copy.openGraphTitle).toBe(title);
      expect(copy.title).not.toContain("RijVia:");
      expect(copy.title.match(/RijVia/g)).toHaveLength(1);
    },
  );

  it.each(["en", "ar", "nl", "fr"] as const)(
    "keeps branded home and video titles absolute for %s",
    async (locale) => {
      mockedGetRequestLocale.mockResolvedValue(locale);

      const homeMetadata = await generateHomeMetadata();
      const videosMetadata = await generateVideosMetadata();

      expect(homeMetadata.title).toEqual({
        absolute: getHomeMetadataCopy(locale).title,
      });
      expect(videosMetadata.title).toEqual({
        absolute: expect.stringContaining("| RijVia"),
      });
      expect(
        String((videosMetadata.title as { absolute: string }).absolute).match(
          /RijVia/g,
        ),
      ).toHaveLength(1);
    },
  );
});
