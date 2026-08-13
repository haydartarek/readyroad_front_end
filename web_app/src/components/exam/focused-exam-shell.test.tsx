import { render, screen, within } from "@testing-library/react";

import { FocusedExamShell } from "./focused-exam-shell";

describe("FocusedExamShell", () => {
  it("renders one compact information bar below the question card", () => {
    render(
      <FocusedExamShell
        counter="2 / 50"
        difficultyLabel="Easy"
        timerPill={<span>15s</span>}
        progressPercent={4}
      >
        <p>Question content</p>
      </FocusedExamShell>,
    );

    const statusCard = screen.getByTestId("exam-status-card");
    const timerSlot = within(statusCard).getByTestId("exam-timer-slot");
    const mainCard = screen.getByTestId("exam-main-card");

    expect(screen.queryByTestId("exam-shell-header")).not.toBeInTheDocument();
    expect(timerSlot).toHaveTextContent("15s");
    expect(within(statusCard).getByText("2 / 50")).toBeVisible();
    expect(within(statusCard).getByText("Easy")).toBeVisible();
    expect(within(statusCard).getByText("4%")).toBeVisible();
    expect(screen.getAllByText("15s")).toHaveLength(1);
    expect(mainCard.compareDocumentPosition(statusCard)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.getByTestId("exam-question-progress")).toHaveStyle({
      width: "4%",
    });
  });

  it("removes the timer column for untimed practice", () => {
    render(
      <FocusedExamShell
        counter="1 / 10"
        difficultyLabel="Medium"
        progressPercent={10}
        afterCard={<button type="button">End exam</button>}
      >
        <p>Question content</p>
      </FocusedExamShell>,
    );

    expect(screen.getByTestId("exam-status-card")).toBeVisible();
    expect(screen.queryByTestId("exam-timer-slot")).not.toBeInTheDocument();
    expect(screen.getByText("1 / 10")).toBeVisible();
    expect(screen.getByText("Question content")).toBeVisible();
    expect(screen.getByRole("button", { name: "End exam" })).toBeVisible();
  });
});
