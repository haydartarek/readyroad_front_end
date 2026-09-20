import { fireEvent, render, screen } from "@testing-library/react";

import { FreeExamPaywall } from "./free-exam-paywall";
import { translateMessage } from "@/lib/messages";

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: { username: "preview-user" },
    isAuthenticated: true,
  }),
}));

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({
    language: "en",
    isRTL: false,
    t: (
      key: string,
      params?: Record<string, string | number>,
    ) => translateMessage("en", key, params),
  }),
}));

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
  }) => (open ? <div>{children}</div> : null),

  DialogContent: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div>{children}</div>,

  DialogHeader: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div>{children}</div>,

  DialogTitle: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <h2>{children}</h2>,

  DialogDescription: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <p>{children}</p>,
}));

test("weekly plan is recommended and selected by default", () => {
  render(
    <FreeExamPaywall
      open
      examId={42}
      onOpenChange={jest.fn()}
    />,
  );

  expect(
    screen.getByText("Recommended"),
  ).toBeVisible();

  expect(
    screen.getByText("€2.99"),
  ).toBeVisible();

  expect(
    screen.getByText("€6.99"),
  ).toBeVisible();

  expect(
    screen.getByText("€14.99"),
  ).toBeVisible();

  expect(
    screen.getByTestId(
      "exam-paywall-RIJVIA_1_WEEK",
    ),
  ).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("the learner can change the selected plan", () => {
  render(
    <FreeExamPaywall
      open
      examId={42}
      onOpenChange={jest.fn()}
    />,
  );

  fireEvent.click(
    screen.getByTestId(
      "exam-paywall-RIJVIA_3_DAYS",
    ),
  );

  expect(
    screen.getByTestId(
      "exam-paywall-RIJVIA_3_DAYS",
    ),
  ).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  expect(
    screen.getByTestId(
      "exam-paywall-RIJVIA_1_WEEK",
    ),
  ).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});