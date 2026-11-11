import { generateMetadata } from "@/app/lessons/[lessonId]/layout";
import { getPublicLesson } from "@/lib/server/public-catalog";
import { getRequestLocale } from "@/lib/server/request-locale";
jest.mock("@/lib/server/public-catalog", () => ({ getPublicLesson: jest.fn() }));
jest.mock("@/lib/server/request-locale", () => ({ getRequestLocale: jest.fn() }));
const fetchLesson = getPublicLesson as jest.Mock;
const requestLocale = getRequestLocale as jest.Mock;
const targetTitle = "Wanneer dimlichten, grootlichten en mistlichten gebruiken? | Rijvia";
const targetDescription = "Wanneer gebruik je dimlichten, grootlichten of mistlichten in België? Ontdek de regels voor standlichten, waarschuwingslichten en het theorie-examen.";
const lesson = { lessonCode: "les-12", titleNl: "Dimlichten, grootlichten, mistlichten en autoverlichting", descriptionNl: "Oorspronkelijke beschrijving", titleEn: "Mandatory direction", descriptionEn: "English description", titleFr: "Direction obligatoire", descriptionFr: "Description française", titleAr: "الاتجاه الإجباري", descriptionAr: "شرح عربي" };
describe("Dutch lesson 12 CTR pilot", () => {
  beforeEach(() => { jest.resetAllMocks(); fetchLesson.mockResolvedValue(lesson); requestLocale.mockResolvedValue("nl"); });
  const load = () => generateMetadata({ params: Promise.resolve({ lessonId: "les-12" }) });
  it("uses the approved metadata", async () => { const m = await load(); expect(m.title).toEqual({ absolute: targetTitle }); expect(m.description).toBe(targetDescription); expect(m.openGraph?.title).toBe(targetTitle); expect(m.twitter?.description).toBe(targetDescription); });
  it("preserves canonical and indexability", async () => { const m = await load(); expect(m.alternates?.canonical).toContain("/nl/lessons/les-12"); expect(m.robots).toEqual({ index: true, follow: true }); });
  it.each([["en", "English description"], ["fr", "Description française"], ["ar", "شرح عربي"]] as const)("preserves original metadata for %s", async (locale, description) => { requestLocale.mockResolvedValue(locale); const m = await load(); expect(m.description).toBe(description); expect(m.title).not.toEqual({ absolute: targetTitle }); });
  it("preserves other Dutch lessons", async () => { fetchLesson.mockResolvedValue({ ...lesson, lessonCode: "les-25" }); const m = await generateMetadata({ params: Promise.resolve({ lessonId: "les-25" }) }); expect(m.description).toBe("Oorspronkelijke beschrijving"); expect(m.title).not.toEqual({ absolute: targetTitle }); });
});
