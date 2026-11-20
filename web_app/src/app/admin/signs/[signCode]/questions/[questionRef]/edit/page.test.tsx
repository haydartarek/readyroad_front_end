import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EditSignQuestionPage from "./page";
import { apiClient } from "@/lib/api";

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useParams: () => ({ signCode: "A7a", questionRef: "A7a_Q01" }),
  useSearchParams: () => new URLSearchParams("returnTo=%2Fadmin%2Fsigns%3Fpage%3D2"),
}));
jest.mock("@/hooks/use-localized-router", () => ({ useLocalizedRouter: () => ({ push }) }));
jest.mock("@/contexts/language-context", () => ({ useLanguage: () => ({
  isRTL: false, t: (key: string, params?: { number?: number }) =>
    params?.number ? `${key} ${params.number}` : key,
}) }));
jest.mock("@/components/localized-link", () => ({ __esModule: true,
  default: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
}));
jest.mock("@/lib/api", () => ({ apiClient: { get: jest.fn(), put: jest.fn() }, logApiError: jest.fn() }));

const translation = (question: string) => ({ question, explanation: "Explanation", choices: [
  { text: "Correct", is_correct: true }, { text: "Other", is_correct: false },
] });
const source = { question_id: "A7a_Q01", type: "IS_IT_ALLOWED", difficulty: "EASY",
  is_critical: false, show_sign: true, i18n: {
    EN: translation("English question"), AR: translation("Arabic question"),
    NL: translation("Dutch question"), FR: translation("French question"),
  } };

test("edits a sign question through the canonical source endpoint and returns to the filtered list", async () => {
  jest.mocked(apiClient.get).mockResolvedValue({ data: { question: source, revision: "version-one" } } as never);
  jest.mocked(apiClient.put).mockResolvedValue({ data: { question: source, revision: "version-two" } } as never);
  render(<EditSignQuestionPage />);

  const question = await screen.findByDisplayValue("English question");
  fireEvent.change(question, { target: { value: "Updated English question" } });
  fireEvent.click(screen.getByRole("button", { name: "admin.quizzes.form.update" }));

  await waitFor(() => expect(apiClient.put).toHaveBeenCalledWith(
    "/admin/sign-quiz/signs/A7a/questions/A7a_Q01",
    expect.objectContaining({ revision: "version-one", question: expect.objectContaining({
      i18n: expect.objectContaining({ EN: expect.objectContaining({ question: "Updated English question" }) }),
    }) }),
  ));
  expect(push).toHaveBeenCalledWith("/admin/signs?page=2");
});
