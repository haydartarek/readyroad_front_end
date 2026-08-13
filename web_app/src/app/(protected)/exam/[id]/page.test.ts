import { resolveTimedAttemptStep } from "@/lib/attempt-lifecycle";
import { normalizeExamData } from "./page";
import fs from "node:fs";
import path from "node:path";

describe("persistent exam question images", () => {
  it("preserves the backend image URL for the exam renderer", () => {
    const exam = normalizeExamData({
      examId: 42,
      startedAt: "2026-07-28T00:00:00Z",
      expiresAt: "2026-07-28T00:30:00Z",
      questions: [
        {
          questionId: 7,
          questionOrder: 1,
          questionTextEn: "Which sign is shown?",
          questionTextAr: "ما العلامة الظاهرة؟",
          questionTextNl: "Welk bord wordt getoond?",
          questionTextFr: "Quel panneau est affiché ?",
          imageUrl: "/images/quiz/priority-question.png",
          difficultyLevel: "MEDIUM",
          options: [
            {
              optionId: 11,
              optionTextEn: "Priority",
              optionTextAr: "الأولوية",
              optionTextNl: "Voorrang",
              optionTextFr: "Priorité",
            },
          ],
        },
      ],
    });

    expect(exam.questions[0].imageUrl).toBe(
      "/images/quiz/priority-question.png",
    );
    expect(exam.questions[0].difficultyLevel).toBe("MEDIUM");
  });
});

describe("theoretical exam attempt progression", () => {
  it("omits the old exam title block and returns abandoned attempts to exams", () => {
    const source = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");
    expect(source).not.toContain('title={t("nav.exam")}');
    expect(source).toContain("counter={questionCounter}");
    expect(source).not.toContain('abandonExam("/practice")');
    expect(source).toContain('pendingNavigation.current = "/exam"');
  });

  it("abandons after three consecutive timed-out unanswered questions", () => {
    const first = resolveTimedAttemptStep({
      reason: "timeout",
      isCurrentAnswered: false,
      isLastQuestion: false,
      answeredCount: 0,
      totalQuestions: 50,
      consecutiveUnanswered: 0,
    });
    const second = resolveTimedAttemptStep({
      reason: "timeout",
      isCurrentAnswered: false,
      isLastQuestion: false,
      answeredCount: 0,
      totalQuestions: 50,
      consecutiveUnanswered: first.consecutiveUnanswered,
    });
    const third = resolveTimedAttemptStep({
      reason: "timeout",
      isCurrentAnswered: false,
      isLastQuestion: false,
      answeredCount: 0,
      totalQuestions: 50,
      consecutiveUnanswered: second.consecutiveUnanswered,
    });

    expect(first.action).toBe("advance");
    expect(second.action).toBe("advance");
    expect(third.action).toBe("abandon");
  });

  it("does not submit an exam with unanswered questions", () => {
    expect(
      resolveTimedAttemptStep({
        reason: "manual",
        isCurrentAnswered: true,
        isLastQuestion: true,
        answeredCount: 49,
        totalQuestions: 50,
        consecutiveUnanswered: 0,
      }).action,
    ).toBe("abandon");
  });

  it("submits only after all required questions are answered", () => {
    expect(
      resolveTimedAttemptStep({
        reason: "manual",
        isCurrentAnswered: true,
        isLastQuestion: true,
        answeredCount: 50,
        totalQuestions: 50,
        consecutiveUnanswered: 0,
      }).action,
    ).toBe("submit");
  });
});
