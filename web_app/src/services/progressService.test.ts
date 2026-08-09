import type { AxiosAdapter, AxiosResponse } from "axios";

import { apiClient } from "@/lib/api";
import { getRecentActivity } from "./progressService";

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
    headers: {},
    config,
    request: {},
  };
}

describe("recent learning activity", () => {
  beforeEach(() => {
    client.defaults.adapter = async (config) => {
      if (config.url === "/exams/simulations/history") {
        return response(config, {
          exams: [
            {
              examId: 1,
              startedAt: "2026-08-01T09:00:00Z",
              completedAt: "2026-08-01T09:30:00Z",
              status: "COMPLETED",
              totalQuestions: 50,
              scorePercentage: 86,
              passed: true,
            },
            {
              examId: 2,
              startedAt: "2026-08-02T09:00:00Z",
              completedAt: null,
              status: "IN_PROGRESS",
              totalQuestions: 50,
              scorePercentage: 0,
              passed: false,
            },
          ],
        });
      }

      if (config.url === "/sign-quiz/random-practice/history") {
        return response(config, {
          sessions: [
            {
              sessionId: 3,
              status: "COMPLETED",
              startedAt: "2026-08-03T09:00:00Z",
              completedAt: "2026-08-03T09:20:00Z",
              totalQuestions: 50,
              answeredCount: 50,
              scorePercentage: 80,
              passed: true,
            },
            {
              sessionId: 4,
              status: "IN_PROGRESS",
              startedAt: "2026-08-04T09:00:00Z",
              totalQuestions: 50,
              answeredCount: 3,
              scorePercentage: 0,
              passed: false,
            },
          ],
        });
      }

      if (config.url === "/sign-quiz/exam-history") {
        return response(config, {
          results: [
            {
              resultId: 5,
              signCode: "A1b",
              examNumber: 1,
              completedAt: "2026-08-05T09:20:00Z",
              totalQuestions: 10,
              answeredCount: 10,
              scorePercentage: 90,
              passed: true,
            },
          ],
        });
      }

      if (config.url === "/sign-quiz/practice/history") {
        return response(config, {
          sessions: [
            {
              sessionId: 6,
              signCode: "A1b",
              nameEn: "Dangerous bend",
              status: "COMPLETED",
              startedAt: "2026-08-06T09:00:00Z",
              completedAt: "2026-08-06T09:10:00Z",
              totalQuestions: 8,
              answeredCount: 8,
              scorePercentage: 75,
              passed: true,
            },
            {
              sessionId: 7,
              signCode: "B1",
              nameEn: "Give way",
              status: "IN_PROGRESS",
              startedAt: "2026-08-07T09:00:00Z",
              totalQuestions: 8,
              answeredCount: 2,
              scorePercentage: 0,
              passed: false,
            },
          ],
        });
      }

      throw new Error(`Unexpected endpoint: ${config.url}`);
    };
  });

  afterAll(() => {
    client.defaults.adapter = originalAdapter;
  });

  it("returns completed exam and sign activity only", async () => {
    const activities = await getRecentActivity(10);

    expect(activities).toHaveLength(4);
    expect(activities.map((activity) => activity.id)).toEqual([6, 5, 3, 1]);
    expect(activities.every((activity) => activity.status === "COMPLETED")).toBe(
      true,
    );
    expect(activities.find((activity) => activity.id === 1)?.link).toBe(
      "/exam/results/1",
    );
    expect(activities.map((activity) => activity.id)).not.toEqual(
      expect.arrayContaining([2, 4, 7]),
    );
  });
});
