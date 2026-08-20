import { render, screen } from "@testing-library/react";

import { TheoryTimeoutWidget } from "./page";

jest.mock("@/components/localized-link", () => {
  return function MockLocalizedLink({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return <a href={href}>{children}</a>;
  };
});

const t = (key: string) => key;

describe("theory timeout dashboard analysis", () => {
  it("renders persisted completed-theory timeout evidence and a real review route", () => {
    render(
      <TheoryTimeoutWidget
        language="ar"
        t={t}
        analysis={{
          totalTimeouts: 1,
          items: [
            {
              examId: 77,
              questionId: 12,
              questionTextEn: "English question",
              questionTextAr: "السؤال التاريخي",
              categoryCode: "PRIORITY",
              categoryNameEn: "Priority",
              categoryNameAr: "الأولوية",
              difficulty: "EASY",
              timedOutAt: "2026-08-20T12:00:00Z",
              reviewPath: "/exam/results/77",
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId("theory-timeout-analysis")).toBeVisible();
    expect(screen.getByText("السؤال التاريخي")).toBeVisible();
    expect(screen.getByText(/الأولوية/)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "dashboard.theory_timeouts_review" }),
    ).toHaveAttribute("href", "/exam/results/77");
  });

  it("does not show an empty or misleading section", () => {
    const { container } = render(
      <TheoryTimeoutWidget
        language="en"
        t={t}
        analysis={{ totalTimeouts: 0, items: [] }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
