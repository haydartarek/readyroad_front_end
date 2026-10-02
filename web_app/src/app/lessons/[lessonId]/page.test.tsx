import LessonDetailPage from "./page";
import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import { getPublicLesson, getPublicLessons } from "@/lib/server/public-catalog";
import type { Lesson, LessonDetail } from "@/lib/types";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => { throw new Error("NEXT_NOT_FOUND"); }),
}));
jest.mock("@/lib/server/public-catalog", () => ({
  getPublicLesson: jest.fn(),
  getPublicLessons: jest.fn(),
}));
jest.mock("@/lib/server/request-locale", () => ({
  getRequestLocale: jest.fn(async () => "ar"),
}));
jest.mock("@/lib/server/articles", () => ({
  getRelatedPublicArticles: jest.fn(async () => []),
}));
jest.mock("./lesson-detail-client", () => ({ __esModule: true, default: () => null }));
jest.mock("./lesson-structured-data", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/lessons/lesson-keyword-support", () => ({
  __esModule: true, default: () => null,
}));
jest.mock("@/components/content/related-learning-articles", () => ({
  __esModule: true, default: () => null,
}));

const finalLesson = { id: 30, lessonCode: "les-29" } as Lesson;
const open = (lessonId: string) => LessonDetailPage({
  params: Promise.resolve({ lessonId }),
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getPublicLesson).mockResolvedValue(null);
  jest.mocked(getPublicLessons).mockResolvedValue([finalLesson]);
});

it("shows not-found for les-30 instead of mounting the client and requesting it again", async () => {
  const result = (await open("les-30")) as ReactElement;
  expect(() => (result.type as () => unknown)()).toThrow("NEXT_NOT_FOUND");
  expect(notFound).toHaveBeenCalledTimes(1);
});

it.each(["les-29", "30"])("preserves valid lesson %s", async (lessonId) => {
  jest.mocked(getPublicLesson).mockResolvedValue({ ...finalLesson, pages: [] } as LessonDetail);
  await expect(open(lessonId)).resolves.toBeDefined();
  expect(notFound).not.toHaveBeenCalled();
});

it.each(["les-29", "30"])("preserves client retry when valid lesson %s details are temporarily unavailable", async (lessonId) => {
  await expect(open(lessonId)).resolves.toBeDefined();
  expect(notFound).not.toHaveBeenCalled();
});

it("does not infer a missing lesson when the catalog is unavailable", async () => {
  jest.mocked(getPublicLessons).mockResolvedValue([]);
  await expect(open("les-30")).resolves.toBeDefined();
  expect(notFound).not.toHaveBeenCalled();
});
