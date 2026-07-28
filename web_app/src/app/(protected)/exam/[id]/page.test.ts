import { normalizeExamData } from "./page";

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
  });
});
