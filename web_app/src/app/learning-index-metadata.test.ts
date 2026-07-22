import { generateMetadata as generateLessonsMetadata } from "@/app/lessons/layout";
import { generateMetadata as generateTrafficSignsMetadata } from "@/app/traffic-signs/layout";
import { cookies } from "next/headers";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

const mockedCookies = jest.mocked(cookies);

describe("learning index metadata", () => {
  it("targets Belgian traffic-sign intent in Arabic", async () => {
    mockedCookies.mockResolvedValue({
      get: jest.fn(() => ({ value: "ar" })),
    } as never);

    const metadata = await generateTrafficSignsMetadata();

    expect(metadata.title).toBe("إشارات المرور في بلجيكا: المعاني والشرح");
    expect(metadata.openGraph?.locale).toBe("ar_BE");
    expect(metadata.alternates?.canonical).toContain("/traffic-signs");
  });

  it("targets category B theory lessons in Dutch", async () => {
    mockedCookies.mockResolvedValue({
      get: jest.fn(() => ({ value: "nl" })),
    } as never);

    const metadata = await generateLessonsMetadata();

    expect(metadata.title).toBe("Theorie rijbewijs B België: 30 lessen");
    expect(metadata.openGraph?.locale).toBe("nl_BE");
    expect(metadata.alternates?.canonical).toContain("/lessons");
  });
});
