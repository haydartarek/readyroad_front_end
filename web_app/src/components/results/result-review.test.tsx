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
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("A deliberately wrong answer")).toBeInTheDocument();
  });
});
