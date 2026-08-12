import { render, screen, within } from "@testing-library/react";

import { FocusedExamShell } from "./focused-exam-shell";

describe("FocusedExamShell", () => {
  it("renders the localized header and keeps timing below the main card", () => {
    render(
      <FocusedExamShell
        title="Theory Exam Simulator"
        counter="Question 2 of 50"
        backControl={<button type="button">Back</button>}
        timerPill={<span>15s</span>}
        progressLabel="Question 2 of 50"
        progressPercent={4}
        timerProgressPercent={80}
      >
        <p>Question content</p>
      </FocusedExamShell>,
    );

    const statusCard = screen.getByTestId("exam-status-card");
    const timerSlot = within(statusCard).getByTestId("exam-timer-slot");
    const mainCard = screen.getByTestId("exam-main-card");

    expect(screen.getByTestId("exam-shell-header")).toHaveTextContent(
      "Theory Exam Simulator",
    );
    expect(timerSlot).toHaveTextContent("15s");
    expect(within(statusCard).getByText("Question 2 of 50")).toBeVisible();
    expect(screen.getAllByText("15s")).toHaveLength(1);
    expect(mainCard.compareDocumentPosition(statusCard)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.getByTestId("exam-timer-progress")).toHaveStyle({
      width: "80%",
    });
  });

  it("supports question-owned status and a separate end action", () => {
    render(
      <FocusedExamShell
        title="Theory Exam Simulator"
        counter="Question 1 of 50"
        showStatusCard={false}
        afterCard={<button type="button">End exam</button>}
      >
        <p>Question content</p>
      </FocusedExamShell>,
    );

    expect(screen.queryByTestId("exam-status-card")).not.toBeInTheDocument();
    expect(screen.getByText("Question content")).toBeVisible();
    expect(screen.getByRole("button", { name: "End exam" })).toBeVisible();
  });
});
