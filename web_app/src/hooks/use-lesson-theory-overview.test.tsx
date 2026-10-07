import { act, renderHook, waitFor } from "@testing-library/react";
import apiClient from "@/lib/api";
import { useLessonTheoryOverview } from "./use-lesson-theory-overview";
import type { HomeLessonOverviewItem } from "@/lib/home-lessons-overview";
import { AxiosHeaders } from "axios";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("@/contexts/language-context", () => ({ useLanguage: () => ({ language: "en" }) }));

const overview = (count: number): HomeLessonOverviewItem[] => [{ id: 1, lessonCode: "les-0", displayOrder: 1,
  titleEn: "Intro", titleAr: "مقدمة", titleNl: "Intro", titleFr: "Intro",
  categories: [{ categoryCode: "TH08", nameEn: "Safety", nameAr: "السلامة", nameNl: "Veiligheid", nameFr: "Sécurité",
    questionCount: count, primary: true, displayOrder: 1 }] }];

test("focus refreshes additions and removals using the live catalogue", async () => {
  const get = jest.mocked(apiClient.get);
  const response = (count: number) => ({ data: overview(count), status: 200, statusText: "OK",
    headers: new AxiosHeaders(), config: { headers: new AxiosHeaders() } });
  get.mockResolvedValueOnce(response(2)).mockResolvedValueOnce(response(3))
    .mockResolvedValueOnce(response(1));
  const { result } = renderHook(() => useLessonTheoryOverview());
  await waitFor(() => expect(result.current[0]?.categories[0].questionCount).toBe(2));
  act(() => window.dispatchEvent(new Event("focus")));
  await waitFor(() => expect(result.current[0].categories[0].questionCount).toBe(3));
  act(() => window.dispatchEvent(new Event("focus")));
  await waitFor(() => expect(result.current[0].categories[0].questionCount).toBe(1));
});
