import { act, fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { CheckoutSuccess } from "./checkout-success";
import { CheckoutCancel } from "./checkout-cancel";
import { PlanSelection } from "./plan-selection";
import { translateMessage } from "@/lib/messages";
import { createCheckout, getPurchaseStatus, forgetCheckoutRequest, rememberExamCheckoutResume } from "@/services/paymentService";

jest.mock("@/services/paymentService", () => ({
  ...jest.requireActual("@/services/paymentService"),
  createCheckout: jest.fn(), getPurchaseStatus: jest.fn(), forgetCheckoutRequest: jest.fn(),
}));
const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockLocale: "ar" | "nl" | "fr" | "en" = "en";
let mockAuthenticated = true;
const mockUser = { username: "payment-fixture" };
const id = "1c0c5a1b-9ab6-4f59-a9ac-31a87910fc64";
let mockQuery = `purchaseId=${id}&session_id=untrusted`;
jest.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(mockQuery) }));
jest.mock("@/hooks/use-localized-router", () => ({ useLocalizedRouter: () => ({ push: mockPush, replace: mockReplace }) }));
jest.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ user: mockUser, isAuthenticated: mockAuthenticated, isLoading: false }) }));
jest.mock("@/contexts/language-context", () => ({ useLanguage: () => ({
  language: mockLocale, isRTL: mockLocale === "ar", t: (key: string, params?: Record<string, string | number>) => translateMessage(mockLocale, key, params),
}) }));
jest.mock("@/components/localized-link", () => ({ __esModule: true, default: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} /> }));

const pending = { purchaseId: id, status: "PENDING" as const, plan: "RIJVIA_3_DAYS" as const, expiresAt: null };
const paid = { ...pending, status: "PAID" as const, expiresAt: "2026-10-01T14:00:00+02:00" };

beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks(); mockReplace.mockReset(); sessionStorage.clear();
  mockLocale = "en"; mockAuthenticated = true; mockQuery = `purchaseId=${id}&session_id=untrusted`;
  jest.mocked(getPurchaseStatus).mockResolvedValue(pending);
  Object.defineProperty(globalThis.crypto, "randomUUID", { configurable: true, value: jest.fn(() => "865d2812-991c-43f3-8fc5-4c09d4f9b964") });
});
afterEach(() => { jest.useRealTimers(); });

test("polls the owned purchase, ignores session_id, then displays confirmed plan and CTAs", async () => {
  jest.mocked(getPurchaseStatus).mockResolvedValueOnce(pending).mockResolvedValueOnce(paid);
  render(<CheckoutSuccess />);
  await act(async () => { await jest.advanceTimersByTimeAsync(0); });
  expect(getPurchaseStatus).toHaveBeenCalledWith(id, expect.any(AbortSignal));
  expect(screen.queryByText("Payment confirmed.")).not.toBeInTheDocument();
  await act(async () => { await jest.advanceTimersByTimeAsync(1500); });
  expect(screen.getByText("Payment confirmed.")).toBeVisible();
  expect(screen.getByText("3 days")).toBeVisible();
  expect(screen.getByRole("link", { name: "Start Training" })).toHaveAttribute("href", "/practice");
  expect(screen.getByRole("link", { name: "Start Exam Simulator" })).toHaveAttribute("href", "/exam");
  expect(forgetCheckoutRequest).toHaveBeenCalledWith(mockUser.username, "RIJVIA_3_DAYS");
  await act(async () => { await jest.advanceTimersByTimeAsync(20_000); });
  expect(getPurchaseStatus).toHaveBeenCalledTimes(2);
});

test("timeout is still confirming, including network failures, and stops polling", async () => {
  jest.mocked(getPurchaseStatus).mockRejectedValue(new Error("offline"));
  render(<CheckoutSuccess />);
  await act(async () => { await jest.advanceTimersByTimeAsync(15_000); });
  expect(screen.getByRole("status")).toHaveTextContent("still confirming");
  const calls = jest.mocked(getPurchaseStatus).mock.calls.length;
  await act(async () => { await jest.advanceTimersByTimeAsync(10_000); });
  expect(getPurchaseStatus).toHaveBeenCalledTimes(calls);
});

test("an untrusted session id cannot activate a missing or invalid purchase", () => {
  mockQuery = "session_id=cs_anything&purchaseId=invalid";
  render(<CheckoutSuccess />);
  expect(getPurchaseStatus).not.toHaveBeenCalled();
  expect(screen.getByRole("status")).toHaveTextContent("expired or is invalid");
  expect(screen.queryByRole("link", { name: "Start Training" })).not.toBeInTheDocument();
});

test("FAILED shows retry and never success", async () => {
  jest.mocked(getPurchaseStatus).mockResolvedValue({ ...pending, status: "FAILED" });
  render(<CheckoutSuccess />);
  await act(async () => { await jest.advanceTimersByTimeAsync(0); });
  expect(screen.getByRole("status")).toHaveTextContent("not completed");
  expect(screen.getByRole("link", { name: "Back to plans" })).toHaveAttribute("href", "/plans");
});

test("unmount cancels in-flight polling", async () => {
  const view = render(<CheckoutSuccess />);
  await act(async () => { await jest.advanceTimersByTimeAsync(0); });
  const signal = jest.mocked(getPurchaseStatus).mock.calls[0][1];
  view.unmount();
  expect(signal?.aborted).toBe(true);
  await act(async () => { await jest.advanceTimersByTimeAsync(20_000); });
  expect(getPurchaseStatus).toHaveBeenCalledTimes(1);
});

test("Arabic cancellation keeps RTL and returns to plan selection", () => {
  mockLocale = "ar";
  render(<CheckoutCancel />);
  expect(screen.getByRole("main")).toHaveAttribute("dir", "rtl");
  expect(screen.getByRole("link")).toHaveAttribute("href", "/#pricing");
});

test("checkout retry retains its UUID and sends the current validated locale", async () => {
  mockLocale = "fr";
  jest.mocked(createCheckout).mockRejectedValue({ response: { status: 502 } });
  render(<PlanSelection />);
  const button = screen.getAllByRole("button")[0];
  await act(async () => { fireEvent.click(button); });
  await act(async () => { fireEvent.click(button); });
  const calls = jest.mocked(createCheckout).mock.calls;
  expect(calls).toHaveLength(2);
  expect(calls[0]).toEqual(["RIJVIA_3_DAYS", expect.any(String), "fr"]);
  expect(calls[1][1]).toBe(calls[0][1]);
});

test("double click cannot start concurrent requests", async () => {
  jest.mocked(createCheckout).mockImplementation(() => new Promise(() => {}));
  render(<PlanSelection />);
  await act(async () => { fireEvent.click(screen.getAllByRole("button")[0]); fireEvent.click(screen.getAllByRole("button")[0]); });
  expect(createCheckout).toHaveBeenCalledTimes(1);
});

test("unauthenticated buyer signs in before creating a purchase", () => {
  mockAuthenticated = false;
  render(<PlanSelection />);
  fireEvent.click(screen.getAllByRole("button")[0]);
  expect(mockPush).toHaveBeenCalledWith("/login?returnUrl=%2Fplans");
  expect(createCheckout).not.toHaveBeenCalled();
});

test("a confirmed exam paywall purchase resumes the exact same exam", async () => {
  rememberExamCheckoutResume(42, id);
  jest.mocked(getPurchaseStatus).mockResolvedValue(paid);

  render(<CheckoutSuccess />);

  await act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });

  expect(mockReplace).toHaveBeenCalledWith(
    "/exam/42",
  );
});