import { render, screen } from "@testing-library/react";
import { FocusedQuestionCard } from "./focused-question-card";

describe("FocusedQuestionCard", () => {
  it("centers the question and renders only the available A/B options", () => {
    render(
      <FocusedQuestionCard
        title="What should the driver do?"
        options={[
          {
            key: 1,
            text: "First answer",
            selected: false,
            onSelect: jest.fn(),
          },
          {
            key: 2,
            text: "Second answer",
            selected: false,
            onSelect: jest.fn(),
          },
        ]}
      />,
    );

    expect(screen.getByTestId("exam-question-title")).toHaveClass(
      "text-center",
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.queryByText("C")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("exam-option-card")).toHaveLength(2);
  });
});
