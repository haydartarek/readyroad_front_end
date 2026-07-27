import { generateMetadata } from "@/app/traffic-signs/[signCode]/layout";
import { getPublicTrafficSign } from "@/lib/server/public-catalog";
import { DEFAULT_APP_URL } from "@/lib/site-copy";
import { cookies } from "next/headers";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

jest.mock("@/lib/server/public-catalog", () => ({
  getPublicTrafficSign: jest.fn(),
}));

const mockedGetPublicTrafficSign = jest.mocked(getPublicTrafficSign);
const mockedCookies = jest.mocked(cookies);
const appUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

describe("traffic sign detail metadata", () => {
  beforeEach(() => {
    mockedCookies.mockResolvedValue({
      get: jest.fn(() => undefined),
    } as never);
  });

  it("uses the sign data for title, canonical, description, and image", async () => {
    mockedGetPublicTrafficSign.mockResolvedValue({
      signCode: "A1a",
      routeCode: "A1a",
      nameEn: "Dangerous bend to the left",
      descriptionEn: "Warns of a dangerous bend to the left.",
      summaryEn: "Dangerous bend ahead.",
      imageUrl: "/images/signs/danger signs/A1a.png",
    } as Awaited<ReturnType<typeof getPublicTrafficSign>>);

    const metadata = await generateMetadata({
      params: Promise.resolve({ signCode: "A1a" }),
    });

    expect(metadata.title).toEqual({
      absolute: "A1a: Dangerous bend to the left | ReadyRoad",
    });
    expect(metadata.alternates?.canonical).toBe(`${appUrl}/traffic-signs/A1a`);
    expect(metadata.description).toBe(
      "A1a: Warns of a dangerous bend to the left.",
    );
    expect(metadata.openGraph?.images).toEqual([
      {
        url: `${appUrl}/images/signs/danger%20signs/A1a.png`,
        alt: "A1a: Dangerous bend to the left",
      },
    ]);
  });

  it("uses the selected locale without changing the canonical URL", async () => {
    mockedCookies.mockResolvedValue({
      get: jest.fn(() => ({ value: "fr" })),
    } as never);
    mockedGetPublicTrafficSign.mockResolvedValue({
      signCode: "B1",
      routeCode: "B1",
      nameEn: "Yield",
      nameFr: "Cédez le passage",
      descriptionEn: "Give way to other road users.",
      descriptionFr: "Cédez le passage aux autres usagers.",
      imageUrl: "/images/signs/B1.png",
    } as Awaited<ReturnType<typeof getPublicTrafficSign>>);

    const metadata = await generateMetadata({
      params: Promise.resolve({ signCode: "B1" }),
    });

    expect(metadata.title).toEqual({
      absolute: "B1: Cédez le passage | ReadyRoad",
    });
    expect(metadata.description).toBe(
      "B1: Cédez le passage aux autres usagers.",
    );
    expect(metadata.openGraph?.locale).toBe("fr_BE");
    expect(metadata.alternates?.canonical).toBe(
      `${appUrl}/fr/traffic-signs/B1`,
    );
  });

  it("marks missing signs as noindex", async () => {
    mockedGetPublicTrafficSign.mockResolvedValue(null);

    const metadata = await generateMetadata({
      params: Promise.resolve({ signCode: "missing" }),
    });

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
