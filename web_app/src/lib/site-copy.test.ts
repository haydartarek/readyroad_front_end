import { getHomeMetadataCopy } from "@/lib/site-copy";
import { generateMetadata as generateHomeMetadata } from "@/app/page";
import { generateMetadata as generateVideosMetadata } from "@/app/videos/page";
import { getRequestLocale } from "@/lib/server/request-locale";

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
    ["en", "ReadyRoad | Belgian Driving Theory Test Practice"],
    ["ar", "ReadyRoad | امتحان السياقة النظري في بلجيكا"],
    ["nl", "ReadyRoad | Theorie-examen rijbewijs B oefenen België"],
    ["fr", "ReadyRoad | Examen théorique permis B Belgique"],
  ] as const)("uses one pipe-separated ReadyRoad title for %s", (locale, title) => {
    const copy = getHomeMetadataCopy(locale);

    expect(copy.title).toBe(title);
    expect(copy.openGraphTitle).toBe(title);
    expect(copy.title).not.toContain("ReadyRoad:");
    expect(copy.title.match(/ReadyRoad/g)).toHaveLength(1);
  });

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
        absolute: expect.stringContaining("| ReadyRoad"),
      });
      expect(
        String((videosMetadata.title as { absolute: string }).absolute).match(
          /ReadyRoad/g,
        ),
      ).toHaveLength(1);
    },
  );
});
