import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AxiosAdapter } from "axios";

import TheoryExamPage from "./page";
import { apiClient } from "@/lib/api";

const pushMock = jest.fn();
const requestUrls: string[] = [];

jest.mock("@/hooks/use-localized-router", () => ({
  useLocalizedRouter: () => ({ push: pushMock }),
}));

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({
    t: (key: string, values?: Record<string, string | number>) =>
      key === "exam.duration_value"
        ? `${values?.minutes} min ${values?.seconds} sec`
        : key,
    language: "ar",
  }),
}));

jest.mock("@/components/localized-link", () => {
  return function MockLink({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock("@/components/ui/service-unavailable-banner", () => ({
  ServiceUnavailableBanner: () => <div>service unavailable</div>,
}));

const client = apiClient.getInstance();
const originalAdapter = client.defaults.adapter;

const examResponse = {
  examId: 42,
  totalQuestions: 50,
  timeLimitMinutes: 12.5,
  timeLimitSeconds: 750,
  status: "IN_PROGRESS",
  startedAt: "2026-07-28T10:00:00Z",
  expiresAt: "2026-07-28T10:12:30Z",
  questions: [],
};

function examAdapter(active: boolean): AxiosAdapter {
  return async (config) => {
    const url = config.url ?? "";
    requestUrls.push(`${config.method?.toUpperCase()} ${url}`);

    if (url === "/exams/simulations/active") {
      return {
        data: {
          hasActiveExam: active,
          activeExam: active ? examResponse : null,
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        request: {},
      };
    }

    if (url === "/exams/simulations/start") {
      return {
        data: examResponse,
        status: 201,
        statusText: "Created",
        headers: {},
        config,
        request: {},
      };
    }

    throw new Error(`Unexpected request: ${url}`);
  };
}

describe("TheoryExamPage persistent exam flow", () => {
  beforeEach(() => {
    pushMock.mockReset();
    requestUrls.length = 0;
    localStorage.clear();
  });

  afterAll(() => {
    client.defaults.adapter = originalAdapter;
  });

  it("starts the persisted exam and opens its durable route", async () => {
    client.defaults.adapter = examAdapter(false);
    render(<TheoryExamPage />);

    expect(document.querySelector('[dir="rtl"]')).toBeInTheDocument();
    expect(screen.getByText("12 min 30 sec")).toBeVisible();

    const startButton = await screen.findByRole("button", {
      name: "practice_exam.start_btn",
    });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/exam/42");
    });

    expect(requestUrls).toContain("POST /exams/simulations/start");
    expect(requestUrls.join("\n")).not.toContain("/quiz/theory-exam");
    expect(JSON.parse(localStorage.getItem("current_exam") ?? "{}")).toEqual(
      examResponse,
    );
  });

  it("resumes an existing persisted exam without creating a duplicate", async () => {
    client.defaults.adapter = examAdapter(true);
    render(<TheoryExamPage />);

    const resumeButton = await screen.findByRole("button", {
      name: "exam.back_to_exam_start",
    });
    fireEvent.click(resumeButton);

    expect(pushMock).toHaveBeenCalledWith("/exam/42");
    expect(requestUrls).not.toContain("POST /exams/simulations/start");
  });
});
