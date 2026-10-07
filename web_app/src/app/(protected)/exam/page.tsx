import CategoryExamMode from "@/components/exam/category-exam-mode";
import TheoryExamEntry from "@/components/exam/theory-exam-entry";

const CATEGORY_CODE_PATTERN = /^TH(?:0[1-9]|10)$/;

type ExamSearchParams = {
  category?: string | string[];
};

export default async function TheoryExamPage({
  searchParams,
}: {
  searchParams: Promise<ExamSearchParams>;
}) {
  const params = await searchParams;

  const rawCategoryCode = Array.isArray(params.category)
    ? params.category[0]
    : params.category;

  const categoryCode =
    typeof rawCategoryCode === "string"
      ? rawCategoryCode.trim().toUpperCase()
      : "";

  if (CATEGORY_CODE_PATTERN.test(categoryCode)) {
    return <CategoryExamMode categoryCode={categoryCode} />;
  }

  return <TheoryExamEntry />;
}