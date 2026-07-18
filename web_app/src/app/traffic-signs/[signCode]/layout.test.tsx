import { generateMetadata } from "@/app/traffic-signs/[signCode]/layout";
import { getPublicTrafficSign } from "@/lib/server/public-catalog";

jest.mock("@/lib/server/public-catalog", () => ({
  getPublicTrafficSign: jest.fn(),
}));

const mockedGetPublicTrafficSign = jest.mocked(getPublicTrafficSign);
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://readyroad.be";

describe("traffic sign detail metadata", () => {
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
      "Warns of a dangerous bend to the left.",
    );
    expect(metadata.openGraph?.images).toEqual([
      {
        url: `${appUrl}/images/signs/danger%20signs/A1a.png`,
        alt: "A1a: Dangerous bend to the left",
      },
    ]);
  });

  it("marks missing signs as noindex", async () => {
    mockedGetPublicTrafficSign.mockResolvedValue(null);

    const metadata = await generateMetadata({
      params: Promise.resolve({ signCode: "missing" }),
    });

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
