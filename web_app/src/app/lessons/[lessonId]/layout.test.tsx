import LegacyLessonPage from "@/app/lessons/[lessonId]/[pageNumber]/page";
import { permanentRedirect, notFound } from "next/navigation";
jest.mock("next/navigation", () => ({
  permanentRedirect: jest.fn(() => { throw new Error("redirect"); }),
  notFound: jest.fn(() => { throw new Error("not-found"); }),
}));
import { generateMetadata } from "@/app/lessons/[lessonId]/layout";
import { getPublicLesson } from "@/lib/server/public-catalog";
import { DEFAULT_APP_URL } from "@/lib/site-copy";
import { cookies } from "next/headers";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

jest.mock("@/lib/server/public-catalog", () => ({
  getPublicLesson: jest.fn(),
}));

const mockedGetPublicLesson = jest.mocked(getPublicLesson);
const mockedCookies = jest.mocked(cookies);
const appUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

describe("lesson detail metadata", () => {
  beforeEach(() => {
    mockedCookies.mockResolvedValue({
      get: jest.fn(() => undefined),
    } as never);
  });

  it("uses lesson data for a unique canonical page", async () => {
    mockedGetPublicLesson.mockResolvedValue({
      lessonCode: "les-0",
      titleEn: "Road users and public roads",
      descriptionEn: "Learn the core rules that apply to road users in Belgium.",
    } as Awaited<ReturnType<typeof getPublicLesson>>);

    const metadata = await generateMetadata({
      params: Promise.resolve({ lessonId: "les-0" }),
    });

    expect(metadata.alternates?.canonical).toBe(`${appUrl}/lessons/les-0`);
    expect(metadata.title).toEqual({
      absolute:
        "Road users and public roads | Belgian Driving Theory | RijVia",
    });
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it("uses the Arabic lesson fields for Arabic metadata", async () => {
    mockedCookies.mockResolvedValue({
      get: jest.fn(() => ({ value: "ar" })),
    } as never);
    mockedGetPublicLesson.mockResolvedValue({
      lessonCode: "les-19",
      titleEn: "Priority to the Right",
      titleAr: "الأولوية من اليمين",
      descriptionEn: "English lesson description.",
      descriptionAr: "شرح قاعدة الأولوية من اليمين.",
    } as Awaited<ReturnType<typeof getPublicLesson>>);

    const metadata = await generateMetadata({
      params: Promise.resolve({ lessonId: "les-19" }),
    });

    expect(metadata.title).toEqual({
      absolute:
        "الأولوية من اليمين | قواعد السياقة البلجيكية | RijVia",
    });
    expect(metadata.description).toBe("شرح قاعدة الأولوية من اليمين.");
    expect(metadata.openGraph?.locale).toBe("ar_BE");
    expect(metadata.alternates?.canonical).toBe(
      `${appUrl}/ar/lessons/les-19`,
    );
    expect(metadata.alternates?.languages?.["x-default"]).toBe(
      `${appUrl}/lessons/les-19`,
    );
  });

  it("marks a missing lesson as noindex", async () => {
    mockedGetPublicLesson.mockResolvedValue(null);

    const metadata = await generateMetadata({
      params: Promise.resolve({ lessonId: "missing" }),
    });

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

describe("retired lesson page URLs", () => {
  test.each(["en", "ar", "nl", "fr"])("redirects every numbered page to its %s lesson", async (locale) => {
    mockedCookies.mockResolvedValue({ get: jest.fn(() => ({ value: locale })) } as never);
    mockedGetPublicLesson.mockResolvedValue({ lessonCode: "les-19" } as Awaited<ReturnType<typeof getPublicLesson>>);
    for (const pageNumber of ["1", "2", "8"]) {
      await expect(LegacyLessonPage({ params: Promise.resolve({ lessonId: "les-19", pageNumber }) }))
        .rejects.toThrow("redirect");
      expect(permanentRedirect).toHaveBeenLastCalledWith(`${locale === "en" ? "" : "/" + locale}/lessons/les-19`);
    }
  });
  test.each(["0", "-1", "2.5", "wrong"])("rejects invalid page number %s", async (pageNumber) => {
    await expect(LegacyLessonPage({ params: Promise.resolve({ lessonId: "les-19", pageNumber }) }))
      .rejects.toThrow("not-found");
    expect(notFound).toHaveBeenCalled();
  });
});
