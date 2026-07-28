import type { AxiosAdapter, AxiosResponse } from "axios";

import { apiClient } from "@/lib/api";
import {
  getStudentIntelligence,
  type StudentIntelligence,
} from "./progressService";

const client = apiClient.getInstance();
const originalAdapter = client.defaults.adapter;

const validResponse: StudentIntelligence = {
  dataStatus: "LIMITED",
  studentLevel: "BASIC",
  examReadinessScore: null,
  confidenceScore: 35,
  learningConsistencyScore: 20,
  knowledgeRetentionScore: null,
  estimatedPassProbability: null,
  weeklyProgress: null,
  monthlyProgress: null,
  overallLearningTrend: "INSUFFICIENT_DATA",
  totalLearningActivities: 8,
  activeDaysLast28: 2,
  evidenceQuestions: 6,
  examAnalytics: {
    totalExams: 0,
    completedExams: 0,
    passedExams: 0,
    failedExams: 0,
    passRate: null,
    averageScore: null,
    highestScore: null,
    lowestScore: null,
    averageCompletionTimeSeconds: null,
    fastestCompletionTimeSeconds: null,
    slowestCompletionTimeSeconds: null,
    scoreTrend: null,
    passTrend: null,
    recentScores: [],
  },
  timingAnalytics: {
    averageAnswerTimeSeconds: null,
    answerTimeTrendSeconds: null,
    examTimeTrendSeconds: null,
    answerTimingSamples: 0,
    answerTimingScope: "UNAVAILABLE",
    categoryTimings: [],
  },
  progressJourney: {
    lessonsStarted: 2,
    lessonsCompleted: 0,
    lessonRevisitCount: null,
    currentStudyStreak: 1,
    activeToday: true,
    activeDaysLast7: 1,
    activeDaysLast30: 2,
    completedPracticeSessions: 0,
    completedOfficialExams: 0,
    masteredCategories: 0,
    masteredSigns: 0,
  },
  learningPriorities: [],
  strongestCategories: [],
  recommendations: [
    {
      key: "student_intelligence.recommendation.take_practice_exam",
      categoryCode: null,
      actionPath: "/exam",
      priority: 1,
    },
  ],
};

function responseAdapter(data: unknown): AxiosAdapter {
  return async (config) => {
    const response: AxiosResponse = {
      data,
      status: 200,
      statusText: "OK",
      headers: {},
      config,
      request: {},
    };
    return response;
  };
}

describe("student intelligence API contract", () => {
  afterEach(() => {
    client.defaults.adapter = originalAdapter;
  });

  it("preserves unavailable metrics as null", async () => {
    client.defaults.adapter = responseAdapter(validResponse);

    const result = await getStudentIntelligence();

    expect(result.examReadinessScore).toBeNull();
    expect(result.examAnalytics.averageScore).toBeNull();
    expect(result.timingAnalytics.averageAnswerTimeSeconds).toBeNull();
    expect(result.progressJourney.lessonRevisitCount).toBeNull();
  });

  it("rejects an incomplete analytics payload instead of manufacturing data", async () => {
    const incomplete: Record<string, unknown> = { ...validResponse };
    delete incomplete.timingAnalytics;
    client.defaults.adapter = responseAdapter(incomplete);

    await expect(getStudentIntelligence()).rejects.toThrow(
      "Student intelligence response is invalid",
    );
  });
});
