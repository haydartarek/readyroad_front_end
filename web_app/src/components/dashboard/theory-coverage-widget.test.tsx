import { render, screen } from "@testing-library/react";
import { TheoryCoverageWidget } from "./theory-coverage-widget";

describe("TheoryCoverageWidget", () => {
  it("keeps coverage, accuracy, and evidence confidence separate", () => {
    render(
      <TheoryCoverageWidget
        t={(key) => key}
        coverage={{
          languageCode: "ar",
          eligibleQuestions: 20,
          uniqueQuestionsSeen: 2,
          uniqueQuestionsAnswered: 2,
          unseenQuestions: 18,
          coveragePercentage: 10,
          timesPresented: 2,
          timesAnswered: 2,
          timesCorrect: 2,
          timesIncorrect: 0,
          accuracyPercentage: 100,
          confidenceState: "LOW",
          categories: [
            {
              categoryId: 1,
              categoryCode: "TH01",
              categoryName: "الأولوية والتقاطعات",
              eligibleQuestions: 20,
              uniqueQuestionsSeen: 2,
              uniqueQuestionsAnswered: 2,
              unseenQuestions: 18,
              coveragePercentage: 10,
              timesPresented: 2,
              timesAnswered: 2,
              timesCorrect: 2,
              timesIncorrect: 0,
              accuracyPercentage: 100,
              confidenceState: "LOW",
            },
          ],
        }}
      />,
    );

    expect(screen.getAllByText("10%")).not.toHaveLength(0);
    expect(screen.getAllByText("100%")).not.toHaveLength(0);
    expect(
      screen.getByText("dashboard.theory_coverage.confidence_low"),
    ).toBeInTheDocument();
    expect(screen.getByText("الأولوية والتقاطعات")).toBeInTheDocument();
  });
});
