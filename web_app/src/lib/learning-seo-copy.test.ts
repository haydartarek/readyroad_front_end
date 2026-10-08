import {
  getLessonsSeoCopy,
  getLessonSearchCopy,
  getLocalizedLessonSeo,
  getLocalizedTrafficSignSeo,
  getTrafficSignsSeoCopy,
} from "@/lib/learning-seo-copy";
import type { LessonDetail, TrafficSign } from "@/lib/types";
import { translateMessage } from "@/lib/messages";

const sign = {
  signCode: "B1",
  categoryCode: "B",
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
  driverGuidanceEn: "English guidance",
  driverGuidanceNl: "Nederlandse richtlijn",
  driverGuidanceFr: "Conseil français",
  driverGuidanceAr: "إرشاد عربي",
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
    "derives index metadata from the same visible messages for %s",
    (locale) => {
      const traffic = getTrafficSignsSeoCopy(locale);
      const lessons = getLessonsSeoCopy(locale);

      expect(traffic.title).toBe(
        translateMessage(locale, "traffic_signs.page_title"),
      );
      expect(traffic.description).toBe(
        translateMessage(locale, "traffic_signs.page_subtitle"),
      );
      expect(traffic.openGraphTitle).toBe(traffic.title);
      expect(traffic.openGraphDescription).toBe(traffic.description);

      expect(lessons.title).toBe(
        translateMessage(locale, "lessons.page_title"),
      );
      expect(lessons.description).toBe(
        translateMessage(locale, "lessons.page_subtitle"),
      );
      expect(lessons.openGraphTitle).toBe(lessons.title);
      expect(lessons.openGraphDescription).toBe(lessons.description);
    },
  );

  it("uses canonical localized sign fields without changing their meaning", () => {
    const copy = getLocalizedTrafficSignSeo(sign, "fr");

    expect(copy.title).toBe("Cédez le passage | Panneaux de priorité | Rijvia");
    expect(copy.description).toBe("Description française Conseil français");
    expect(copy.categoryTitle).toBe("Panneaux de priorité");
    expect(copy.title).not.toContain("B1");
    expect(copy.indexLabel).toBe("Panneaux de signalisation belges");
  });

  it("uses the same public sign-name source and preserves meaningful separators", () => {
    const futureCopy = getLocalizedTrafficSignSeo(
      {
        ...sign,
        signCode: "A53",
        categoryCode: "A",
        nameEn: "A53 - Retractable bollards (from 1 June 2027)",
      } as TrafficSign,
      "en",
    );

    expect(futureCopy.name).toBe(
      "Retractable bollards (from 1 June 2027)",
    );
    expect(futureCopy.title).toBe(
      "Retractable bollards (from 1 June 2027) | Danger Signs | Rijvia",
    );

    const variantCopy = getLocalizedTrafficSignSeo(
      {
        ...sign,
        signCode: "B15a",
        categoryCode: "B",
        nameEn:
          "Priority at the next junction - left oblique side-road variant",
      } as TrafficSign,
      "en",
    );

    expect(variantCopy.name).toBe(
      "Priority at the next junction - left oblique side-road variant",
    );
    expect(variantCopy.title).toBe(
      "Priority at the next junction - left oblique side-road variant | Priority Signs | Rijvia",
    );
  });

  it("uses governed localized lesson fields", () => {
    const copy = getLocalizedLessonSeo(lesson, "ar");

    expect(copy.name).toBe("الأولوية من اليمين");
    expect(copy.description).toBe("درس عربي");
    expect(copy.title).toContain("قواعد السياقة البلجيكية");
  });
});

describe("lesson search intent summaries", () => {
  it.each([
    ["les-5", "nl", "rijstrook"],
    ["les-9", "fr", "autoroute"],
    ["les-6", "en", "Traffic Rules"],
    ["les-12", "nl", "MTM"],
    ["les-17", "ar", "منع التجاوز"],
  ] as const)("uses the selected summary for %s in %s without replacing the catalog name", (lessonCode, locale, query) => {
    const copy = getLocalizedLessonSeo({ ...lesson, lessonCode }, locale);
    const localizedTitle = {
      en: lesson.titleEn,
      nl: lesson.titleNl,
      fr: lesson.titleFr,
      ar: lesson.titleAr,
    }[locale];

    const localizedDescription = {
      en: lesson.descriptionEn,
      nl: lesson.descriptionNl,
      fr: lesson.descriptionFr,
      ar: lesson.descriptionAr,
    }[locale];

    const contextLabel = {
      en: "Belgian Driving Theory",
      nl: "Belgische rijtheorie",
      fr: "Théorie routière belge",
      ar: "قواعد السياقة البلجيكية",
    }[locale];

    expect(copy.title).toBe(
      `${localizedTitle} | ${contextLabel} | Rijvia`,
    );
    expect(copy.description).toBe(localizedDescription);
    expect(
      getLessonSearchCopy(lessonCode, locale)?.title,
    ).toContain(query);
    expect(copy.name).toBe({ en: lesson.titleEn, nl: lesson.titleNl, fr: lesson.titleFr, ar: lesson.titleAr }[locale]);
    expect(getLessonSearchCopy(lessonCode, locale)?.paragraphs.length).toBeGreaterThan(0);
  });

  it("keeps the existing catalog metadata for other lesson and locale combinations", () => {
    expect(getLessonSearchCopy("les-5", "ar")).toBeUndefined();
    expect(getLessonSearchCopy("missing-lesson", "nl")).toBeUndefined();
    const copy = getLocalizedLessonSeo(
      { ...lesson, lessonCode: "les-5" },
      "ar",
    );

    expect(copy.description).toBe("درس عربي");
    expect(copy.title).toBe(
      "الأولوية من اليمين | قواعد السياقة البلجيكية | Rijvia",
    );
  });
});
