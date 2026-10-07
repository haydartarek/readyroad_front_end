import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import CategoryExamMode from "./category-exam-mode";
import { getAccountAccess } from "@/services/paymentService";
import { getCategoryExam, getCategoryExamSummary, answerCategoryExam } from "@/services/theoryCategoryExamService";
import { translateMessage } from "@/lib/messages";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ usePathname: () => "/en/exam",
  useParams: () => ({ categoryCode: "TH01" }) }));
jest.mock("@/hooks/use-localized-router", () => ({ useLocalizedRouter: () => ({ push: mockPush }) }));
jest.mock("@/contexts/auth-context", () => ({ useAuth: () => ({
  isAuthenticated: true, isLoading: false, user: { username: "learner" },
}) }));
jest.mock("@/contexts/language-context", () => ({ useLanguage: () => ({
  language: "en", isRTL: false, t: (key: string, params?: Record<string, string | number>) => translateMessage("en", key, params),
}) }));
jest.mock("@/services/paymentService", () => ({ getAccountAccess: jest.fn() }));
jest.mock("@/services/theoryCategoryExamService", () => ({
  getCategoryExam: jest.fn(), getCategoryExamSummary: jest.fn(), answerCategoryExam: jest.fn(),
}));
jest.mock("@/components/exam/free-exam-paywall", () => ({ FreeExamPaywall: ({ open }: { open: boolean }) =>
  open ? <div role="dialog">Purchase plans</div> : null }));
jest.mock("@/components/ui/page-loading", () => ({ PageLoading: () => <p>Loading</p> }));
jest.mock("@/components/localized-link", () => ({ __esModule: true,
  default: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a> }));

const summary = { categoryCode: "TH01", nameEn: "Priority", nameAr: "الأولوية", nameNl: "Voorrang",
  nameFr: "Priorité", questionCount: 67, primary: true, displayOrder: 1 };
const questions = Array.from({ length: 67 }, (_, index) => ({ id: index + 1,
  questionEn: `Question ${index + 1}`, questionAr: "سؤال", questionNl: "Vraag", questionFr: "Question",
  difficultyLevel: "EASY", options: [{ id: 1, optionTextEn: "First answer" }, { id: 2, optionTextEn: "Second answer" }] }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getAccountAccess).mockResolvedValue({ active: true, status: "ACTIVE", plan: "RIJVIA_1_WEEK",
    expiresAt: new Date(Date.now() + 60_000).toISOString() });
  jest.mocked(getCategoryExamSummary).mockResolvedValue(summary);
  jest.mocked(getCategoryExam).mockResolvedValue({ category: summary, questions,
    serverTime: new Date().toISOString() } as Awaited<ReturnType<typeof getCategoryExam>>);
});
afterEach(() => jest.useRealTimers());

test.each(["FREE", "EXPIRED"] as const)("%s learners see plans without requesting question content", async (status) => {
  jest.mocked(getAccountAccess).mockResolvedValue({ active: false, status, plan: null, expiresAt: null });
  render(<CategoryExamMode categoryCode="TH07" />);
  expect(await screen.findByRole("dialog")).toHaveTextContent("Purchase plans");
  expect(getCategoryExam).not.toHaveBeenCalled();
  expect(screen.queryByText("Question 1")).not.toBeInTheDocument();
});

test("paid learners get a dynamic 67-question exam and no answer feedback before completion", async () => {
  jest.mocked(answerCategoryExam).mockResolvedValue({ questionId: 1, isCorrect: true, correctOptionId: 1 });
  render(<CategoryExamMode categoryCode="TH07" />);
  expect(await screen.findByText("Question 1")).toBeInTheDocument();
  expect(screen.getByTestId("exam-question-counter")).toHaveTextContent("1 / 67");
  fireEvent.click(screen.getByRole("button", { name: /First answer/ }));
  fireEvent.click(screen.getByRole("button", { name: "Next question" }));
  expect(await screen.findByText("Question 2")).toBeInTheDocument();
  expect(answerCategoryExam).toHaveBeenCalledWith("TH07", 1, 1);
  expect(screen.getByTestId("exam-question-counter")).toHaveTextContent("2 / 67");
});

