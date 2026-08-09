import { render, screen, within } from "@testing-library/react";

import { FocusedExamShell } from "./focused-exam-shell";

describe("FocusedExamShell", () => {
  it("keeps the theoretical exam timer inside the progress status card", () => {
    render(
      <FocusedExamShell
        backControl={<button type="button">Back</button>}
        timerPill={<span>15s</span>}
        progressLabel="Question 2 of 50"
        progressPercent={4}
        integratedStatusRow
      >
        <p>Question content</p>
      </FocusedExamShell>,
    );

    const statusCard = screen.getByTestId("exam-status-card");
    const timerSlot = within(statusCard).getByTestId("exam-timer-slot");

    expect(timerSlot).toHaveTextContent("15s");
    expect(within(statusCard).getByText("Question 2 of 50")).toBeVisible();
    expect(screen.getAllByText("15s")).toHaveLength(1);
  });
});
