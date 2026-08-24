import type { AxiosAdapter, AxiosResponse } from "axios";
import { apiClient } from "@/lib/api";
import { getTheoryQuestionCoverage } from "./progressService";

const client = apiClient.getInstance();
const originalAdapter = client.defaults.adapter;

function response(config: Parameters<AxiosAdapter>[0], data: unknown): AxiosResponse {
  return { data, status: 200, statusText: "OK", headers: {}, config, request: {} };
}

describe("theory question coverage contract", () => {
  afterAll(() => {
    client.defaults.adapter = originalAdapter;
  });

  it("loads locale-aware coverage without merging it with accuracy", async () => {
    client.defaults.adapter = async (config) => {
      expect(config.url).toBe("/users/me/progress/theory-coverage");
      return response(config, {
        languageCode: "fr",
        eligibleQuestions: 20,
        uniqueQuestionsSeen: 2,
        uniqueQuestionsAnswered: 2,
        unseenQuestions: 18,
        coveragePercentage: 10,
        timesPresented: 2,
        timesAnswered: 2,
        timesCorrect: 2,
        timesIncorrect: 0,
        accuracyPercentage: 100,
        confidenceState: "LOW",
        categories: [],
      });
    };

    const coverage = await getTheoryQuestionCoverage();

    expect(coverage.coveragePercentage).toBe(10);
    expect(coverage.accuracyPercentage).toBe(100);
    expect(coverage.confidenceState).toBe("LOW");
  });
});
