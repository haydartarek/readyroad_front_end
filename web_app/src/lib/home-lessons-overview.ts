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
