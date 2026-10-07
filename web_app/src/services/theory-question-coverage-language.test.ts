import { AxiosHeaders, type AxiosAdapter, type AxiosResponse } from "axios";
import { apiClient } from "@/lib/api";
import { getTheoryQuestionCoverage } from "./progressService";

const client = apiClient.getInstance();
const originalAdapter = client.defaults.adapter;

function response(
  config: Parameters<AxiosAdapter>[0],
  data: unknown,
): AxiosResponse {
  return {
    data,
    status: 200,
    statusText: "OK",
    headers: new AxiosHeaders(),
    config,
  };
}

afterEach(() => {
  client.defaults.adapter = originalAdapter;
});

describe("theory coverage language transport", () => {
  it("sends the active UI language as the coverage query parameter", async () => {
    client.defaults.adapter = async (config) => {
      expect(config.url).toBe("/users/me/progress/theory-coverage");
      expect(config.params).toEqual({ language: "ar" });

      return response(config, {
        languageCode: "ar",
        eligibleQuestions: 0,
        uniqueQuestionsSeen: 0,
        uniqueQuestionsAnswered: 0,
        unseenQuestions: 0,
        coveragePercentage: 0,
        timesPresented: 0,
        timesAnswered: 0,
        timesCorrect: 0,
        timesIncorrect: 0,
        accuracyPercentage: 0,
        confidenceState: "LOW",
        categories: [],
      });
    };

    const coverage = await getTheoryQuestionCoverage("ar");

    expect(coverage.languageCode).toBe("ar");
  });
});