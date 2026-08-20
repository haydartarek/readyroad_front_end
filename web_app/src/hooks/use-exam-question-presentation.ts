"use client";

import { useEffect, useRef } from "react";
import { apiClient, logApiError } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";

export function useExamQuestionPresentation(
  examId: number,
  questionId: number | undefined,
  enabled: boolean,
) {
  const requestedPresentations = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled || !Number.isFinite(examId) || !questionId) return;

    const key = `${examId}:${questionId}`;
    if (requestedPresentations.current.has(key)) return;
    requestedPresentations.current.add(key);

    void apiClient
      .post(API_ENDPOINTS.EXAMS.PRESENTED(examId, questionId))
      .catch((error) => {
        requestedPresentations.current.delete(key);
        logApiError("Failed to record exam question presentation", error);
      });
  }, [enabled, examId, questionId]);
}
