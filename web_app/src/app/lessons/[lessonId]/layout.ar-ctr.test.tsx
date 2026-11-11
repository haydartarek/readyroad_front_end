import { generateMetadata } from "@/app/lessons/[lessonId]/layout";
import { getPublicLesson } from "@/lib/server/public-catalog";
import { getRequestLocale } from "@/lib/server/request-locale";
jest.mock("@/lib/server/public-catalog", () => ({ getPublicLesson: jest.fn() }));
jest.mock("@/lib/server/request-locale", () => ({ getRequestLocale: jest.fn() }));
const fetchLesson = getPublicLesson as jest.Mock;
const requestLocale = getRequestLocale as jest.Mock;
const seoTitle = "مسافة التوقف ومسافة الفرملة | زمن رد الفعل في السياقة | Rijvia";
const seoDescription = "ما الفرق بين مسافة التوقف ومسافة الفرملة؟ تعرّف على زمن رد الفعل ومسافة رد الفعل ومسافة الأمان، وكيف ترتبط هذه المفاهيم بقواعد السياقة النظرية في بلجيكا.";
const lesson = { lessonCode: "les-14", titleAr: "زمن رد الفعل ومسافة الفرملة", descriptionAr: "الوصف العربي الأصلي", titleNl: "Reactietijd en remweg", descriptionNl: "Originele beschrijving", titleEn: "Reaction time", descriptionEn: "Original description", titleFr: "Temps de reaction", descriptionFr: "Description originale" };
describe("Arabic lesson 14 CTR pilot", () => {
  beforeEach(() => { jest.resetAllMocks(); fetchLesson.mockResolvedValue(lesson); requestLocale.mockResolvedValue("ar"); });
  const load = () => generateMetadata({ params: Promise.resolve({ lessonId: "les-14" }) });
  it("uses approved Arabic metadata", async () => { const m = await load(); expect(m.title).toEqual({ absolute: seoTitle }); expect(m.description).toBe(seoDescription); expect(m.openGraph?.title).toBe(seoTitle); expect(m.twitter?.description).toBe(seoDescription); });
  it("preserves canonical and indexability", async () => { const m = await load(); expect(m.alternates?.canonical).toContain("/ar/lessons/les-14"); expect(m.alternates?.languages?.["x-default"]).toContain("/lessons/les-14"); expect(m.robots).toEqual({ index: true, follow: true }); });
  it.each([["en", "Original description"], ["fr", "Description originale"], ["nl", "Originele beschrijving"]] as const)("preserves %s metadata", async (locale, description) => { requestLocale.mockResolvedValue(locale); const m = await load(); expect(m.description).toBe(description); expect(m.title).not.toEqual({ absolute: seoTitle }); });
  it("preserves other Arabic lessons", async () => { fetchLesson.mockResolvedValue({ ...lesson, lessonCode: "les-15" }); const m = await generateMetadata({ params: Promise.resolve({ lessonId: "les-15" }) }); expect(m.description).toBe("الوصف العربي الأصلي"); expect(m.title).not.toEqual({ absolute: seoTitle }); });
});
