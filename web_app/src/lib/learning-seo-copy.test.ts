import {
  getLessonsSeoCopy,
  getLocalizedLessonSeo,
  getLocalizedTrafficSignSeo,
  getTrafficSignsSeoCopy,
} from "@/lib/learning-seo-copy";
import type { LessonDetail, TrafficSign } from "@/lib/types";

const sign = {
  signCode: "B1",
  nameEn: "Yield",
  nameNl: "Voorrang verlenen",
  nameFr: "Cédez le passage",
  nameAr: "إفساح الطريق",
  summaryEn: "English summary",
  summaryNl: "Nederlandse samenvatting",
  summaryFr: "Résumé français",
  summaryAr: "ملخص عربي",
  descriptionEn: "English description",
  descriptionNl: "Nederlandse beschrijving",
  descriptionFr: "Description française",
  descriptionAr: "وصف عربي",
} as TrafficSign;

const lesson = {
  lessonCode: "les-19",
  titleEn: "Priority to the Right",
  titleNl: "Voorrang van rechts",
  titleFr: "Priorité de droite",
  titleAr: "الأولوية من اليمين",
  descriptionEn: "English lesson",
  descriptionNl: "Nederlandse les",
  descriptionFr: "Leçon française",
  descriptionAr: "درس عربي",
} as LessonDetail;

describe("learning SEO copy", () => {
  it.each(["en", "nl", "fr", "ar"] as const)(
    "provides localized index metadata for %s",
    (locale) => {
      expect(getTrafficSignsSeoCopy(locale).title).toBeTruthy();
      expect(getLessonsSeoCopy(locale).description).toBeTruthy();
    },
  );

  it("uses canonical localized sign fields without changing their meaning", () => {
    const copy = getLocalizedTrafficSignSeo(sign, "fr");

    expect(copy.title).toBe("B1: Cédez le passage | ReadyRoad");
    expect(copy.description).toBe("Description française");
    expect(copy.indexLabel).toBe("Panneaux de signalisation belges");
  });

  it("uses governed localized lesson fields", () => {
    const copy = getLocalizedLessonSeo(lesson, "ar");

    expect(copy.name).toBe("الأولوية من اليمين");
    expect(copy.description).toBe("درس عربي");
    expect(copy.title).toContain("نظرية القيادة البلجيكية");
  });
});
