import TheoryExamPage from "./page";
import CategoryExamMode from "@/components/exam/category-exam-mode";
import TheoryExamEntry from "@/components/exam/theory-exam-entry";

test("new managed theory categories use the existing category exam screen", async () => {
  const screen = await TheoryExamPage({ searchParams: Promise.resolve({ category: "TH11" }) });
  expect(screen.type).toBe(CategoryExamMode);
  expect(screen.props.categoryCode).toBe("TH11");
});

test("an unrelated category code keeps the theory exam entry", async () => {
  const screen = await TheoryExamPage({ searchParams: Promise.resolve({ category: "OTHER" }) });
  expect(screen.type).toBe(TheoryExamEntry);
});
