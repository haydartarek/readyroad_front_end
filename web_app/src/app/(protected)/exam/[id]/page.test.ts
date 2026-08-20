import { resolveTheoryTimedAttemptStep } from "@/lib/attempt-lifecycle";
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

  it("abandons only after 60 continuous seconds of unanswered time", () => {
    const first = resolveTheoryTimedAttemptStep({
      reason: "timeout",
      isLastQuestion: false,
      finalizedCount: 1,
      totalQuestions: 50,
      continuousInactivitySeconds: 0,
    });
    const second = resolveTheoryTimedAttemptStep({
      reason: "timeout",
      isLastQuestion: false,
      finalizedCount: 2,
      totalQuestions: 50,
      continuousInactivitySeconds: first.continuousInactivitySeconds,
    });
    const third = resolveTheoryTimedAttemptStep({
      reason: "timeout",
      isLastQuestion: false,
      finalizedCount: 3,
      totalQuestions: 50,
      continuousInactivitySeconds: second.continuousInactivitySeconds,
    });
    const fourth = resolveTheoryTimedAttemptStep({
      reason: "timeout",
      isLastQuestion: false,
      finalizedCount: 4,
      totalQuestions: 50,
      continuousInactivitySeconds: third.continuousInactivitySeconds,
    });

    expect(first.action).toBe("advance");
    expect(second.action).toBe("advance");
    expect(third.action).toBe("advance");
    expect(fourth.action).toBe("abandon");
    expect(fourth.continuousInactivitySeconds).toBe(60);
  });

  it("resets the continuous inactivity window after a persisted answer", () => {
    const decision = resolveTheoryTimedAttemptStep({
      reason: "answered",
      isLastQuestion: false,
      finalizedCount: 4,
      totalQuestions: 50,
      continuousInactivitySeconds: 45,
    });

    expect(decision.action).toBe("advance");
    expect(decision.continuousInactivitySeconds).toBe(0);
  });

  it("submits a completed exam whose final question timed out", () => {
    expect(
      resolveTheoryTimedAttemptStep({
        reason: "timeout",
        isLastQuestion: true,
        finalizedCount: 50,
        totalQuestions: 50,
        continuousInactivitySeconds: 15,
      }).action,
    ).toBe("submit");
  });

  it("keeps the mobile counter dynamic and tied to the visible index", () => {
    const source = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");
    expect(source).toContain("currentQuestionIndex + 1");
    expect(source).toContain("examData.questions.length");
    expect(source).toContain("transitionInFlightRef.current");
  });
});
