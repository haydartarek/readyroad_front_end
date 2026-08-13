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

  it("keeps media and question content in one responsive grid", () => {
    render(
      <FocusedQuestionCard
        media={<div data-testid="question-media">Image</div>}
        difficultyBadge={<span>Easy</span>}
        title="Question"
        options={[]}
      />,
    );

    const media = screen.getByTestId("question-media");
    const content = screen.getByTestId("exam-question-content");
    expect(screen.getByTestId("exam-question-layout")).toHaveClass("grid");
    expect(screen.getByText("Easy").parentElement).toHaveClass("hidden");
    expect(media.compareDocumentPosition(content)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("keeps all three long answers readable without truncation", () => {
    const longAnswer =
      "The driver must reduce speed and continue only after checking every approaching road user.";
    render(
      <FocusedQuestionCard
        title="A longer question that must remain fully readable"
        options={["First answer", "Second answer", longAnswer].map(
          (text, index) => ({
            key: index,
            text,
            selected: false,
            onSelect: jest.fn(),
          }),
        )}
      />,
    );

    expect(screen.getAllByTestId("exam-option-card")).toHaveLength(3);
    expect(screen.getByText("C")).toBeVisible();
    expect(screen.getByText(longAnswer)).toHaveClass("min-w-0", "break-words");
    expect(screen.getByText(longAnswer)).not.toHaveClass(
      "truncate",
      "line-clamp-1",
      "line-clamp-2",
    );
  });

  it("slightly reduces only the external answer gap for real exams", () => {
    render(
      <FocusedQuestionCard
        title="Question"
        compactOptionGap
        options={[1, 2].map((key) => ({
          key,
          text: `Answer ${key}`,
          selected: false,
          onSelect: jest.fn(),
        }))}
      />,
    );

    expect(screen.getAllByTestId("exam-option-card")[0].parentElement).toHaveClass(
      "space-y-1.5",
    );
    expect(screen.getAllByTestId("exam-option-card")[0]).toHaveClass(
      "min-h-12",
      "py-3",
    );
  });
});
