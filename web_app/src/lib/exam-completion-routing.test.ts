import fs from "node:fs";
import path from "node:path";
import { localizeHref } from "@/lib/i18n-routing";

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), "src", relativePath), "utf8");
}

describe("exam completion routing contracts", () => {
  it("keeps theory exam completion on its dedicated result", () => {
    expect(source("app/(protected)/exam/[id]/page.tsx")).toContain(
      "router.push(`/exam/results/${examId}`)",
    );
  });

  it("routes mixed and sign exams by their persisted result identifiers", () => {
    expect(source("app/(protected)/practice/random/page.tsx")).toContain(
      "router.push(`/exam/results?randomSignExamId=${res.sessionId}`)",
    );
    const signExam = source("app/traffic-signs/[signCode]/exam/[examNumber]/page.tsx");
    expect(signExam).toContain("submissionKeyRef.current");
    expect(signExam).toContain(
      "router.push(`/exam/results?signExamResultId=${res.resultId}`)",
    );
    expect(source("services/signQuizService.ts")).toContain(
      '"X-Idempotency-Key": idempotencyKey',
    );
  });

  it.each([
    ["en", "/exam/results/42"],
    ["ar", "/ar/exam/results/42"],
    ["nl", "/nl/exam/results/42"],
    ["fr", "/fr/exam/results/42"],
  ] as const)("preserves the %s locale on theory result routing", (locale, expected) => {
    expect(localizeHref("/exam/results/42", locale)).toBe(expected);
  });

  it.each([
    ["en", "/exam/results?randomSignExamId=9"],
    ["ar", "/ar/exam/results?randomSignExamId=9"],
    ["nl", "/nl/exam/results?randomSignExamId=9"],
    ["fr", "/fr/exam/results?randomSignExamId=9"],
  ] as const)("preserves the %s locale on shared sign-result routing", (locale, expected) => {
    expect(localizeHref("/exam/results?randomSignExamId=9", locale)).toBe(expected);
  });

  it("does not apply the compact exam-only controls to traffic sign practice", () => {
    for (const examPage of [
      "app/(protected)/exam/[id]/page.tsx",
      "app/(protected)/practice/random/page.tsx",
      "app/traffic-signs/[signCode]/exam/[examNumber]/page.tsx",
    ]) {
      expect(source(examPage)).toContain("compactInformationBar");
      expect(source(examPage)).toContain("compactOptionGap");
    }
    const practice = source("app/traffic-signs/[signCode]/practice/page.tsx");
    expect(practice).not.toContain("compactInformationBar");
    expect(practice).not.toContain("compactOptionGap");
  });
});
