import { render, screen } from "@testing-library/react";
import { HomeLessonsOverview } from "./home-lessons-overview";
import { translateMessage } from "@/lib/messages";
import type { HomeLessonOverviewItem } from "@/lib/home-lessons-overview";

let mockLanguage: "en" | "ar" | "nl" | "fr" = "en";
jest.mock("@/contexts/language-context", () => ({ useLanguage: () => ({ language: mockLanguage,
  t: (key: string, params?: Record<string, string | number>) => translateMessage(mockLanguage, key, params) }) }));
jest.mock("@/hooks/use-lesson-theory-overview", () => ({
  useLessonTheoryOverview: (initial: HomeLessonOverviewItem[]) => initial,
}));
jest.mock("@/components/localized-link", () => ({ __esModule: true,
  default: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a> }));

const lesson: HomeLessonOverviewItem = { id: 32, lessonCode: "les-31", displayOrder: 32,
  titleEn: "Car mechanics", titleAr: "تقنيات المركبة", titleNl: "Autotechniek", titleFr: "Technique automobile",
  categories: [{ categoryCode: "TH07", nameEn: "Technical safety", nameAr: "السلامة التقنية",
    nameNl: "Technische veiligheid", nameFr: "Sécurité technique", questionCount: 67, primary: true, displayOrder: 1 }] };

test.each(["en", "ar", "nl", "fr"] as const)("%s lesson row has separate reading and category exam actions", (language) => {
  mockLanguage = language;
  const { container } = render(<HomeLessonsOverview lessons={[lesson]} />);
  const categoryName = { en: "Technical safety", ar: "السلامة التقنية", nl: "Technische veiligheid", fr: "Sécurité technique" }[language];
  expect(screen.getByRole("link", { name: translateMessage(language, "category_exam.start_named", { category: categoryName }) }))
    .toHaveAttribute("href", "/exam?category=TH07");
  expect(screen.getByRole("link", { name: translateMessage(language, "lessons.read_lesson") }))
    .toHaveAttribute("href", "/lessons/les-31");
  expect(container.querySelector("a a")).toBeNull();
});

test("the question count reflects refreshed backend data without a fixed number", () => {
  mockLanguage = "en";
  const { rerender } = render(<HomeLessonsOverview lessons={[lesson]} />);
  expect(screen.getByText("67 questions")).toBeInTheDocument();
  rerender(<HomeLessonsOverview lessons={[{ ...lesson, categories: [{ ...lesson.categories[0], questionCount: 68 }] }]} />);
  expect(screen.getByText("68 questions")).toBeInTheDocument();
  expect(screen.queryByText("67 questions")).not.toBeInTheDocument();
});
