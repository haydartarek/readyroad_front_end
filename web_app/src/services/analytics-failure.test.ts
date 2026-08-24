import { AxiosError, type AxiosAdapter, type AxiosResponse } from "axios";

import { apiClient } from "@/lib/api";
import { getWeakAreas } from "./analyticsService";
import {
  getOverallProgress,
  getStudentIntelligence,
  getProgressByCategory,
  getRecentActivity,
  getTheoryQuestionCoverage,
} from "./progressService";

const client = apiClient.getInstance();
const originalAdapter = client.defaults.adapter;

const failingAdapter: AxiosAdapter = async (config) => {
  const response: AxiosResponse = {
    data: { message: "failed" },
    status: 500,
    statusText: "Internal Server Error",
    headers: {},
    config,
    request: {},
  };

  throw new AxiosError(
    response.statusText,
    "ERR_BAD_RESPONSE",
    config,
    {},
    response,
  );
};

describe("analytics services preserve API failure state", () => {
  beforeEach(() => {
    client.defaults.adapter = failingAdapter;
  });

  afterAll(() => {
    client.defaults.adapter = originalAdapter;
  });

  it.each([
    ["overall progress", () => getOverallProgress()],
    ["student intelligence", () => getStudentIntelligence()],
    ["category progress", () => getProgressByCategory()],
    ["recent activity", () => getRecentActivity()],
    ["theory coverage", () => getTheoryQuestionCoverage()],
    ["weak areas", () => getWeakAreas()],
  ])("does not convert %s failures into zero or empty data", async (_, load) => {
    await expect(load()).rejects.toBeInstanceOf(AxiosError);
  });
});
