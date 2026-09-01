import fs from "node:fs";
import path from "node:path";
import { localizedCategoryName, type CategoryPerformance } from "./admin-learning";

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), "src", relativePath), "utf8");
}

describe("admin learning UI contracts", () => {
  it("keeps student and exam drill-down links with server pagination", () => {
    const analytics = source("app/admin/analytics/page.tsx");
    expect(analytics).toContain("/admin/learning/exams");
    expect(analytics).toContain("/admin/learning/users");
    expect(analytics).toContain("setExamPage");
    expect(analytics).toContain("/learning/exams/${exam.examType}/${exam.examId}");
  });

  it("loads each learning section lazily and keeps untracked activities separate", () => {
    const profile = source("app/admin/users/[id]/learning/page.tsx");
    expect(profile).toContain('"signStudy", "videos"');
    expect(profile).toContain("/activity-availability");
    expect(profile).toContain("trafficSignStudyTrackingAvailable");
    expect(profile).toContain("videoTrackingAvailable");
  });

  it("supports the historical answer collections used by all three exam types", () => {
    const detail = source("app/admin/users/[id]/learning/exams/[examType]/[examId]/page.tsx");
    expect(detail).toContain("result.allAnswers ?? result.questionResults ?? result.questions");
    expect(detail).toContain('"selectedOptionId", "selectedChoiceId"');
    expect(detail).toContain('"correctOptionId", "correctChoiceId"');
  });

  it.each(["ar", "en", "fr", "nl"])("provides complete %s learning labels", (locale) => {
    const messages = JSON.parse(source(`messages/${locale}.json`)) as Record<string, string>;
    expect(messages["admin.learning.section.signStudy"]).toBeTruthy();
    expect(messages["admin.learning.section.videos"]).toBeTruthy();
    expect(messages["admin.learning.sign_study_reason"]).toBeTruthy();
    expect(messages["admin.learning.video_reason"]).toBeTruthy();
    expect(messages["admin.learning.pages_read"]).toBeTruthy();
    expect(messages["admin.learning.attempts"]).toBeTruthy();
    expect(messages["admin.learning.status_not_started"]).toBeTruthy();
  });

  it("uses the administrator's current locale for category names", () => {
    const category: CategoryPerformance = {
      categoryId: 1,
      categoryCode: "A",
      nameEn: "English",
      nameNl: "Nederlands",
      nameFr: "Français",
      nameAr: "العربية",
      questionsAttempted: 5,
      correctAnswers: 4,
      accuracy: 80,
      lastPracticedAt: null,
    };

    expect(localizedCategoryName(category, "en")).toBe("English");
    expect(localizedCategoryName(category, "nl")).toBe("Nederlands");
    expect(localizedCategoryName(category, "fr")).toBe("Français");
    expect(localizedCategoryName(category, "ar")).toBe("العربية");
  });

  it("does not use the internal category code as a visible name", () => {
    const category: CategoryPerformance = {
      categoryId: 1,
      categoryCode: "TH01",
      nameEn: "",
      nameNl: "",
      nameFr: "",
      nameAr: "",
      questionsAttempted: 0,
      correctAnswers: 0,
      accuracy: 0,
      lastPracticedAt: null,
    };

    expect(localizedCategoryName(category, "en")).toBe("");
  });
});
