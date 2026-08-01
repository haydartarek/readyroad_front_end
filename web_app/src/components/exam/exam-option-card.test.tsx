import { fireEvent, render, screen } from "@testing-library/react";
import { ExamOptionCard, getExamOptionLabel } from "./exam-option-card";

describe("ExamOptionCard", () => {
  it("maps option indexes to A, B, and C without creating an unused option", () => {
    const onSelect = jest.fn();
    const { rerender } = render(
      <ExamOptionCard index={0} text="First answer" onSelect={onSelect} />,
    );

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.queryByText("C")).not.toBeInTheDocument();

    rerender(
      <ExamOptionCard index={1} text="Second answer" onSelect={onSelect} />,
    );
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(getExamOptionLabel(2)).toBe("C");
  });

  it("keeps identity and answer-result state separate", () => {
    const onSelect = jest.fn();
    render(
      <ExamOptionCard
        index={0}
        text="An incorrect first answer"
        state="incorrect"
        onSelect={onSelect}
      />,
    );

    const option = screen.getByTestId("exam-option-card");
    expect(option).toHaveAttribute("data-option-label", "A");
    expect(option).toHaveAttribute("data-option-state", "incorrect");
    fireEvent.click(option);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
