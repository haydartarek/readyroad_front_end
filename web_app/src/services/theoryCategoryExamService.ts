import apiClient from "@/lib/api";
import type { HomeLessonCategory } from "@/lib/home-lessons-overview";
import type { SiteLocale as Language } from "@/lib/site-copy";

export interface CategoryExamOption {
  id: number;
  optionTextEn: string;
  optionTextAr: string;
  optionTextNl: string;
  optionTextFr: string;
}

export interface CategoryExamQuestion {
  id: number;
  questionEn: string;
  questionAr: string;
  questionNl: string;
  questionFr: string;
  contentImageUrl?: string | null;
  difficultyLevel: string;
  options: CategoryExamOption[];
}

export interface CategoryExamData {
  category: HomeLessonCategory;
  questions: CategoryExamQuestion[];
  serverTime: string;
}

export interface CategoryExamFeedback {
  questionId: number;
  isCorrect: boolean;
  correctOptionId: number;
  explanationEn?: string;
  explanationAr?: string;
  explanationNl?: string;
  explanationFr?: string;
}

const categoryPath = (code: string) => `/practice/theory/categories/${encodeURIComponent(code)}`;

export async function getCategoryExamSummary(code: string, language: Language, signal?: AbortSignal) {
  const { data } = await apiClient.get<HomeLessonCategory>(`${categoryPath(code)}/summary`,
    { lang: language }, { signal, skipAuthRedirect: true });
  return data;
}

export async function getCategoryExam(code: string, language: Language, signal?: AbortSignal) {
  const { data } = await apiClient.get<CategoryExamData>(`${categoryPath(code)}/exam`,
    { lang: language }, { signal, skipAuthRedirect: true });
  return data;
}

export async function answerCategoryExam(code: string, questionId: number, optionId: number) {
  const { data } = await apiClient.post<CategoryExamFeedback>(
    `${categoryPath(code)}/questions/${questionId}/answer`, { selectedOptionId: optionId });
  return data;
}
