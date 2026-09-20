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

const PURCHASE_ID =
  "1c0c5a1b-9ab6-4f59-a9ac-31a87910fc64";

const CHECKOUT_URL =
  "https://checkout.stripe.com/test-session";

beforeEach(() => {
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

test("Continue starts weekly checkout and preserves the exact exam resume", async () => {
  render(
    <FreeExamPaywall
      open
      examId={42}
      onOpenChange={jest.fn()}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: "Continue securely",
    }),
  );

  await waitFor(() =>
    expect(createCheckout).toHaveBeenCalledWith(
      "RIJVIA_1_WEEK",
      "request-id",
      "en",
    ),
  );

  expect(checkoutRequestId).toHaveBeenCalledWith(
    "preview-user",
    "RIJVIA_1_WEEK",
  );

  expect(
    rememberExamCheckoutResume,
  ).toHaveBeenCalledWith(
    42,
    PURCHASE_ID,
  );

  expect(navigateToCheckout).toHaveBeenCalledWith(
    CHECKOUT_URL,
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