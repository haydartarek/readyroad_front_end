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

  it("renders the exam status directly after the media", () => {
    render(
      <FocusedQuestionCard
        media={<div data-testid="question-media">Image</div>}
        statusAfterMedia={<div data-testid="question-status">15s</div>}
        title="Question"
        options={[]}
      />,
    );

    const media = screen.getByTestId("question-media");
    const status = screen.getByTestId("question-status");
    expect(media.compareDocumentPosition(status)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