test("staff with unlimited access do not need an expiry date", async () => {
  jest.mocked(getAccountAccess).mockResolvedValue({ active: true, status: "ACTIVE", unlimited: true,
    plan: null, expiresAt: null });
  render(<CategoryExamMode categoryCode="TH07" />);
  expect(await screen.findByText("Question 1")).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("category questions use the simulator layout with Next inside and secondary actions below status", async () => {
  render(<CategoryExamMode categoryCode="TH07" />);
  await screen.findByText("Question 1");
  const card = screen.getByTestId("exam-main-card");
  const status = screen.getByTestId("exam-status-card");
  const actions = screen.getByTestId("exam-actions");
  expect(within(card).getByTestId("exam-next")).toBeDisabled();
  expect(card).not.toContainElement(actions);
  expect(status.compareDocumentPosition(actions)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(actions.children).toHaveLength(2);
  expect(actions).toHaveClass("grid-cols-2", "border-t", "pt-5");
  expect(screen.getByTestId("exam-question-title")).toHaveClass("max-lg:text-base");
  expect(status).toHaveClass("py-2");
  expect(screen.queryByTestId("exam-timer-slot")).not.toBeInTheDocument();
});

test("an empty category preserves its heading and empty state instead of showing exam controls", async () => {
  jest.mocked(getCategoryExam).mockResolvedValue({ category: { ...summary, questionCount: 0 },
    questions: [], serverTime: new Date().toISOString() });
  render(<CategoryExamMode categoryCode="TH07" />);
  await screen.findByText("No questions are currently available in this category.");
  expect(screen.getByRole("heading", { name: "Priority", level: 1 })).toBeInTheDocument();
  expect(screen.queryByTestId("exam-next")).not.toBeInTheDocument();
  expect(screen.queryByTestId("exam-actions")).not.toBeInTheDocument();
});

test("expiry removes questions at the deadline without waiting for another answer", async () => {
  jest.useFakeTimers();
  jest.mocked(getAccountAccess).mockResolvedValue({ active: true, status: "ACTIVE", plan: "RIJVIA_3_DAYS",
    expiresAt: new Date(Date.now() + 1000).toISOString() });
  render(<CategoryExamMode categoryCode="TH07" />);
  await screen.findByText("Question 1");
  fireEvent.click(screen.getByTestId("category-exam-finish"));
  expect(screen.getByRole("dialog", { name: "Leave Exam?" })).toBeInTheDocument();
  await act(async () => {
    jest.advanceTimersByTime(1500);
    await Promise.resolve();
  });
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.queryByRole("dialog", { name: "Leave Exam?" })).not.toBeInTheDocument();
  expect(screen.queryByText("Question 1")).not.toBeInTheDocument();
  expect(answerCategoryExam).not.toHaveBeenCalled();
});

test("a backend denial during an answer locks even previously loaded questions", async () => {
  jest.mocked(answerCategoryExam).mockRejectedValue({ response: { status: 403 } });
  render(<CategoryExamMode categoryCode="TH07" />);
  await screen.findByText("Question 1");
  fireEvent.click(screen.getByRole("button", { name: /First answer/ }));
  fireEvent.click(screen.getByRole("button", { name: "Next question" }));
  await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
  expect(screen.queryByText("Question 1")).not.toBeInTheDocument();
});

test("reporting reuses the contact link and cancelling early finish preserves the selected answer", async () => {
  render(<CategoryExamMode categoryCode="TH07" />);
  await screen.findByText("Question 1");
  expect(screen.getByTestId("category-exam-report-question")).toHaveAttribute("href", "/contact");
  fireEvent.click(screen.getByRole("button", { name: /First answer/ }));
  fireEvent.click(screen.getByTestId("category-exam-finish"));
  expect(screen.getByRole("dialog", { name: "Leave Exam?" })).toBeInTheDocument();
  expect(screen.queryByText("Category exam result")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Stay" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByTestId("exam-question-counter")).toHaveTextContent("1 / 67");
  expect(screen.getByRole("button", { name: "Next question" })).toBeEnabled();
  expect(answerCategoryExam).not.toHaveBeenCalled();
});

test("confirming early finish does not submit the current selected answer", async () => {
  render(<CategoryExamMode categoryCode="TH07" />);
  await screen.findByText("Question 1");
  fireEvent.click(screen.getByRole("button", { name: /First answer/ }));
  fireEvent.click(screen.getByTestId("category-exam-finish"));
  fireEvent.click(screen.getByRole("button", { name: "Leave Exam" }));
  expect(answerCategoryExam).not.toHaveBeenCalled();
  expect(screen.getByText("Category exam result")).toBeInTheDocument();
  expect(screen.getByText("0 / 67", { selector: "p" })).toBeInTheDocument();
  expect(screen.queryByTestId("category-exam-finish")).not.toBeInTheDocument();
});

test("early finish retains previously submitted answers and restarting resets the dialog", async () => {
  jest.mocked(answerCategoryExam).mockResolvedValue({ questionId: 1, isCorrect: true, correctOptionId: 1,
    explanationEn: "Submitted answer explanation" });
  render(<CategoryExamMode categoryCode="TH07" />);
  await screen.findByText("Question 1");
  fireEvent.click(screen.getByRole("button", { name: /First answer/ }));
  fireEvent.click(screen.getByRole("button", { name: "Next question" }));
  await screen.findByText("Question 2");
  fireEvent.click(screen.getByRole("button", { name: /Second answer/ }));
  fireEvent.click(screen.getByTestId("category-exam-finish"));
  fireEvent.click(screen.getByRole("button", { name: "Leave Exam" }));
  expect(answerCategoryExam).toHaveBeenCalledTimes(1);
  expect(answerCategoryExam).toHaveBeenCalledWith("TH07", 1, 1);
  expect(screen.getByText("1 / 67", { selector: "p" })).toBeInTheDocument();
  expect(screen.getByText("Submitted answer explanation")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "New category exam" }));
  await waitFor(() => expect(screen.getByTestId("exam-question-counter")).toHaveTextContent("1 / 67"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next question" })).toBeDisabled();
});

test("the last question still submits and finishes through the primary action without confirmation", async () => {
  jest.mocked(getCategoryExam).mockResolvedValue({ category: { ...summary, questionCount: 1 },
    questions: questions.slice(0, 1), serverTime: new Date().toISOString() } as Awaited<ReturnType<typeof getCategoryExam>>);
  jest.mocked(answerCategoryExam).mockResolvedValue({ questionId: 1, isCorrect: true, correctOptionId: 1 });
  render(<CategoryExamMode categoryCode="TH07" />);
  await screen.findByText("Question 1");
  fireEvent.click(screen.getByRole("button", { name: /First answer/ }));
  fireEvent.click(screen.getByRole("button", { name: "Finish exam" }));
  await screen.findByText("Category exam result");
  expect(answerCategoryExam).toHaveBeenCalledWith("TH07", 1, 1);
  expect(screen.getByText("1 / 1", { selector: "p" })).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
