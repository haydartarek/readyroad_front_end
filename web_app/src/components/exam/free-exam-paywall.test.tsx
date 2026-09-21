import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { FreeExamPaywall } from "./free-exam-paywall";
import { translateMessage } from "@/lib/messages";
import {
  checkoutRequestId,
  createCheckout,
  navigateToCheckout,
  rememberExamCheckoutResume,
} from "@/services/paymentService";

let mockLanguage: "en" | "ar" = "en";
let mockIsRTL = false;

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: { username: "preview-user" },
    isAuthenticated: true,
  }),
}));

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({
    language: mockLanguage,
    isRTL: mockIsRTL,
    t: (
      key: string,
      params?: Record<string, string | number>,
    ) => translateMessage(mockLanguage, key, params),
  }),
}));

jest.mock("@/services/paymentService", () => ({
  PAYMENTS_ENABLED: true,
  checkoutRequestId: jest.fn(),
  createCheckout: jest.fn(),
  forgetCheckoutRequest: jest.fn(),
  navigateToCheckout: jest.fn(),
  rememberExamCheckoutResume: jest.fn(),
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
    dir,
    className,
  }: {
    children: React.ReactNode;
    dir?: "rtl" | "ltr";
    className?: string;
  }) => (
    <div
      data-testid="dialog-content"
      dir={dir}
      className={className}
    >
      {children}
    </div>
  ),

  DialogHeader: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div
      data-testid="dialog-header"
      className={className}
    >
      {children}
    </div>
  ),

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

const PURCHASE_ID =
  "1c0c5a1b-9ab6-4f59-a9ac-31a87910fc64";

const CHECKOUT_URL =
  "https://checkout.stripe.com/test-session";

const EURO = "\u20AC";

beforeEach(() => {
  mockLanguage = "en";
  mockIsRTL = false;

  jest.clearAllMocks();

  jest.mocked(checkoutRequestId)
    .mockReturnValue("request-id");

  jest.mocked(createCheckout)
    .mockResolvedValue({
      purchaseId: PURCHASE_ID,
      checkoutUrl: CHECKOUT_URL,
    });
});

test("weekly plan is recommended and selected by default", () => {
  render(
    <FreeExamPaywall
      open
      examId={42}
      totalQuestions={50}
      completedQuestions={10}
      onOpenChange={jest.fn()}
    />,
  );

  expect(
    screen.getByText("Recommended"),
  ).toBeVisible();

  expect(
    screen.getByTestId(
      "exam-paywall-RIJVIA_3_DAYS",
    ),
  ).toHaveTextContent(`${EURO}2.99`);

  expect(
    screen.getByTestId(
      "exam-paywall-RIJVIA_1_WEEK",
    ),
  ).toHaveTextContent(`${EURO}6.99`);

  expect(
    screen.getByTestId(
      "exam-paywall-RIJVIA_4_WEEKS",
    ),
  ).toHaveTextContent(`${EURO}14.99`);

  expect(
    screen.getByText(
      "A good amount of time for regular practice and review",
    ),
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

test("mobile paywall keeps the plans compact while preserving desktop cards", () => {
  render(
    <FreeExamPaywall
      open
      examId={42}
      totalQuestions={50}
      completedQuestions={10}
      onOpenChange={jest.fn()}
    />,
  );

  expect(
    screen.getByTestId("dialog-content"),
  ).toHaveClass(
    "max-h-[calc(100dvh-0.75rem)]",
    "gap-2",
    "p-3",
  );

  expect(
    screen.getByTestId(
      "exam-paywall-RIJVIA_1_WEEK",
    ),
  ).toHaveClass(
    "grid",
    "min-h-0",
    "grid-cols-[1fr_auto]",
    "py-2",
    "md:flex",
    "md:min-h-[132px]",
    "md:py-4",
  );

  expect(
    screen.getByText(
      "A good amount of time for regular practice and review",
    ),
  ).toHaveClass(
    "hidden",
    "md:block",
  );
});

test("Arabic paywall uses RTL and right-aligned content", () => {
  mockLanguage = "ar";
  mockIsRTL = true;

  render(
    <FreeExamPaywall
      open
      examId={42}
      totalQuestions={50}
      completedQuestions={10}
      onOpenChange={jest.fn()}
    />,
  );

  expect(
    screen.getByTestId("dialog-content"),
  ).toHaveAttribute("dir", "rtl");

  expect(
    screen.getByTestId("dialog-header"),
  ).toHaveClass(
    "text-right",
    "sm:text-right",
  );

  expect(
    screen.getByRole("heading", {
      name: translateMessage(
        "ar",
        "exam.paywall.title",
      ),
    }),
  ).toBeVisible();

  expect(
    screen.getByText(
      translateMessage(
        "ar",
        "home.pricing.tagline.RIJVIA_1_WEEK",
      ),
    ),
  ).toBeVisible();
});

test("progress uses the actual completed and total question counts", () => {
  render(
    <FreeExamPaywall
      open
      examId={42}
      totalQuestions={40}
      completedQuestions={8}
      onOpenChange={jest.fn()}
    />,
  );

  expect(
    screen.getByText("8 / 40"),
  ).toBeVisible();

  expect(
    screen.getByRole("progressbar"),
  ).toHaveAttribute(
    "aria-valuenow",
    "8",
  );

  expect(
    screen.getByRole("progressbar"),
  ).toHaveAttribute(
    "aria-valuemax",
    "40",
  );

  expect(
    screen.getByText(
      "32 questions remain to complete this exam.",
    ),
  ).toBeVisible();
});

test("Continue starts weekly checkout and preserves the exact exam resume", async () => {
  render(
    <FreeExamPaywall
      open
      examId={42}
      totalQuestions={50}
      completedQuestions={10}
      onOpenChange={jest.fn()}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", {
      name:
        `Continue from question 11 now ${EURO}6.99`,
    }),
  );

  await waitFor(() =>
    expect(createCheckout).toHaveBeenCalledWith(
      "RIJVIA_1_WEEK",
      "request-id",
      "en",
    ),
  );

  expect(
    checkoutRequestId,
  ).toHaveBeenCalledWith(
    "preview-user",
    "RIJVIA_1_WEEK",
  );

  expect(
    rememberExamCheckoutResume,
  ).toHaveBeenCalledWith(
    42,
    PURCHASE_ID,
  );

  expect(
    navigateToCheckout,
  ).toHaveBeenCalledWith(
    CHECKOUT_URL,
  );
});

test("the learner can change the selected plan", () => {
  render(
    <FreeExamPaywall
      open
      examId={42}
      totalQuestions={50}
      completedQuestions={10}
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

  expect(
    screen.getByRole("button", {
      name:
        `Continue from question 11 now ${EURO}2.99`,
    }),
  ).toBeVisible();
});