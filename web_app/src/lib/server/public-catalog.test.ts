import {
  getPublicBackendApiUrl,
  toTrafficSignCatalogItem,
} from "@/lib/server/public-catalog";
import type { TrafficSign } from "@/lib/types";

describe("public catalog API configuration", () => {
  const originalBackendUrl = process.env.BACKEND_URL;
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  afterEach(() => {
    if (originalBackendUrl === undefined) {
      delete process.env.BACKEND_URL;
    } else {
      process.env.BACKEND_URL = originalBackendUrl;
    }

    if (originalPublicUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    }
  });

  it("adds the API path when the backend URL is an origin", () => {
    process.env.BACKEND_URL = "https://backend.example.test/";
    expect(getPublicBackendApiUrl()).toBe("https://backend.example.test/api");
  });

  it("does not duplicate an existing API path", () => {
    process.env.BACKEND_URL = "https://backend.example.test/api/";
    expect(getPublicBackendApiUrl()).toBe("https://backend.example.test/api");
  });

  it("keeps only fields required by the public catalog", () => {
    const item = toTrafficSignCatalogItem({
      signCode: "A1a",
      routeCode: "A1a",
      categoryCode: "DANGER",
      nameEn: "English name",
      nameAr: "Arabic name",
      nameNl: "Dutch name",
      nameFr: "French name",
      summaryEn: "Summary",
      summaryAr: "Summary",
      summaryNl: "Summary",
      summaryFr: "Summary",
      descriptionEn: "English description",
      descriptionAr: "Arabic description",
      descriptionNl: "Dutch description",
      descriptionFr: "French description",
      driverGuidanceEn: "Guidance",
      driverGuidanceAr: "Guidance",
      driverGuidanceNl: "Guidance",
      driverGuidanceFr: "Guidance",
      exceptionsEn: ["Exception"],
      exceptionsAr: ["Exception"],
      exceptionsNl: ["Exception"],
      exceptionsFr: ["Exception"],
      imageUrl: "/images/signs/A1a.png",
    } satisfies TrafficSign);

    expect(item).toEqual({
      signCode: "A1a",
      routeCode: "A1a",
      categoryCode: "DANGER",
      nameEn: "English name",
      nameAr: "Arabic name",
      nameNl: "Dutch name",
      nameFr: "French name",
      descriptionEn: "English description",
      descriptionAr: "Arabic description",
      descriptionNl: "Dutch description",
      descriptionFr: "French description",
      imageUrl: "/images/signs/A1a.png",
    });
    expect(item).not.toHaveProperty("driverGuidanceEn");
    expect(item).not.toHaveProperty("exceptionsEn");
  });
});
