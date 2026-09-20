import {
  canSubmitTheoryExam,
  isPreviewBoundary,
  resolveVisibleResumeIndex,
  resolvePreviewOptionState,
} from "./theory-exam-access";

describe("theory exam preview client contract", () => {
  test("question eleven resume clamps safely while only ten preview questions are visible", () => {
    expect(resolveVisibleResumeIndex(11, 10)).toBe(9);
  });

  test("normal preview resume resolves to the server question order", () => {
    expect(resolveVisibleResumeIndex(6, 10)).toBe(5);
  });

  test("question ten is the preview boundary", () => {
    expect(
      isPreviewBoundary({
        accessMode: "PREVIEW",
        freeQuestionLimit: 10,
        questionOrder: 10,
      }),
    ).toBe(true);
  });

  test("ten finalized preview questions can never submit a fifty question exam", () => {
    expect(
      canSubmitTheoryExam({
        finalizedCount: 10,
        totalQuestions: 50,
        accessState: "FREE_LIMIT_REACHED",
      }),
    ).toBe(false);
  });

  test("a full fifty-question attempt can submit after all fifty are finalized", () => {
    expect(
      canSubmitTheoryExam({
        finalizedCount: 50,
        totalQuestions: 50,
        accessState: "FULL_ACTIVE",
      }),
    ).toBe(true);
  });

  test("preview feedback marks the correct option green", () => {
    expect(
      resolvePreviewOptionState({
        optionId: 22,
        selectedOptionId: 11,
        correctOptionId: 22,
        hasFeedback: true,
      }),
    ).toBe("correct");
  });

  test("preview feedback marks a wrong selected option incorrect", () => {
    expect(
      resolvePreviewOptionState({
        optionId: 11,
        selectedOptionId: 11,
        correctOptionId: 22,
        hasFeedback: true,
      }),
    ).toBe("incorrect");
  });

  test("preview feedback makes unrelated options neutral", () => {
    expect(
      resolvePreviewOptionState({
        optionId: 33,
        selectedOptionId: 11,
        correctOptionId: 22,
        hasFeedback: true,
      }),
    ).toBe("neutral");
  });

  test("full/blind mode keeps the normal selected state without feedback", () => {
    expect(
      resolvePreviewOptionState({
        optionId: 11,
        selectedOptionId: 11,
        correctOptionId: undefined,
        hasFeedback: false,
      }),
    ).toBe("selected");
  });
});