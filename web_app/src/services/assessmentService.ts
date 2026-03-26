/**
 * Assessment Service
 * Wraps all /api/assessment/** REST endpoints.
 */

import { apiClient } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export type DifficultyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface AssessmentChoice {
  id: number;
  sortOrder: number;
  text: string;
}

export interface AssessmentQuestion {
  id: number;
  difficulty: DifficultyLevel;
  question: string;
  explanation: string | null;
  choices: AssessmentChoice[];
}

export interface AssessmentAnswerCheck {
  correct: boolean;
  correctChoiceId: number;
}

export interface AssessmentCategory {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  timeLimitMinutes: number;
  passingScorePercent: number;
  difficulties: DifficultyLevel[];
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getAssessmentCategories(
  lang = "en",
): Promise<AssessmentCategory[]> {
  const res = await apiClient.get<AssessmentCategory[]>(
    `/assessment/categories?lang=${encodeURIComponent(lang)}`,
  );
  return res.data;
}

export async function getAssessmentCategory(
  slug: string,
  lang = "en",
): Promise<AssessmentCategory> {
  const res = await apiClient.get<AssessmentCategory>(
    `/assessment/categories/${encodeURIComponent(slug)}?lang=${encodeURIComponent(lang)}`,
  );
  return res.data;
}

export async function getAssessmentQuestions(
  slug: string,
  level: DifficultyLevel,
  lang = "en",
  limit = 3,
): Promise<AssessmentQuestion[]> {
  const res = await apiClient.get<AssessmentQuestion[]>(
    `/assessment/categories/${encodeURIComponent(slug)}/questions` +
      `?level=${level}&lang=${encodeURIComponent(lang)}&limit=${limit}`,
  );
  return res.data;
}

export async function checkAssessmentAnswer(
  questionId: number,
  choiceId: number,
): Promise<AssessmentAnswerCheck> {
  const res = await apiClient.post<AssessmentAnswerCheck>(
    `/assessment/questions/${questionId}/check`,
    { choiceId },
  );
  return res.data;
}
