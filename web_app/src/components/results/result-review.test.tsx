import { render, screen } from "@testing-library/react";
import { ResultAnswerBlock } from "./result-review";

describe("ResultAnswerBlock", () => {
  it("keeps the option marker separate from the answer result state", () => {
    render(
      <ResultAnswerBlock label="Your answer" marker="A" tone="incorrect">
        A deliberately wrong answer
      </ResultAnswerBlock>,
    );

    const block = screen.getByTestId("result-answer-block");
    expect(block).toHaveAttribute("data-answer-marker", "A");
    expect(block).toHaveAttribute("data-answer-tone", "incorrect");
    expect(screen.getByTestId("result-answer-label")).toHaveClass(
      "text-red-800",
    );
    expect(screen.getByTestId("result-answer-body")).toHaveClass(
      "text-red-950",
      "dark:text-red-50",
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("A deliberately wrong answer")).toBeInTheDocument();
  });

  it("uses explicit readable foregrounds for neutral explanations", () => {
    render(
      <ResultAnswerBlock label="Explanation" tone="neutral">
        Long legal explanation
      </ResultAnswerBlock>,
    );

    expect(screen.getByTestId("result-answer-label")).toHaveClass(
      "text-foreground",
    );
    expect(screen.getByTestId("result-answer-body")).toHaveClass(
      "text-foreground",
    );
  });
});
