import { generateMetadata } from "@/app/traffic-signs/layout";
import { getRequestLocale } from "@/lib/server/request-locale";
import { getTrafficSignsSeoCopy } from "@/lib/learning-seo-copy";
jest.mock("@/lib/server/request-locale", () => ({ getRequestLocale: jest.fn() }));
jest.mock("@/lib/learning-seo-copy", () => ({ getTrafficSignsSeoCopy: jest.fn() }));
const requestLocale = getRequestLocale as jest.Mock;
const getCopy = getTrafficSignsSeoCopy as jest.Mock;
const title = "Belgian Road Signs & Traffic Signs Explained | Rijvia";
const description = "Explore 184 Belgian road and traffic signs with clear meanings. Learn priority, warning and prohibition signs for the Belgian driving theory exam.";
const copy = { title: "Original signs title", description: "Original description", openGraphTitle: "Original social title", openGraphDescription: "Original social description", keywords: ["road signs"], imageAlt: "Traffic sign" };
describe("English traffic signs CTR pilot", () => {
  beforeEach(() => { jest.resetAllMocks(); requestLocale.mockResolvedValue("en"); getCopy.mockReturnValue(copy); });
  it("uses the approved English SEO metadata", async () => { const m = await generateMetadata(); expect(m.title).toEqual({ absolute: title }); expect(m.description).toBe(description); });
  it("updates Open Graph and Twitter consistently", async () => { const m = await generateMetadata(); expect(m.openGraph?.title).toBe(title); expect(m.openGraph?.description).toBe(description); expect(m.twitter?.title).toBe(title); expect(m.twitter?.description).toBe(description); });
  it("preserves English canonical and alternate links", async () => { const m = await generateMetadata(); expect(m.alternates?.canonical).toBe("https://rijvia.be/traffic-signs"); expect(m.alternates?.languages).toBeDefined(); expect(m.openGraph?.url).toBe("https://rijvia.be/traffic-signs"); expect(m.keywords).toEqual(["road signs"]); });
  it.each(["ar", "nl", "fr"] as const)("preserves original %s metadata", async (locale) => { requestLocale.mockResolvedValue(locale); const m = await generateMetadata(); expect(getCopy).toHaveBeenCalledWith(locale); expect(m.title).toEqual({ absolute: "Original signs title | Rijvia" }); expect(m.description).toBe("Original description"); expect(m.openGraph?.title).toBe("Original social title | Rijvia"); expect(m.openGraph?.description).toBe("Original social description"); expect(m.twitter?.description).toBe("Original social description"); expect(m.alternates?.canonical).toContain("/" + locale + "/traffic-signs"); });
});
