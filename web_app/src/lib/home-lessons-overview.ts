export type HomeLessonCategory = {
  categoryCode: string;
  nameNl: string;
  nameEn: string;
  nameFr: string;
  nameAr: string;
  questionCount: number;
  primary: boolean;
  displayOrder: number;
};

export function getLessonCategoryName(category: HomeLessonCategory, language: "en" | "nl" | "fr" | "ar") {
  return { en: category.nameEn, nl: category.nameNl, fr: category.nameFr, ar: category.nameAr }[language]
    || category.nameEn;
}

export type HomeLessonOverviewItem = {
  id: number;
  lessonCode: string;
  displayOrder: number;
  titleNl: string;
  titleEn: string;
  titleFr: string;
  titleAr: string;
  categories: HomeLessonCategory[];
};
