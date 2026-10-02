import { act, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";

import { AccountAccessCard } from "./account-access-card";
import { translateMessage } from "@/lib/messages";
import { getAccountAccess } from "@/services/paymentService";

let mockLanguage: "en" | "ar" = "en";

jest.mock("@/services/paymentService", () => ({
  ...jest.requireActual("@/services/paymentService"),
  getAccountAccess: jest.fn(),
}));

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ user: { role: "USER" } }),
}));

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({
    language: mockLanguage,
    isRTL: mockLanguage === "ar",
    t: (
      key: string,
      params?: Record<string, string | number>,
    ) => translateMessage(mockLanguage, key, params),
  }),
}));

jest.mock("@/components/localized-link", () => ({
  __esModule: true,
  default: (
    props: AnchorHTMLAttributes<HTMLAnchorElement>,
  ) => <a {...props} />,
}));

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-09-21T08:00:00Z"));
  mockLanguage = "en";
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

test("shows the paid package, remaining access, expiry and extension CTA", async () => {
  jest.mocked(getAccountAccess).mockResolvedValue({
    active: true,
    status: "ACTIVE",
    plan: "RIJVIA_1_WEEK",
    expiresAt: "2026-09-28T10:00:00+02:00",
  });

  render(<AccountAccessCard />);

  await act(async () => {
    await Promise.resolve();
  });

  expect(screen.getAllByText("Paid").length).toBeGreaterThan(0);
  expect(screen.getByText("1 week")).toBeVisible();
  expect(screen.getByText("7d 0h")).toBeVisible();
  expect(
    screen.getByRole("link", { name: "Extend access" }),
  ).toHaveAttribute("href", "/#pricing");
});

test("shows free account state and package CTA without inventing paid access", async () => {
  jest.mocked(getAccountAccess).mockResolvedValue({
    active: false,
    status: "FREE",
    plan: null,
    expiresAt: null,
  });

  render(<AccountAccessCard />);

  await act(async () => {
    await Promise.resolve();
  });

  expect(screen.getAllByText("Free").length).toBeGreaterThan(0);
  expect(screen.queryByText("1 week")).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "View packages & pricing" }),
  ).toHaveAttribute("href", "/#pricing");
});

test("shows expired access and keeps the renewal path visible", async () => {
  jest.mocked(getAccountAccess).mockResolvedValue({
    active: false,
    status: "EXPIRED",
    plan: "RIJVIA_3_DAYS",
    expiresAt: "2026-09-20T10:00:00+02:00",
  });

  render(<AccountAccessCard />);

  await act(async () => {
    await Promise.resolve();
  });

  expect(screen.getAllByText("Expired").length).toBeGreaterThan(0);
  expect(screen.getByText("3 days")).toBeVisible();
  expect(screen.getByRole("link", { name: "Renew access" })).toHaveAttribute(
    "href",
    "/#pricing",
  );
});

test("changes an active response to expired when its deadline passes", async () => {
  jest.mocked(getAccountAccess).mockResolvedValue({
    active: true,
    status: "ACTIVE",
    plan: "RIJVIA_3_DAYS",
    expiresAt: "2026-09-21T09:00:00+02:00",
  });

  render(<AccountAccessCard />);

  await act(async () => {
    await Promise.resolve();
  });

  expect(screen.getAllByText("Expired").length).toBeGreaterThan(0);
  expect(screen.getByRole("link", { name: "Renew access" })).toBeVisible();
});
