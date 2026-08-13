import fs from "node:fs";
import path from "node:path";

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
